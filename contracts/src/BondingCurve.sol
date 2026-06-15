// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";

/// @title BondingCurve
/// @notice Implements a quadratic bonding curve for agent token pricing
/// @dev Price formula: price = k * supply^2
/// This contract handles buying and selling of agent tokens based on the bonding curve
contract BondingCurve is Ownable, ReentrancyGuard {
    /// @notice Token unit (18 decimals). Pricing math normalizes to whole tokens
    /// to stay far below uint256 overflow even at large supplies.
    uint256 public constant PRECISION = 1e18;

    /// @notice Floor price per whole token in wei (0.0001 ETH)
    uint256 public constant BASE_PRICE = 1e14;

    /// @notice Linear price slope in wei per whole token
    /// @dev Instantaneous price p(s) = BASE_PRICE + SLOPE * s, with s in whole tokens
    uint256 public constant SLOPE = 1e11;

    /// @notice Minimum trade size: one whole token (avoids zero-cost dust trades)
    uint256 public constant MIN_AMOUNT = PRECISION;

    /// @notice Mapping from token address to its tracked supply
    /// @dev This is the supply tracked by the bonding curve, not the ERC-20 total supply
    mapping(address => uint256) public supply;

    /// @notice Mapping from token address to its ETH reserve
    mapping(address => uint256) public reserve;

    /// @notice Emitted when tokens are bought
    /// @param buyer The address of the buyer
    /// @param token The address of the token being bought
    /// @param amount The amount of tokens bought
    /// @param cost The cost in ETH paid for the tokens
    event Buy(address indexed buyer, address indexed token, uint256 amount, uint256 cost);

    /// @notice Emitted when tokens are sold
    /// @param seller The address of the seller
    /// @param token The address of the token being sold
    /// @param amount The amount of tokens sold
    /// @param revenue The amount of ETH received for the tokens
    event Sell(
        address indexed seller,
        address indexed token,
        uint256 amount,
        uint256 revenue
    );

    /// @notice Calculate the price to buy a specific amount of tokens
    /// @param token The address of the token
    /// @param amount The amount of tokens to buy
    /// @return price The price in ETH for the specified amount
    function getBuyPrice(address token, uint256 amount)
        public
        view
        returns (uint256)
    {
        require(amount >= MIN_AMOUNT, "Amount below minimum");

        // Normalize to whole tokens BEFORE squaring — keeps the math far below
        // uint256 overflow (s <= ~1e6, so s^2 <= ~1e12).
        uint256 s1 = supply[token] / PRECISION;
        uint256 s2 = (supply[token] + amount) / PRECISION;

        // Integral of p(s) = BASE_PRICE + SLOPE*s  from s1 to s2:
        //   BASE_PRICE*(s2 - s1) + SLOPE*(s2^2 - s1^2)/2
        return BASE_PRICE * (s2 - s1) + (SLOPE * (s2 * s2 - s1 * s1)) / 2;
    }

    /// @notice Calculate the price to sell a specific amount of tokens
    /// @param token The address of the token
    /// @param amount The amount of tokens to sell
    /// @return price The price in ETH for the specified amount
    function getSellPrice(address token, uint256 amount)
        public
        view
        returns (uint256)
    {
        require(amount >= MIN_AMOUNT, "Amount below minimum");

        uint256 currentSupply = supply[token];
        require(currentSupply >= amount, "Cannot sell more than supply");

        uint256 s1 = currentSupply / PRECISION;
        uint256 s2 = (currentSupply - amount) / PRECISION;

        // Symmetric to the buy integral, from s2 up to s1.
        return BASE_PRICE * (s1 - s2) + (SLOPE * (s1 * s1 - s2 * s2)) / 2;
    }

    /// @notice Buy tokens using ETH
    /// @dev Transfers tokens from caller to this contract and updates reserves
    /// @param token The address of the token to buy
    /// @param amount The amount of tokens to buy
    function buy(address token, uint256 amount) public payable nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount >= MIN_AMOUNT, "Amount below minimum");

        uint256 cost = getBuyPrice(token, amount);
        require(msg.value >= cost, "Insufficient payment");

        // The curve must hold enough inventory to deliver to the buyer.
        require(
            IERC20(token).balanceOf(address(this)) >= amount,
            "Insufficient curve inventory"
        );

        // Effects before interactions (reentrancy-safe).
        supply[token] += amount;
        reserve[token] += cost;

        // Deliver tokens TO the buyer (this is the fix — a bonding curve dispenses
        // tokens for ETH; it does not pull tokens from the buyer).
        require(
            IERC20(token).transfer(msg.sender, amount),
            "Token transfer failed"
        );

        // Refund excess ETH
        if (msg.value > cost) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - cost}("");
            require(success, "Refund failed");
        }

        emit Buy(msg.sender, token, amount, cost);
    }

    /// @notice Sell tokens for ETH
    /// @dev Transfers tokens from caller to this contract and ETH back to caller
    /// @param token The address of the token to sell
    /// @param amount The amount of tokens to sell
    function sell(address token, uint256 amount) public nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount >= MIN_AMOUNT, "Amount below minimum");
        require(supply[token] >= amount, "Insufficient supply");

        uint256 revenue = getSellPrice(token, amount);
        require(reserve[token] >= revenue, "Insufficient reserve");

        // Effects before interactions.
        supply[token] -= amount;
        reserve[token] -= revenue;

        // Pull the seller's tokens back into the curve (seller must approve first).
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );

        // Pay the seller their ETH revenue.
        (bool success, ) = payable(msg.sender).call{value: revenue}("");
        require(success, "ETH transfer failed");

        emit Sell(msg.sender, token, amount, revenue);
    }

    /// @notice Get the ETH reserve for a token
    /// @param token The address of the token
    /// @return The ETH reserve amount
    function getReserve(address token) public view returns (uint256) {
        return reserve[token];
    }

    /// @notice Get the supply for a token (tracked by the curve)
    /// @param token The address of the token
    /// @return The supply amount tracked by the curve
    function getSupply(address token) public view returns (uint256) {
        return supply[token];
    }

    /// @notice Withdraw stuck tokens (emergency function)
    /// @dev Only owner can call this
    /// @param token The address of the token to withdraw
    /// @param amount The amount to withdraw
    function emergencyWithdraw(address token, uint256 amount) public onlyOwner {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(
            IERC20(token).transfer(msg.sender, amount),
            "Withdrawal failed"
        );
    }
}
