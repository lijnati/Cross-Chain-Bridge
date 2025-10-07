const { ethers } = require("hardhat");
const readline = require('readline');
require("dotenv").config();

class BridgeInteraction {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.deploymentData = {};
    }

    async initialize() {
        console.log("🌉 Cross-Chain Bridge Interaction Tool");
        console.log("=" .repeat(50));
        
        // here it loads   deployment data
        try {
            const fs = require('fs');
            const l1Data = JSON.parse(fs.readFileSync('l1-deployment.json', 'utf8'));
            const l2Data = JSON.parse(fs.readFileSync('l2-deployment.json', 'utf8'));
            
            this.deploymentData = { ...l1Data, ...l2Data };
            console.log("✅ Deployment data loaded");
            console.log(`L1 Bridge: ${this.deploymentData.l1Bridge}`);
            console.log(`L2 Bridge: ${this.deploymentData.l2Bridge}`);
            console.log(`L1 Token: ${this.deploymentData.l1Token}`);
            console.log(`L2 Token: ${this.deploymentData.l2Token}`);
            
        } catch (error) {
            console.log("❌ Could not load deployment data. Make sure contracts are deployed.");
            process.exit(1);
        }
    }

    async showMenu() {
        console.log("\n🎯 What would you like to do?");
        console.log("1. Check balances");
        console.log("2. Deposit tokens (L1 → L2)");
        console.log("3. Withdraw tokens (L2 → L1)");
        console.log("4. Monitor bridge events");
        console.log("5. Get test tokens");
        console.log("6. Exit");
        
        return new Promise((resolve) => {
            this.rl.question("\nEnter your choice (1-6): ", resolve);
        });
    }

    async checkBalances() {
        console.log("\n💰 Checking balances...");
        
        try {
            
            const l1Provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
            const l2Provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
            const signer = new ethers.Wallet(process.env.PRIVATE_KEY);
            
            // here check ETH balances
            const l1EthBalance = await l1Provider.getBalance(signer.address);
            const l2EthBalance = await l2Provider.getBalance(signer.address);
            
            console.log(`\n📍 Address: ${signer.address}`);
            console.log(`L1 (Sepolia) ETH: ${ethers.formatEther(l1EthBalance)}`);
            console.log(`L2 (Arbitrum) ETH: ${ethers.formatEther(l2EthBalance)}`);
            
            // Check token balances
            const l1Token = await ethers.getContractAt("BridgeToken", this.deploymentData.l1Token, signer.connect(l1Provider));
            const l2Token = await ethers.getContractAt("BridgeToken", this.deploymentData.l2Token, signer.connect(l2Provider));
            
            const l1TokenBalance = await l1Token.balanceOf(signer.address);
            const l2TokenBalance = await l2Token.balanceOf(signer.address);
            
            console.log(`L1 Token Balance: ${ethers.formatEther(l1TokenBalance)}`);
            console.log(`L2 Token Balance: ${ethers.formatEther(l2TokenBalance)}`);
            
        } catch (error) {
            console.log("❌ Error checking balances:", error.message);
        }
    }

    async depositTokens() {
        console.log("\n🔄 Deposit tokens from L1 to L2");
        
        const amount = await new Promise((resolve) => {
            this.rl.question("Enter amount to deposit (in ETH units): ", resolve);
        });
        
        try {
            const amountWei = ethers.parseEther(amount);
            
            // Connect to L1
            const l1Provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
            const signer = new ethers.Wallet(process.env.PRIVATE_KEY, l1Provider);
            
            const l1Bridge = await ethers.getContractAt("L1Bridge", this.deploymentData.l1Bridge, signer);
            const l1Token = await ethers.getContractAt("BridgeToken", this.deploymentData.l1Token, signer);
            
            console.log("📝 Step 1: Approving tokens...");
            const approveTx = await l1Token.approve(this.deploymentData.l1Bridge, amountWei);
            await approveTx.wait();
            console.log("✅ Tokens approved");
            
            console.log("📝 Step 2: Depositing tokens...");
            const depositTx = await l1Bridge.deposit(this.deploymentData.l1Token, amountWei);
            const receipt = await depositTx.wait();
            console.log("✅ Deposit completed!");
            console.log(`Transaction hash: ${receipt.hash}`);
            
            // Extract deposit event
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
                console.log("\n📋 Deposit Details:");
                console.log(`Amount: ${ethers.formatEther(parsed.args.amount)}`);
                console.log(`Nonce: ${parsed.args.nonce}`);
                console.log(`Deposit Hash: ${parsed.args.depositHash}`);
                
                console.log("\n💡 Next: Process this deposit on L2 using option 3");
            }
            
        } catch (error) {
            console.log("❌ Deposit failed:", error.message);
        }
    }

    async withdrawTokens() {
        console.log("\n🔄 Withdraw tokens from L2 to L1");
        
        const amount = await new Promise((resolve) => {
            this.rl.question("Enter amount to withdraw (in ETH units): ", resolve);
        });
        
        try {
            const amountWei = ethers.parseEther(amount);
            
            // Connect to L2
            const l2Provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
            const signer = new ethers.Wallet(process.env.PRIVATE_KEY, l2Provider);
            
            const l2Bridge = await ethers.getContractAt("L2Bridge", this.deploymentData.l2Bridge, signer);
            const l2Token = await ethers.getContractAt("BridgeToken", this.deploymentData.l2Token, signer);
            
            console.log("📝 Step 1: Approving L2 tokens...");
            const approveTx = await l2Token.approve(this.deploymentData.l2Bridge, amountWei);
            await approveTx.wait();
            console.log("✅ L2 tokens approved");
            
            console.log("📝 Step 2: Initiating withdrawal...");
            const withdrawTx = await l2Bridge.initiateWithdrawal(this.deploymentData.l2Token, amountWei);
            const receipt = await withdrawTx.wait();
            console.log("✅ Withdrawal initiated!");
            console.log(`Transaction hash: ${receipt.hash}`);
            
            console.log("\n💡 Note: In a full implementation, you'd need to wait for the challenge period and then finalize the withdrawal on L1");
            
        } catch (error) {
            console.log("❌ Withdrawal failed:", error.message);
        }
    }

    async monitorEvents() {
        console.log("\n👀 Monitoring bridge events... (Press Ctrl+C to stop)");
        
        try {
            const l1Provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
            const l2Provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
            const signer = new ethers.Wallet(process.env.PRIVATE_KEY);
            
            const l1Bridge = await ethers.getContractAt("L1Bridge", this.deploymentData.l1Bridge, signer.connect(l1Provider));
            const l2Bridge = await ethers.getContractAt("L2Bridge", this.deploymentData.l2Bridge, signer.connect(l2Provider));
            
            // here monitor L1 deposits
            l1Bridge.on("Deposit", (user, token, amount, nonce, depositHash) => {
                console.log("\n🔵 L1 Deposit Event:");
                console.log(`User: ${user}`);
                console.log(`Amount: ${ethers.formatEther(amount)}`);
                console.log(`Nonce: ${nonce}`);
                console.log(`Hash: ${depositHash}`);
            });
            
            // here monitor L2 withdrawals
            l2Bridge.on("WithdrawalInitiated", (user, l2Token, l1Token, amount, withdrawalHash) => {
                console.log("\n🟡 L2 Withdrawal Event:");
                console.log(`User: ${user}`);
                console.log(`Amount: ${ethers.formatEther(amount)}`);
                console.log(`Hash: ${withdrawalHash}`);
            });
            
            console.log("✅ Event monitoring active...");
            
        } catch (error) {
            console.log("❌ Error setting up monitoring:", error.message);
        }
    }

    async getTestTokens() {
        console.log("\n🪙 Getting test tokens...");
        
        try {
            const l1Provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
            const signer = new ethers.Wallet(process.env.PRIVATE_KEY, l1Provider);
            
            const l1Token = await ethers.getContractAt("BridgeToken", this.deploymentData.l1Token, signer);
            
            // vheck if we're the owner (you know if we can mint)
            const owner = await l1Token.owner();
            if (owner.toLowerCase() === signer.address.toLowerCase()) {
                console.log("📝 Minting 1000 test tokens...");
                const mintTx = await l1Token.mint(signer.address, ethers.parseEther("1000"));
                await mintTx.wait();
                console.log("✅ Test tokens minted!");
            } else {
                console.log("❌ You're not the token owner. Cannot mint tokens.");
                console.log(`Token owner: ${owner}`);
                console.log(`Your address: ${signer.address}`);
            }
            
        } catch (error) {
            console.log("❌ Error getting test tokens:", error.message);
        }
    }

    async run() {
        await this.initialize();
        
        while (true) {
            const choice = await this.showMenu();
            
            switch (choice) {
                case '1':
                    await this.checkBalances();
                    break;
                case '2':
                    await this.depositTokens();
                    break;
                case '3':
                    await this.withdrawTokens();
                    break;
                case '4':
                    await this.monitorEvents();
                    return; 
                case '5':
                    await this.getTestTokens();
                    break;
                case '6':
                    console.log("👋 Goodbye!");
                    this.rl.close();
                    return;
                default:
                    console.log("❌ Invalid choice. Please try again.");
            }
        }
    }
}


const bridge = new BridgeInteraction();
bridge.run().catch(console.error);