const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying L2 Bridge contracts...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
    
    const L2Bridge = await ethers.getContractFactory("L2Bridge");
    const l2Bridge = await L2Bridge.deploy();
    await l2Bridge.waitForDeployment();
    console.log("L2Bridge deployed to:", await l2Bridge.getAddress());
    
    const BridgeToken = await ethers.getContractFactory("BridgeToken");
    const l2Token = await BridgeToken.deploy("L2 Wrapped Token", "L2WT", 0);
    await l2Token.waitForDeployment();
    console.log("L2 Wrapped Token deployed to:", await l2Token.getAddress());
    
    let l1TokenAddress = "0x0000000000000000000000000000000000000000";
    try {
        const fs = require('fs');
        const l1Deployment = JSON.parse(fs.readFileSync('l1-deployment.json', 'utf8'));
        l1TokenAddress = l1Deployment.l1Token;
        console.log("Found L1 token address:", l1TokenAddress);
    } catch (error) {
        console.log("L1 deployment info not found, using placeholder address");
    }
    
    if (l1TokenAddress !== "0x0000000000000000000000000000000000000000") {
        await l2Bridge.setTokenMapping(l1TokenAddress, await l2Token.getAddress());
        console.log("Token mapping set:", l1TokenAddress, "->", await l2Token.getAddress());
    }
    
    await l2Token.transferOwnership(await l2Bridge.getAddress());
    console.log("L2 token ownership transferred to bridge");
    
    const deploymentInfo = {
        network: "L2",
        l2Bridge: await l2Bridge.getAddress(),
        l2Token: await l2Token.getAddress(),
        l1TokenMapped: l1TokenAddress,
        deployer: deployer.address
    };
    
    console.log("Deployment completed:", deploymentInfo);
    
    const fs = require('fs');
    fs.writeFileSync('l2-deployment.json', JSON.stringify(deploymentInfo, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });