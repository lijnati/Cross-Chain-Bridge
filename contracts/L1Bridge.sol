//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract L1Bridge is Ownable, ReentrancyGuard {
    mapping(address => bool) public supportedTokens;
    mapping(bytes32 => bool) public processedWithdrawals;
    
    address public l2Bridge;
    uint256 public nonce;
    
    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 indexed nonce, bytes32 depositHash);
    event Withdrawal(address indexed user, address indexed token, uint256 amount, bytes32 indexed withdrawalHash);
    
    constructor() Ownable(msg.sender) {}
    
    function setL2Bridge(address _l2Bridge) external onlyOwner {
        l2Bridge = _l2Bridge;
    }
    
    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }
    
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }
    
    function deposit(address token, uint256 amount) external nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        bytes32 depositHash = keccak256(abi.encodePacked(msg.sender, token, amount, nonce, block.timestamp));
        emit Deposit(msg.sender, token, amount, nonce, depositHash);
        nonce++;
    }
    
    function withdraw(address user, address token, uint256 amount, bytes32 withdrawalHash, bytes calldata signature) external nonReentrant {
        require(!processedWithdrawals[withdrawalHash], "Already processed");
        require(supportedTokens[token], "Token not supported");
        
        bytes32 messageHash = keccak256(abi.encodePacked(user, token, amount, withdrawalHash));
        require(_verifySignature(messageHash, signature), "Invalid signature");
        
        processedWithdrawals[withdrawalHash] = true;
        IERC20(token).transfer(user, amount);
        
        emit Withdrawal(user, token, amount, withdrawalHash);
    }
    
    function _verifySignature(bytes32, bytes calldata signature) internal pure returns (bool) {
        return signature.length == 65;
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}