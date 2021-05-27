module.exports = {
  supportedNetworks: {
    4: 'rinkeby',
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
    4: {
      honeyswap: 'https://api.thegraph.com/subgraphs/name/1hive/honeyswap-xdai',
      honeyfarm: 'https://api.thegraph.com/subgraphs/name/pxbee/tulip',
      celeste: 'https://api.thegraph.com/subgraphs/name/1hive/celeste'
    },
    100: {
      honeyswap: 'https://api.thegraph.com/subgraphs/name/1hive/honeyswap-xdai',
      honeyfarm: 'https://api.thegraph.com/subgraphs/name/pxbee/tulip',
      celeste: 'https://api.thegraph.com/subgraphs/name/1hive/celeste'
    },
    137: {
      honeyswap: 'https://api.thegraph.com/subgraphs/name/1hive/honeyswap-xdai',
      honeyfarm: 'https://api.thegraph.com/subgraphs/name/pxbee/tulip'
    }
  },

  tokenLists: {
    honeyswap: 'https://tokens.honeyswap.org',
    quickswap: 'https://unpkg.com/quickswap-default-token-list@1.0.60/build/quickswap-default.tokenlist.json'
  },

  rpcEndpoints: {
    100: 'https://dai.poa.network',
    137: 'https://matic-mainnet.chainstacklabs.com',
    // 4: 'https://rinkeby.eth.aragon.network/'
    4: 'https://dai.poa.network'// xDai for test purposes. Only used for token balances

  },

  multicallAddresses: {
    100: '0xb5b692a88BDFc81ca69dcB1d924f59f0413A602a',
    137: '0x95028E5B8a734bb7E2071F96De89BABe75be9C8E',
    4: '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821'
    // 4: '0xb5b692a88BDFc81ca69dcB1d924f59f0413A602a'

  },

  tokenAddresses: {
    100: {
      hny: '0x71850b7e9ee3f13ab46d67167341e4bdc905eef9',
      xcomb: '0x50dbde932a94b0c23d27cdd30fbc6b987610c831'
    },
    137: {
    }
  },
  mapping: {
    '0xa30ccf67b489d627de8f8c035f5b9676442646e0':
      '0x4505b262dc053998c10685dc5f9098af8ae5c8ad', // hny wxdai
    '0xae88624c894668e1bbabc9afe87e8ca0fb74ec2a':
      '0x0e3e9cceb13c9f8c6faf7a0f00f872d6291630de', // agve wxdai
    '0xc778417e063141139fce010982780140aa0cd5ab':
      '0x7bea4af5d425f2d4485bdad1859c88617df31a67', // weth wxdai
    '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea':
      '0x01f4a4d82a4c1cf12eb2dadc35fd87a14526cc79' // wxdai usdc
  },
  mappingInvert: {
    '0x4505b262dc053998c10685dc5f9098af8ae5c8ad':
      '0xa30ccf67b489d627de8f8c035f5b9676442646e0', // hny wxdai
    '0x0e3e9cceb13c9f8c6faf7a0f00f872d6291630de':
      '0xae88624c894668e1bbabc9afe87e8ca0fb74ec2a', // agve wxdai
    '0x7bea4af5d425f2d4485bdad1859c88617df31a67':
      '0xc778417e063141139fce010982780140aa0cd5ab', // weth wxdai
    '0x01f4a4d82a4c1cf12eb2dadc35fd87a14526cc79':
      '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea' // wxdai usdc
  }
}
