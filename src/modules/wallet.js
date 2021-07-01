const fetch = require('node-fetch')

const pageResults = require('graph-results-pager')

const {
  multicallAddresses,
  graphAPIEndpoints,
  tokenLists,
  rpcEndpoints,
  nativeCurrency,
  tokenAddresses,
  supportedNetworks
} = require('./../constants')

const Multicall = require('@makerdao/multicall')

const tokens = {}
const tokensById = {}

module.exports = {
  async fetchTokenPrice (addresses, chainId) {
    const network = supportedNetworks[chainId]
    let addressString = ''

    addresses.forEach((address, idx, array) => {
      addressString += address
      if (idx !== array.length - 1) {
        addressString += ','
      }
    })

    const url = 'https://api.coingecko.com/api/v3/simple/token_price/' + network + '?contract_addresses=' + addressString + '&vs_currencies=usd'
    const data = await fetch(url, {
      methods: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(response => response.json())
    return data
  },
  // fetches the token list
  async tokens (chainId) {
    if (!chainId) {
      chainId = 100
    }
    if (tokens[chainId] && tokens[chainId].length > 0) {
      return tokens[chainId]
    } else {
      tokens[chainId] = []
    }
    const promises = []
    for (const [, value] of Object.entries(tokenLists)) {
      await promises.push(
        fetch(value, {
          methods: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }).then(response => response.json())
      )
    }

    if (!tokensById[chainId]) {
      tokensById[chainId] = []
    }
    // module.exports.tokensById(chainId) //init

    const results = await Promise.all(promises)
    results.forEach(result => {
      if (!result.tokens || result.tokens.length <= 0) return

      result.tokens.forEach(token => {
        if (Number(token.chainId) !== Number(chainId)) return
        if (tokensById[chainId][token.address.toLowerCase()]) return
        tokensById[chainId][token.address.toLowerCase()] = token
        tokens[chainId].push(token)
      })
    })
    return tokens[chainId]
  },

  async tokensById (chainId) {
    if (tokensById[chainId] && tokensById[chainId].length > 0) {
      return tokensById[chainId]
    } else {
      await module.exports.tokens(chainId)
    }

    return tokensById[chainId]
  },

  async nativeCurrencyDollarValue (chainId) {
    let data
    try {
      data = await module.exports.tokensPrices({
        tokens: [tokenAddresses[chainId].usdc],
        chain_id: chainId
      })
    } catch (e) {
      console.log('tulip-backend', e)
    }
    if (data && data[0] && data[0].derivedNativeCurrency) {
      return Number(data[0].derivedNativeCurrency)
    }
  },
  // gets a list of all non zero token balances in an wallet address
  async tokenBalances ({ user_address = undefined, chain_id = '100' } = {}) {
    if (!user_address) {
      throw new Error('tulip-data: User address undefined')
    }

    const tokens = await module.exports.tokens(chain_id)
    const multicallQuery = []

    tokens.forEach(token => {
      multicallQuery.push({
        target: token.address,
        call: ['balanceOf(address)(uint256)', user_address],
        returns: [[token.address, val => val / 10 ** token.decimals]]
      })
    })


    // fetch nativeCurrency balance
    multicallQuery.push({
      call: ['getEthBalance(address)(uint256)', user_address],
      returns: [['native_currency', val => val / 10 ** 18]]
    })

    const config = {
      rpcUrl: rpcEndpoints[chain_id],
      multicallAddress: multicallAddresses[chain_id]
    }

    const nonzeroBalances = {}
    let gqlIdQuery = ''

    try {
      await Multicall.aggregate(multicallQuery, config)
        .then(resultObject => {
          const gqlIds = []
          Object.entries(resultObject.results.transformed).forEach(
            ([key, value]) => {
              if (value !== 0) {
                nonzeroBalances[key.toLowerCase()] = value
                gqlIds.push('\\"' + key.toLowerCase() + '\\"')
              }
            }
          )

          gqlIdQuery = '[' + gqlIds.join(',') + ']'
        })
    } catch (err) {
      console.error(err)
      return
    }

    // get data from honeyswap
    const properties = ['id', 'symbol', 'derivedNativeCurrency']

    const tokenData = await pageResults({
      api: graphAPIEndpoints[chain_id].honeyswap,
      query: {
        entity: 'tokens',
        selection: {
          where: {
            id_in: gqlIdQuery
          }
        },
        properties: properties
      }
    })
      .then(results => {
        return results
      })
      .catch(err => console.log('graph error', err))

    const tokensById = {}
    tokens.forEach(entry => {
      tokensById[entry.address.toLowerCase()] = {
        address: entry.address.toLowerCase(),
        ...entry
      }
    })

    const nativeCurrencyDollarPrice = await module.exports.nativeCurrencyDollarValue(chain_id)

    const results = []
    tokenData.forEach(token => {
      const balance = Number(nonzeroBalances[token.id])
      const result = {
        ...tokensById[token.id],
        balance: balance.valueOf(),
        priceUSD: Number(token.derivedNativeCurrency) / Number(nativeCurrencyDollarPrice),
        valueUSD: Number(
          token.derivedNativeCurrency * nonzeroBalances[token.id]
        ) / Number(nativeCurrencyDollarPrice)
      }
      results.push(result)
    })

    // add the user wallet xdai balance
    if (nonzeroBalances.native_currency) {
      results.push({
        balance: nonzeroBalances.native_currency.valueOf(),
        priceUSD: 1,
        valueUSD: nonzeroBalances.native_currency,
        name: nativeCurrency[chain_id].name,
        symbol: nativeCurrency[chain_id].symbol,
        logoURI: tokensById[nativeCurrency[chain_id].wrappedAddress].logoURI // wxdai logo
      })
    }

    return tokenBalances.callback(results)
  },
  // TODO: add more exchanges/only works with honeyswap subgraph and tokenlist for now
  async poolBalances ({ user_address = undefined, chain_id = '100' } = {}) {
    if (!user_address) {
      throw new Error('tulip-data: User address undefined')
    }

    const properties = [
      'id',
      'liquidityPositions { liquidityTokenBalance, pair { id, token0 { id, symbol, name, derivedNativeCurrency }, token1 { id, symbol, name, derivedNativeCurrency }, reserve0, reserve1, reserveUSD, totalSupply} }'
    ]

    const poolData = await pageResults({
      api: graphAPIEndpoints[chain_id].honeyswap,
      query: {
        entity: 'users',
        selection: {
          where: {
            id: `\\"${user_address.toLowerCase()}\\"`
          }
        },
        properties: properties
      }
    })
      .then(results => {
        return results
      })
      .catch(err => console.log(err))

    if (poolData && poolData[0] && poolData[0].liquidityPositions) {
      const pairData = await module.exports.pairData(
        poolData[0].liquidityPositions,
        'Honeyswap',
        chain_id
      )
      return poolBalances.callback(pairData)
    }
  },
  async stakedBalances ({ user_address = undefined, chain_id = '100' } = {}) {
    const farm = require('./farm')

    const deposits = await farm.deposits({ user_address, chain_id })

    const pairIds = []
    const liquidityPositions = []
    const liquidityPositionsById = {}
    deposits.forEach(deposit => {
      pairIds.push(deposit.pool)
      const position = {
        liquidityTokenBalance: deposit.amount,
        address: deposit.pool.toLowerCase(),
        pair: undefined
      }
      if (!liquidityPositionsById[deposit.pool.toLowerCase()]) {
        liquidityPositionsById[deposit.pool.toLowerCase()] = []
      }
      liquidityPositionsById[deposit.pool.toLowerCase()].push(position)
    })
    const pairsPrices = await module.exports.pairsPrices({ pairs: pairIds, chain_id })

    pairsPrices.forEach(pair => {
      const positions = liquidityPositionsById[pair.id.toLowerCase()]
      positions.forEach(position => {
        position.pair = pair
        liquidityPositions.push(position)
      })
    })

    const pairData = await module.exports.pairData(liquidityPositions, 'Tulip', chain_id)

    return poolBalances.callback(pairData)
  },
  async simplyTokenBalances ({
    user_address = undefined,
    chain_id = '100',
    tokens = undefined,
    web3 = undefined
  } = {}) {
    if (!user_address) {
      throw new Error('tulip-data: User address undefined')
    }
    const multicallQuery = []

    tokens.forEach(token => {
      multicallQuery.push({
        target: token,
        call: ['balanceOf(address)(uint256)', user_address],
        returns: [[token]]
      })
    })

    const config = {
      web3: web3,
      multicallAddress: multicallAddresses[chain_id]
    }

    try {
      return await Multicall.aggregate(multicallQuery, config)
        .then(result => {
          return result.results.transformed
        })
    } catch (err) {
      console.error(err)
      return []
    }
  },
  async pairData (positions, platform, chainId) {
    const tokensById = []
    const tokens = await module.exports.tokens(chainId)

    tokens.forEach(token => {
      tokensById[token.address.toLowerCase()] = token
    })

    const nativeCurrencyDollarValue = await module.exports.nativeCurrencyDollarValue(chainId)

    const results = []
    positions.forEach(position => {
      let token0 = Object.assign({}, tokensById[position.pair.token0.id])
      if (!token0) {
        token0 = {
          name: position.pair.token0.name,
          symbol: position.pair.token0.symbol,
          address: position.pair.token0.id,
          logoURI: null
        }
      }
      let token1 = Object.assign({}, tokensById[position.pair.token1.id])
      if (!token1) {
        token1 = {
          name: position.pair.token1.name,
          symbol: position.pair.token1.symbol,
          address: position.pair.token1.id,
          logoURI: null
        }
      }

      /*
      get liquidity value of single token

      getLiquidityValue()
      from: https://github.com/Uniswap/uniswap-v2-sdk/blob/main/src/entities/pair.ts
      JSBI.divide(JSBI.multiply(liquidity.raw, this.reserveOf(token).raw), totalSupplyAdjusted.raw)

      let liquidityValueUSD = position.liquidityTokenBalance * position.pair.reserve0 / position.pair.totalSupply;
      liquidityValueUSD = liquidityValueUSD * position.pair.token0.derivedNativeCurrency * 2;
      */
      token0.balance =
        (position.liquidityTokenBalance * position.pair.reserve0) /
        position.pair.totalSupply

      token1.balance =
        (position.liquidityTokenBalance * position.pair.reserve1) /
        position.pair.totalSupply

      // in this case eth == dai == usd
      token0.priceUSD = position.pair.token0.derivedNativeCurrency / nativeCurrencyDollarValue
      token1.priceUSD = position.pair.token1.derivedNativeCurrency / nativeCurrencyDollarValue

      token0.valueUSD =
        token0.balance * position.pair.token0.derivedNativeCurrency / nativeCurrencyDollarValue
      token1.valueUSD =
        token1.balance * position.pair.token1.derivedNativeCurrency / nativeCurrencyDollarValue

      /* get usd value of owned pool tokens */
      const liquidityValueUSD =
        (position.pair.reserveUSD / position.pair.totalSupply) *
        position.liquidityTokenBalance

      if (position.liquidityTokenBalance <= 0) return

      results.push({
        tokens: [token0, token1],
        address: position.pair.id,
        balance: position.liquidityTokenBalance,
        valueUSD: liquidityValueUSD,
        platform: platform
      })
    })
    return results
  },

  async pairsPrices ({ pairs = undefined, chain_id = '100' } = {}) {
    const gqlIds = []
    pairs.forEach(pair => {
      gqlIds.push('\\"' + pair.toLowerCase() + '\\"')
    })

    const gqlIdQuery = '[' + gqlIds.join(',') + ']'

    const properties = [
      'id',
      'token0 { id, symbol, name, derivedNativeCurrency }',
      'token1 { id, symbol, name, derivedNativeCurrency }',
      'reserve0',
      'reserve1',
      'reserveUSD',
      'totalSupply'
    ]
    const pairsData = await pageResults({
      api: graphAPIEndpoints[chain_id].honeyswap,
      query: {
        entity: 'pairs',
        selection: {
          where: {
            id_in: gqlIdQuery
          }
        },
        properties: properties
      }
    })
      .then(results => {
        return results
      })
      .catch(err => console.log(err))

    const tokensById = await module.exports.tokensById(chain_id)

    pairsData.forEach(pair => {
      let i = 0
      do {
        const token = tokensById[pair['token' + i].id.toLowerCase()]
        let logoURI = null
        if (token) {
          logoURI = token.logoURI
        }
        pair['token' + i].logoURI = logoURI
        i++
      } while (pair['token' + i] !== undefined)
    })

    return pairsData
  },

  async tokensPrices ({ tokens = undefined, chain_id = '100' } = {}) {
    const gqlIds = []
    tokens.forEach(token => {
      gqlIds.push('\\"' + token.toLowerCase() + '\\"')
    })

    const gqlIdQuery = '[' + gqlIds.join(',') + ']'
    const properties = ['id', 'symbol', 'derivedNativeCurrency']

    const data = await pageResults({
      api: graphAPIEndpoints[chain_id].honeyswap,
      query: {
        entity: 'tokens',
        selection: {
          where: {
            id_in: gqlIdQuery
          },
          block: undefined
        },
        properties: properties
      }
    })
      .then(results => {
        return results
      })
      .catch(err => console.log(err))

    return data
  }
}

const tokenBalance = {
  callback (entry) {
    return {
      balance: Number(entry.balance),
      name: entry.name,
      address: entry.address,
      symbol: entry.symbol,
      logoURI: entry.logoURI,
      priceUSD: Number(entry.priceUSD),
      valueUSD: Number(entry.valueUSD)
    }
  }
}

const tokenBalances = {
  callback (results) {
    return results.map(entry => tokenBalance.callback(entry))
  }
}

const poolBalances = {
  callback (results) {
    results.map(entry => {
      const result = {
        balance: Number(entry.balance),
        valueUSD: Number(entry.valueUSD),
        address: entry.address,
        poolPlatform: entry.poolPlatform ? entry.poolPlatform : undefined,
        stakePlatform: entry.stakePlatform ? entry.stakePlatform : undefined,
        status: entry.status ? entry.status : undefined
      }
      result.tokens = entry.tokens.map(token => tokenBalance.callback(token))
    })
    return results
  }
}
