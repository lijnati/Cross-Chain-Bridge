const { ethers } = require("hardhat");
require("dotenv").config();

class CrossChainBridge {
    constructor() {
        this.l1Provider = null;
        this.l2Provider = null;
        this.l1Bridge = null;
        this.l2Bridge = null;
        this.signer = null;
    }
    
    async initialize() {
        this.l1Provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        this.l2Provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
        
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY);
        
        const fs = require('fs');
        try {
            const l1Deployment = JSON.parse(fs.readFileSync('l1-deployment.json', 'utf8'));
            const l2Deployment = JSON.parse(fs.readFileSync('l2-deployment.json', 'utf8'));
            
            const L1Bridge = await ethers.getContractFactory("L1Bridge");
            const L2Bridge = await ethers.getContractFactory("L2Bridge");
            
            this.l1Bridge = L1Bridge.attach(l1Deployment.l1Bridge).connect(this.signer.connect(this.l1Provider));
            this.l2Bridge = L2Bridge.attach(l2Deployment.l2Bridge).connect(this.signer.connect(this.l2Provider));
            
            console.log("Bridge initialized successfully");
            console.log("L1 Bridge:", l1Deployment.l1Bridge);
            console.log("L2 Bridge:", l2Deployment.l2Bridge);
            
        } catch (error) {
            console.error("Failed to initialize bridge:", error.message);
            throw error;
        }
    }
    
    async depositToL2(tokenAddress, amount) {
        console.log(`Depositing ${amount} tokens to L2...`);
        
        try {
            const token = await ethers.getContractAt("IERC20", tokenAddress, this.signer.connect(this.l1Provider));
            const approveTx = await token.approve(await this.l1Bridge.getAddress(), amount);
            await approveTx.wait();
            console.log("Tokens approved for bridge");
            
            const depositTx = await this.l1Bridge.deposit(tokenAddress, amount);
            const receipt = await depositTx.wait();
            
            console.log("Deposit transaction confirmed:", receipt.hash);
            
            const depositEvent = receipt.logs.find(log => {
                try {
                    const parsed = this.l1Bridge.interface.parseLog(log);
                    return parsed.name === 'Deposit';
                } catch {
                    return false;
                }
            });
            
            if (depositEvent) {
                const parsed = this.l1Bridge.interface.parseLog(depositEvent);
                console.log("Deposit details:", {
                    user: parsed.args.user,
                    token: parsed.args.token,
                    amount: parsed.args.amount.toString(),
                    nonce: parsed.args.nonce.toString(),
                    depositHash: parsed.args.depositHash
                });
                
                return parsed.args.depositHash;
            }
            
        } catch (error) {
            console.error("Deposit failed:", error.message);
            throw error;
        }
    }
    
    async processDepositOnL2(user, l1Token, amount, depositHash) {
        console.log("Processing deposit on L2...");
        
        try {
            const tx = await this.l2Bridge.processDeposit(user, l1Token, amount, depositHash);
            const receipt = await tx.wait();
            
            console.log("Deposit processed on L2:", receipt.hash);
            return receipt;
            
        } catch (error) {
            console.error("L2 deposit processing failed:", error.message);
            throw error;
        }
    }
    
    async initiateWithdrawal(l2TokenAddress, amount) {
        console.log(`Initiating withdrawal of ${amount} tokens from L2...`);
        
        try {
            const token = await ethers.getContractAt("IERC20", l2TokenAddress, this.signer.connect(this.l2Provider));
            const approveTx = await token.approve(await this.l2Bridge.getAddress(), amount);
            await approveTx.wait();
            console.log("L2 tokens approved for withdrawal");
            
            const withdrawalTx = await this.l2Bridge.initiateWithdrawal(l2TokenAddress, amount);
            const receipt = await withdrawalTx.wait();
            
            console.log("Withdrawal initiated:", receipt.hash);
            
            const withdrawalEvent = receipt.logs.find(log => {
                try {
                    const parsed = this.l2Bridge.interface.parseLog(log);
                    return parsed.name === 'WithdrawalInitiated';
                } catch {
                    return false;
                }
            });
            
            if (withdrawalEvent) {
                const parsed = this.l2Bridge.interface.parseLog(withdrawalEvent);
                console.log("Withdrawal details:", {
                    user: parsed.args.user,
                    l2Token: parsed.args.l2Token,
                    l1Token: parsed.args.l1Token,
                    amount: parsed.args.amount.toString(),
                    withdrawalHash: parsed.args.withdrawalHash
                });
                
                return parsed.args.withdrawalHash;
            }
            
        } catch (error) {
            console.error("Withdrawal initiation failed:", error.message);
            throw error;
        }
    }
    
    async monitorEvents() {
        console.log("Starting event monitoring...");
        
        try {
            this.l1Bridge.on("Deposit", (user, token, amount, nonce, depositHash) => {
                console.log("\n🔵 New L1 Deposit:", {
                    user,
                    token,
                    amount: amount.toString(),
                    nonce: nonce.toString(),
                    depositHash
                });
            });
            
            this.l2Bridge.on("WithdrawalInitiated", (user, l2Token, l1Token, amount, withdrawalHash) => {
                console.log("\n🟡 New L2 Withdrawal:", {
                    user,
                    l2Token,
                    l1Token,
                    amount: amount.toString(),
                    withdrawalHash
                });
            });
            
            this.l1Provider.on("error", (error) => {
                console.log("L1 Provider Error:", error.message);
            });
            
            this.l2Provider.on("error", (error) => {
                console.log("L2 Provider Error:", error.message);
            });
            
            console.log("✅ Event monitoring active...");
            
        } catch (error) {
            console.error("❌ Error setting up event monitoring:", error.message);
            throw error;
        }
    }
}

async function main() {
    const bridge = new CrossChainBridge();
    
    try {
        await bridge.initialize();
        await bridge.monitorEvents();
        
        console.log("Bridge is running. Press Ctrl+C to exit.");
        process.stdin.resume();
        
    } catch (error) {
        console.error("Bridge operation failed:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = CrossChainBridge;