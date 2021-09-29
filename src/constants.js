module.exports = {
    supportedNetworks: {
        4: 'rinkeby',
        100: 'xdai',
        137: 'polygon-pos'
    },
    nativeCurrency: {
        4: {
            symbol: 'ETH',
            name: 'Ethereum',
            wrappedAddress: '0xc778417e063141139fce010982780140aa0cd5ab'.toLowerCase()
        },
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
            honeyfarm: ['https://api.thegraph.com/subgraphs/name/1hive/honeyfarm-xdai'],
            celeste: 'https://api.thegraph.com/subgraphs/name/1hive/celeste'
        },
        100: {
            honeyswap: 'https://api.thegraph.com/subgraphs/name/1hive/honeyswap-xdai',
            honeyfarm: [
                'https://api.thegraph.com/subgraphs/name/1hive/honeyfarm-xdai',
                'https://api.thegraph.com/subgraphs/name/luigy-lemon/honeyfarm-agve'
            ],
            celeste: 'https://api.thegraph.com/subgraphs/name/1hive/celeste'
        },
        137: {
            honeyswap: 'https://api.thegraph.com/subgraphs/name/1hive/honeyswap-polygon',
            honeyfarm: ['https://api.thegraph.com/subgraphs/name/1hive/honeyfarm-polygon']
        }
    },

    tokenLists: {
        honeyswap: 'https://tokens.honeyswap.org/',
        quickswap: 'https://unpkg.com/quickswap-default-token-list@1.0.60/build/quickswap-default.tokenlist.json'
    },

    rpcEndpoints: {
        4: 'https://eth-rinkeby.alchemyapi.io/v2/g0lQWmVoepX_wuNYNldpr1Lo_5h1INwP',
        100: 'https://dai.poa.network',
        137: 'https://matic-mainnet-full-rpc.bwarelabs.com'
    },

    multicallAddresses: {
        4: '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821',
        100: '0xb5b692a88BDFc81ca69dcB1d924f59f0413A602a',
        137: '0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507'
    },

    tokenAddresses: {
        4: {
            comb: '0xe26EF0e1890d83e196191822752749a37d7A199f'.toLowerCase(),
            usdc: '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735'.toLowerCase(),
            fox: '0x838341c70e1f02382ada5e867da7e5ec85fc47b7 '.toLowerCase(),
        },
        100: {
            hny: '0x71850b7e9ee3f13ab46d67167341e4bdc905eef9',
            comb: '0x38Fb649Ad3d6BA1113Be5F57B927053E97fC5bF7'.toLowerCase(),
            usdc: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'.toLowerCase(),
            fox: '0x21a42669643f45Bc0e086b8Fc2ed70c23D67509d '.toLowerCase(),
            agve: '0x3a97704a1b25F08aa230ae53B352e2e72ef52843'.toLowerCase(),
        },
        137: {
            usdc: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'.toLowerCase(),
            comb: '0x37D1EbC3Af809b8fADB45DCE7077eFc629b2B5BB'.toLowerCase()
        }
    }
}
