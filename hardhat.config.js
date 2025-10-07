require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42161
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.alchemyapi.io/v2/your-api-key",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY
    }
  }
};