const { ethers } = require("hardhat");
require("dotenv").config();

async function quickDemo() {
    console.log("🚀 Quick Bridge Demo");
    console.log("=" .repeat(40));
    
    try {
        // deployment data
        const fs = require('fs');
        const l1Data = JSON.parse(fs.readFileSync('l1-deployment.json', 'utf8'));
        const l2Data = JSON.parse(fs.readFileSync('l2-deployment.json', 'utf8'));
        
        console.log("📋 Contract Addresses:");
        console.log(`L1 Bridge: ${l1Data.l1Bridge}`);
        console.log(`L2 Bridge: ${l2Data.l2Bridge}`);
        console.log(`L1 Token: ${l1Data.l1Token}`);
        console.log(`L2 Token: ${l2Data.l2Token}`);
        
        
        const l1Provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const l2Provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY);
        
        console.log(`\n👤 Using address: ${signer.address}`);
        
        
        console.log("\n💰 Current Balances:");
        const l1EthBalance = await l1Provider.getBalance(signer.address);
        const l2EthBalance = await l2Provider.getBalance(signer.address);
        console.log(`L1 ETH: ${ethers.formatEther(l1EthBalance)}`);
        console.log(`L2 ETH: ${ethers.formatEther(l2EthBalance)}`);
        
       
        const l1Token = await ethers.getContractAt("BridgeToken", l1Data.l1Token, signer.connect(l1Provider));
        const l2Token = await ethers.getContractAt("BridgeToken", l2Data.l2Token, signer.connect(l2Provider));
        const l1Bridge = await ethers.getContractAt("L1Bridge", l1Data.l1Bridge, signer.connect(l1Provider));
        
        
        const l1TokenBalance = await l1Token.balanceOf(signer.address);
        const l2TokenBalance = await l2Token.balanceOf(signer.address);
        console.log(`L1 Tokens: ${ethers.formatEther(l1TokenBalance)}`);
        console.log(`L2 Tokens: ${ethers.formatEther(l2TokenBalance)}`);
        
        // her's a Demo: Mint some tokens if we're the owner
        if (owner.toLowerCase() === signer.address.toLowerCase() && l1TokenBalance === 0n) {
            console.log("\n🪙 Minting test tokens...");
            const mintTx = await l1Token.mint(signer.address, ethers.parseEther("100"));
            await mintTx.wait();
            console.log("✅ Minted 100 test tokens");
        }
        
        // Demo: Small deposit
        if (l1TokenBalance > 0n || owner.toLowerCase() === signer.address.toLowerCase()) {
            console.log("\n🔄 Demo: Depositing 1 token to L2...");
            
            const depositAmount = ethers.parseEther("1");
            
            // Approve
            console.log("📝 Approving tokens...");
            const approveTx = await l1Token.approve(l1Data.l1Bridge, depositAmount);
            await approveTx.wait();
            
            // Deposit
            console.log("📝 Depositing...");
            const depositTx = await l1Bridge.deposit(l1Data.l1Token, depositAmount);
            const receipt = await depositTx.wait();
            
            console.log("✅ Deposit completed!");
            console.log(`Transaction: ${receipt.hash}`);
            
            // Show event
            const depositEvent = receipt.logs.find(log => {
                try {
                    const parsed = l1Bridge.interface.parseLog(log);
                    return parsed.name === 'Deposit';
                } catch {
                    return false;
                }
            });
            
            if (depositEvent) {
                const parsed = l1Bridge.interface.parseLog(depositEvent);
                console.log(`Deposit Hash: ${parsed.args.depositHash}`);
            }
        }
        
        console.log("\n🎯 Next Steps:");
        console.log("1. Run 'npm run interact' for full interactive mode");
        console.log("2. Use the deposit hash to process on L2");
        console.log("3. Monitor events with the bridge tool");
        
    } catch (error) {
        console.error("❌ Demo failed:", error.message);
    }
}

quickDemo();