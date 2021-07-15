const pageResults = require('graph-results-pager')

const { graphAPIEndpoints, tokenAddresses} = require('./../constants')
const { request, gql } = require('graphql-request')
const { pairsPrices, pairData, tokensPrices, nativeCurrencyDollarValue } = require('./wallet')

module.exports = {
	async info({ chain_id = '100' } = {}) {
		if(graphAPIEndpoints[chain_id].honeyfarm == '') {
			return {}
		}
		const result = await request(
			graphAPIEndpoints[chain_id].honeyfarm,
			gql`{
                    honeyFarms {
                        ${info.properties.toString()}
                    }
                }`,
		);
		return info.callback(result.honeyFarms[0]);
	},

	async pools({ chain_id = '100' } = {}) {
		if(graphAPIEndpoints[chain_id].honeyfarm == '') {
			return []
		}
		return pageResults({
			api: graphAPIEndpoints[chain_id].honeyfarm,
			query: {
				entity: 'pools',
				properties: pools.properties,
			},
		})
			.then(results => pools.callback(results))
			.catch(err => console.log(err));
	},

	async deposits({ user_address = undefined, chain_id = '100' } = {}) {
		if(graphAPIEndpoints[chain_id].honeyfarm == '') {
			return []
		}
		const results =  await pageResults({
			api: graphAPIEndpoints[chain_id].honeyfarm,
			query: {
				entity: 'deposits',
				selection: {
					where: {
						user: `\\"${user_address.toLowerCase()}\\"`,
						status: 'Open',
					},
				},
				properties: deposits.properties,
			},
		})
			.then(results => {return results})
			.catch(err => console.log(err));

		const pairs = [];
		const depositsById = {};

		results.forEach( deposit => {
			if(!depositsById[deposit.pool.id]) {
				depositsById[deposit.pool.id] = [];
			}
			depositsById[deposit.pool.id].push( deposit );
			pairs.push(deposit.pool.id.valueOf());
		})

		const pairInfo = await pairsPrices({pairs, chain_id});

		pairInfo.forEach( pair => {
			depositsById[pair.id.toLowerCase()].forEach( deposit => {
				deposit.pairInfo = pair;
			});
		})

		return deposits.callback(results)
	},

	async hsfTokens({ chain_id = '100' } = {}) {
		const address = tokenAddresses[chain_id].comb
		const { hsfToken } = await request(
			graphAPIEndpoints[chain_id].honeyfarm,
			gql`
				query hsfToken($id: ID!) {
					hsfToken (id: $id) {
						id,
						totalSupply,
						totalHsfHarvested,
						totalHsfBurned,
						totalHsfClaimed,
						holders
					}
				}
			`,
			{ id: address }
		)

		return hsfToken
	},

	async hsfTokenBurns ({ chain_id = '100' } = {}) {
		BigInt.prototype.toJSON = function () { return this.toString() };
		const offset = 604800000;
		const now = new Date().getMilliseconds() - offset;
		const { hsfTokenBurns } = await request(
			graphAPIEndpoints[chain_id].honeyfarm,
			gql`
				query hsfTokenBurns($time: BigInt) {
					hsfTokenBurns(where: {timestamp_gte: $time}) {
						amount
					}
				}
			`,
			{ time: BigInt(now) }
		);

		const burns = hsfTokenBurns.reduce((a, b) => BigInt(a) + BigInt(b.amount), 0);

		return burns;
	},

	async apys({ chain_id = '100'} = {}) {
		const info = await module.exports.info({chain_id});
		const pools = await module.exports.pools({chain_id});

		if(pools === undefined || pools.length === 0) {
			return []
		}

		const now = Math.floor(new Date().getTime() / 1000);
		const startTime = info.startTime.getTime() / 1000;
		const endTime = info.endTime.getTime() / 1000;

		const from = BigInt(now - startTime);
		const to = BigInt(endTime - startTime);

		const startDistribution = BigInt(info.startDistribution);

		const distributionSlope = BigInt(info.distributionSlope);
		const scale = BigInt(info.scale);

		const getHsfInTime = (from, to) => {return ((to - from) * ( 2n * startDistribution - (distributionSlope * (from + to)))) / 2n};
		//const hsfInTime = ((to - from) * (2n * startDistribution - (distributionSlope * (from + to)))) / 2n;
		const hsfInTime = getHsfInTime(from, to);

		//get the pool pair addresses and fetch pool data from honeyswap
		poolIds = [];
		pools.forEach(pool => poolIds.push(pool.pair));

		const pairIds = [];
		const liquidityPositions = [];
		const liquidityPositionsById = {};
		pools.forEach( pool => {
			pairIds.push(pool.pair);
			const position = {
				liquidityTokenBalance: pool.balance,
				address: pool.pair.toLowerCase(),
				pair: undefined,
			};
			liquidityPositionsById[pool.pair.toLowerCase()] = position;
		});

		const pairPrices = await pairsPrices({pairs: pairIds, chain_id});

		const pairsById = {};
		pairPrices.forEach( pair => {
			const position = liquidityPositionsById[pair.id.toLowerCase()];
			position.pair = pair;
			liquidityPositions.push(position);
			pairsById[pair.id.toLowerCase()] = pair;

		});


		// const data = await pairData(liquidityPositions, 'Tulip', chain_id);
		const nativeCurrencyDollar = await nativeCurrencyDollarValue(chain_id)

		const combData = await tokensPrices({tokens: [tokenAddresses[chain_id].comb], chain_id}).then(result => result[0]);
		let combPrice = 0
		if(combData !== undefined) {
			combPrice = combData.derivedNativeCurrency * nativeCurrencyDollar
		}

		const hsfInDay = getHsfInTime(from, from + 3600n * 24n);
		const hsfScaled = Number(hsfInTime / scale) / info.scale;
		const hsfInDayScaled = Number(hsfInDay / scale) / info.scale;

		const hsfInYearUsd = hsfInDayScaled * 365 * combPrice;
		const hsfInDayUsd = hsfInDayScaled * combPrice;

		//filter out pairs that don't exist on honeyswap and remove their allocation
		let totalAllocPoint = info.totalAllocPoint;
		const results = pools.filter( item => {
			const pairInfo = pairsById[item.pair.toLowerCase()];
			if (pairInfo && pairInfo.token0 !== undefined) {
				return true;
			} else {
				// totalAllocPoint -= item.allocPoint
				return false
			}
		});


		results.forEach((pool, index, object) => {
			const pairInfo = pairsById[pool.pair.toLowerCase()];
			const poolTotalUSD = pairInfo.reserveUSD / pairInfo.totalSupply * pool.balance;

			const poolHsfInYearUSD  = hsfInYearUsd / totalAllocPoint * pool.allocPoint;
			const poolHsfInDayUSD = hsfInDayUsd / totalAllocPoint * pool.allocPoint;

			let averageMultiplier = 1;
			if(pool.totalShares > 0 && pool.balance) {
				averageMultiplier = pool.totalShares / pool.balance;
			}

			pool.hsfInPool = hsfScaled / totalAllocPoint * pool.allocPoint / averageMultiplier;
			pool.baseApy = 0;
			pool.totalApy = 0;
			pool.pairInfo = pairInfo;
			pool.hsf24h = hsfInDayScaled / totalAllocPoint * pool.allocPoint /averageMultiplier;

			if(poolHsfInYearUSD > 0) {
				pool.rewardApy = (poolHsfInYearUSD / poolTotalUSD * 100) / averageMultiplier;
			} else {
				pool.rewardApy = 0;
			}

			if(poolHsfInDayUSD > 0) {
				pool.rewardApy24h = (poolHsfInDayUSD / poolTotalUSD * 100) / averageMultiplier;
			} else {
				pool.rewardApy24h = 0;
			}

		});

		return results;
	},
};



