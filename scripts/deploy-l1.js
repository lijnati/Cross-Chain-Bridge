const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying L1 Bridge contracts...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
    
    const L1Bridge = await ethers.getContractFactory("L1Bridge");
    const l1Bridge = await L1Bridge.deploy();
    await l1Bridge.waitForDeployment();
    console.log("L1Bridge deployed to:", await l1Bridge.getAddress());
    
    const BridgeToken = await ethers.getContractFactory("BridgeToken");
    const l1Token = await BridgeToken.deploy("L1 Test Token", "L1TT", 1000000);
    await l1Token.waitForDeployment();
    console.log("L1 Test Token deployed to:", await l1Token.getAddress());
    
    await l1Bridge.addSupportedToken(await l1Token.getAddress());
    console.log("L1 Test Token added to supported tokens");
    
    const deploymentInfo = {
        network: "L1",
        l1Bridge: await l1Bridge.getAddress(),
        l1Token: await l1Token.getAddress(),
        deployer: deployer.address
    };
    
    console.log("Deployment completed:", deploymentInfo);
    
    const fs = require('fs');
    fs.writeFileSync('l1-deployment.json', JSON.stringify(deploymentInfo, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });