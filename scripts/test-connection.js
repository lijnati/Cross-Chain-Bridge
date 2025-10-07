const { ethers } = require("hardhat");
require("dotenv").config();

async function testConnections() {
    console.log("Testing RPC connections...\n");
    
    const networks = [
        { name: "Sepolia", url: process.env.SEPOLIA_RPC_URL },
        { name: "Arbitrum Sepolia", url: process.env.ARBITRUM_SEPOLIA_RPC_URL }
    ];
    
    for (const network of networks) {
        try {
            console.log(`Testing ${network.name}...`);
            console.log(`URL: ${network.url}`);
            
            const provider = new ethers.JsonRpcProvider(network.url);
            const blockNumber = await provider.getBlockNumber();
            
            console.log(`✅ Connected! Latest block: ${blockNumber}`);
            
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
        console.log("-".repeat(40));
    }
}

testConnections();