const info = {
	properties: [
		'id',
		'owner',
		'startTime',
		'endTime',
		'minTimeLock',
		'maxTimeLock',
		'hsf',
		'totalHsf',
		'totalAllocPoint',
		'timeLockMultiplier',
		'timeLockConstant',
		'startDistribution',
		'distributionSlope',
		'scale',
		'poolCount',
		'updatedAt',
	],

	callback(results) {
		return {
			id: results.id,
			owner: results.owner,
			startTime: new Date(results.startTime * 1000),
			endTime: new Date(results.endTime * 1000),
			minTimeLock: results.minTimeLock,
			maxTimeLock: results.maxTimeLock,
			hsf: results.hsf,
			totalHsf: results.totalHsf,
			timeLockMultiplier: results.timeLockMultiplier,
			timeLockConstant: results.timeLockConstant,
			startDistribution: results.startDistribution,
			distributionSlope: results.distributionSlope,
			scale: results.scale,
			totalAllocPoint: Number(results.totalAllocPoint),
			poolCount: Number(results.poolCount),
			updatedAt: new Date(results.updatedAt * 1000),
		};
	},
};

const pools = {
	properties: [
		'id',
		'balance',
		'openDepositCount',
		'allocPoint',
		'lastRewardTimestamp',
		'accHsfPerShare',
		'totalShares',
		'timestamp',
		'block',
		'updatedAt'
	],

	callback(results) {
		return results.map(
			({
				id,
				balance,
				openDepositCount,
				allocPoint,
				lastRewardTimestamp,
				accHsfPerShare,
				totalShares,
				timestamp,
				block,
				updatedAt
			}) => ({
				pair: id,
				balance: Number(balance) / 1e18,
				openDepositCount: Number(openDepositCount),
				allocPoint: Number(allocPoint),
				lastRewardTimestamp: new Date(lastRewardTimestamp * 1000),
				accHsfPerShare: Number(accHsfPerShare),
				totalShares: Number(totalShares) / 1e18,
				addedDate: new Date(timestamp * 1000),
				addedBlock: Number(block),
				updatedAt: new Date(updatedAt * 1000)
			}),
		);
	},
};

const deposits = {
	properties: [
		'id',
		'user { id }',
		'pool { id }',
		'amount',
		'rewardDebt',
		'unlockTime',
		'rewardShare',
		'setRewards',
		'referrer',
		'timestamp',
		'block',
		'status',
	],

	callback(results) {
		return results.map(
			({
				id,
				user,
				pool,
				amount,
				rewardDebt,
				unlockTime,
				rewardShare,
				setRewards,
				pairInfo,
				referrer,
				timestamp,
				block,
				status,
			}) => ({
				id: id,
				user: user.id,
				pool: pool.id,
				amount: Number(amount) / 1e18,
				rewardDebt: Number(rewardDebt) / 1e18 / 1e18,
				unlockTime: new Date(unlockTime * 1000),
				rewardShare: Number(rewardShare) / 1e18,
				setRewards: Number(setRewards),
				pairInfo: pairInfo,
				referrer: referrer,
				addedDate: new Date(timestamp * 1000),
				addedBlock: Number(block),
				status: status,
			}),
		);
	},
};
