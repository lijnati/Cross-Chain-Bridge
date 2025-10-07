const { ethers } = require("hardhat");
require("dotenv").config();

async function checkBalances() {
    const [signer] = await ethers.getSigners();
    const address = signer.address;
    
    console.log("Checking balances for:", address);
    console.log("=" .repeat(50));
    
    try {
        // here check current network balance
        const balance = await signer.provider.getBalance(address);
        const network = await signer.provider.getNetwork();
        
        console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
        console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
        
        if (balance === 0n) {
            console.log("❌ Zero balance - need testnet ETH!");
            console.log("\n💡 Get testnet ETH from:");
            
            if (network.chainId === 11155111n) {
                console.log("- Sepolia: https://sepoliafaucet.com");
                console.log("- Chainlink: https://faucets.chain.link/sepolia");
            } else if (network.chainId === 421614n) {
                console.log("- Arbitrum Sepolia: https://faucet.quicknode.com/arbitrum/sepolia");
                console.log("- Bridge from Sepolia: https://bridge.arbitrum.io");
            }
        } else {
            console.log("✅ Balance sufficient for deployment");
        }
        
    } catch (error) {
        console.error("Error checking balance:", error.message);
    }
}

checkBalances()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });