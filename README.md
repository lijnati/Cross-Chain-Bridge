# Cross-Chain Bridge

A complete solution for bridging assets between L1 (Ethereum) and L2 (Arbitrum) networks.

## Features

- **L1 Bridge Contract**: Handles deposits and withdrawals on Ethereum mainnet
- **L2 Bridge Contract**: Processes deposits and initiates withdrawals on Arbitrum
- **Token Support**: ERC20 token bridging with configurable token mappings
- **Security**: ReentrancyGuard, access controls, and signature verification
- **Monitoring**: Event-based monitoring for cross-chain operations

## Architecture

```
L1 (Ethereum)           L2 (Arbitrum)
┌─────────────┐        ┌─────────────┐
│  L1Bridge   │◄──────►│  L2Bridge   │
│             │        │             │
│ - deposit() │        │ - process() │
│ - withdraw()│        │ - initiate()│
└─────────────┘        └─────────────┘
       │                       │
       ▼                       ▼
┌─────────────┐        ┌─────────────┐
│ ERC20 Token │        │Wrapped Token│
└─────────────┘        └─────────────┘
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your RPC URLs and private key
   ```

3. **Compile contracts:**
   ```bash
   npm run compile
   ```

## Deployment

### Deploy to L1 (Ethereum):
```bash
npm run deploy:l1
```

### Deploy to L2 (Arbitrum):
```bash
npm run deploy:l2
```

<!-- ## Usage

### Bridge Assets L1 → L2

1. **Deposit on L1:**
   ```javascript
   const bridge = new CrossChainBridge();
   await bridge.initialize();
   
   // Deposit 100 tokens
   const depositHash = await bridge.depositToL2(tokenAddress, "100000000000000000000");
   ```

2. **Process on L2:**
   ```javascript
   await bridge.processDepositOnL2(userAddress, l1TokenAddress, amount, depositHash);
   ```

### Bridge Assets L2 → L1

1. **Initiate withdrawal on L2:**
   ```javascript
   const withdrawalHash = await bridge.initiateWithdrawal(l2TokenAddress, amount);
   ```

2. **Complete withdrawal on L1** (requires signature verification)

### Monitor Events

```bash
npm run bridge
```

## Contract Addresses

After deployment, contract addresses are saved to:
- `l1-deployment.json` - L1 contract addresses
- `l2-deployment.json` - L2 contract addresses

## Security Considerations

- **Signature Verification**: Implement proper ECDSA signature verification for production
- **Token Validation**: Ensure only supported tokens can be bridged
- **Rate Limiting**: Consider implementing deposit/withdrawal limits
- **Pause Mechanism**: Add emergency pause functionality
- **Multi-sig**: Use multi-signature wallets for admin functions

## Testing Networks

For testing, use:
- **L1**: Sepolia testnet
- **L2**: Arbitrum Sepolia testnet

Update `hardhat.config.js` network settings accordingly.

## Production Deployment

1. **Audit contracts** before mainnet deployment
2. **Set up monitoring** for all bridge events
3. **Implement proper signature verification**
4. **Configure multi-sig wallets** for admin functions
5. **Set up automated relayer** for cross-chain message passing

## License

MIT -->