module.exports = {
  supportedNetworks: {
    // 4: 'rinkeby',
    100: 'xdai',
    137: 'polygon'
  },
  nativeCurrency: {
    100: {
      symbol: 'xDai',
      name: 'xDai',
      wrappedAddress: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase()
    },
    137: {
      symbol: 'MATIC',
      name: 'Polygon',
      wrappedAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'.toLowerCase()
    }
  },
  graphAPIEndpoints: {
    100: {
      honeyswap: 'https://api.thegraph.com/subgraphs/name/1hive/honeyswap-xdai',
      honeyfarm: 'https://api.thegraph.com/subgraphs/name/1hive/honeyfarm-xdai',
      celeste: 'https://api.thegraph.com/subgraphs/name/1hive/celeste'
    },
    137: {
      honeyswap: 'https://api.thegraph.com/subgraphs/name/1hive/honeyswap-polygon',
      honeyfarm: ''// 'https://api.thegraph.com/subgraphs/name/1hive/honeyfarm-polygon'
    }
  },

  tokenLists: {
    honeyswap: 'https://tokens.honeyswap.org',
    quickswap: 'https://unpkg.com/quickswap-default-token-list@1.0.60/build/quickswap-default.tokenlist.json'
  },

  rpcEndpoints: {
    100: 'https://dai.poa.network',
    137: 'https://matic-mainnet.chainstacklabs.com'
  },

  multicallAddresses: {
    100: '0xb5b692a88BDFc81ca69dcB1d924f59f0413A602a',
    137: '0x95028E5B8a734bb7E2071F96De89BABe75be9C8E',
    4: '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821'
  },

  tokenAddresses: {
    100: {
      hny: '0x71850b7e9ee3f13ab46d67167341e4bdc905eef9',
      comb: '0x38Fb649Ad3d6BA1113Be5F57B927053E97fC5bF7'.toLowerCase()
    },
    137: {
    }
  }
}
