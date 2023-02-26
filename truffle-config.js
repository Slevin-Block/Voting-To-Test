const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();
const { MNEMONIC,
        GOERLIRPC, INFURA_ID,
        MUMBAIRPC, ALCHEMY_ID,
      } = process.env

//dotenv.config();

module.exports = {

    networks: {
        development:{
            host: "127.0.0.1",     // Localhost (default: none)
            port: 8545,            // Standard Ethereum port (default: none)
            network_id: "*",       // Any network (default: none)
        },
        ganache:{
            host : "192.168.1.131",
            port : 7545,
            network_id : 5777,
        },
        goerli:{
            provider : () => {
                return new HDWalletProvider(
                    `${MNEMONIC}`, 
                    `${GOERLIRPC}${INFURA_ID}`
                )
            },
            network_id : 5,
        },
        mumbai:{
            provider : () => {
                return new HDWalletProvider(
                    `${MNEMONIC}`, 
                    `${MUMBAIRPC}${ALCHEMY_ID}`
                )
            },
            network_id : 80001,
        },
    },
    
    mocha: {
        reporter: 'eth-gas-reporter',
        reporterOptions : { 
            gasPrice:1,
            token:'ETH',
            showTimeSpent: false,
        }
  },

    // Configure your compilers
    compilers: {
        solc: {
            version: "0.8.13", // Fetch exact version from solc-bin (default: truffle's version)
            settings: {          // See the solidity docs for advice about optimization and evmVersion
                optimizer: {
                    enabled: false,
                    runs: 200
                },
                evmVersion: "byzantium"
            }
        }
    }
};
