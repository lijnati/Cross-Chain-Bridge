//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract L2Bridge is Ownable, ReentrancyGuard {
    mapping(address => address) public tokenMapping;
    mapping(bytes32 => bool) public processedDeposits;
    mapping(bytes32 => bool) public processedWithdrawals;
    
    address public l1Bridge;
    uint256 public nonce;
    
    event DepositProcessed(address indexed user, address indexed l1Token, address indexed l2Token, uint256 amount, bytes32 depositHash);
    event WithdrawalInitiated(address indexed user, address indexed l2Token, address indexed l1Token, uint256 amount, bytes32 withdrawalHash);
    
    constructor() Ownable(msg.sender) {}
    
    function setL1Bridge(address _l1Bridge) external onlyOwner {
        l1Bridge = _l1Bridge;
    }
    
    function setTokenMapping(address l1Token, address l2Token) external onlyOwner {
        tokenMapping[l1Token] = l2Token;
    }
    
    function processDeposit(address user, address l1Token, uint256 amount, bytes32 depositHash) external onlyOwner {
        require(!processedDeposits[depositHash], "Already processed");
        require(tokenMapping[l1Token] != address(0), "Token mapping not found");
        
        address l2Token = tokenMapping[l1Token];
        processedDeposits[depositHash] = true;
        
        IERC20(l2Token).transfer(user, amount);
        
        emit DepositProcessed(user, l1Token, l2Token, amount, depositHash);
    }
    
    function initiateWithdrawal(address l2Token, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        address l1Token = _findL1Token(l2Token);
        require(l1Token != address(0), "L1 token not found");
        
        IERC20(l2Token).transferFrom(msg.sender, address(this), amount);
        
        bytes32 withdrawalHash = keccak256(abi.encodePacked(msg.sender, l2Token, l1Token, amount, nonce, block.timestamp));
        
        emit WithdrawalInitiated(msg.sender, l2Token, l1Token, amount, withdrawalHash);
        nonce++;
    }
    
    function _findL1Token(address) internal pure returns (address) {
        return address(0);
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}