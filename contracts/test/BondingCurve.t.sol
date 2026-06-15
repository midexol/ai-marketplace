// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BondingCurve.sol";
import "../src/AgentToken.sol";

contract BondingCurveTest is Test {
    BondingCurve bondingCurve;
    AgentToken token;
    address buyer = address(0x123);
    address seller = address(0x456);

    // Local copies for vm.expectEmit (qualified Contract.Event needs solc >= 0.8.22).
    event Buy(address indexed buyer, address indexed token, uint256 amount, uint256 cost);
    event Sell(address indexed seller, address indexed token, uint256 amount, uint256 revenue);

    function setUp() public {
        bondingCurve = new BondingCurve();
        token = new AgentToken("Test Token", "TEST", address(0x789));

        // The curve dispenses tokens from its own inventory — seed it.
        token.mint(address(bondingCurve), 1_000_000 * 10 ** 18);

        // Buyers/sellers need ETH; approvals let them sell tokens back later.
        vm.deal(buyer, 100 ether);
        vm.deal(seller, 100 ether);
        vm.prank(buyer);
        token.approve(address(bondingCurve), type(uint256).max);
        vm.prank(seller);
        token.approve(address(bondingCurve), type(uint256).max);
    }

    function testBuyPriceCalculation() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 price = bondingCurve.getBuyPrice(address(token), amount);
        assertGt(price, 0, "Price should be greater than 0");
    }

    function testBuySellPriceSymmetry() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 buyPrice = bondingCurve.getBuyPrice(address(token), amount);

        // Buy first so there's supply to sell back.
        vm.prank(buyer);
        bondingCurve.buy{value: buyPrice}(address(token), amount);

        // Selling the same amount back from the same supply returns the same price.
        uint256 sellPrice = bondingCurve.getSellPrice(address(token), amount);
        assertEq(buyPrice, sellPrice, "Buy and sell prices should be symmetric");
    }

    function testBuyTokens() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 cost = bondingCurve.getBuyPrice(address(token), amount);

        vm.prank(buyer);
        bondingCurve.buy{value: cost}(address(token), amount);

        // Buyer receives the tokens from the curve's inventory.
        assertEq(token.balanceOf(buyer), amount, "Buyer should receive tokens");
        assertEq(bondingCurve.getSupply(address(token)), amount, "Supply should match bought amount");
        assertEq(bondingCurve.getReserve(address(token)), cost, "Reserve should equal cost");
    }

    function testBuyTokensWithExcessETH() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 cost = bondingCurve.getBuyPrice(address(token), amount);
        uint256 excess = 1 ether;

        uint256 balanceBefore = buyer.balance;

        vm.prank(buyer);
        bondingCurve.buy{value: cost + excess}(address(token), amount);

        assertEq(balanceBefore - buyer.balance, cost, "Only cost should be deducted");
    }

    function testBuyTokensInsufficientPayment() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 cost = bondingCurve.getBuyPrice(address(token), amount);

        vm.prank(buyer);
        vm.expectRevert("Insufficient payment");
        bondingCurve.buy{value: cost - 1}(address(token), amount);
    }

    function testSellTokens() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 buyCost = bondingCurve.getBuyPrice(address(token), amount);

        // Buy first (receive tokens), then sell them back.
        vm.prank(buyer);
        bondingCurve.buy{value: buyCost}(address(token), amount);

        uint256 sellPrice = bondingCurve.getSellPrice(address(token), amount);
        uint256 balanceBefore = buyer.balance;

        vm.prank(buyer);
        bondingCurve.sell(address(token), amount);

        assertEq(buyer.balance - balanceBefore, sellPrice, "Balance should increase by sell price");
        assertEq(bondingCurve.getSupply(address(token)), 0, "Supply should be zero after selling all");
    }

    function testSellTokensMoreThanSupply() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 buyCost = bondingCurve.getBuyPrice(address(token), amount);

        vm.prank(buyer);
        bondingCurve.buy{value: buyCost}(address(token), amount);

        vm.prank(buyer);
        vm.expectRevert("Cannot sell more than supply");
        bondingCurve.sell(address(token), amount + 100 * 10 ** 18);
    }

    function testMultipleBuyersPriceIncreases() public {
        address buyer2 = address(0x789);
        vm.deal(buyer2, 100 ether);

        uint256 amount = 100 * 10 ** 18;

        uint256 price1 = bondingCurve.getBuyPrice(address(token), amount);
        vm.prank(buyer);
        bondingCurve.buy{value: price1}(address(token), amount);

        // Price rises with supply along the curve.
        uint256 price2 = bondingCurve.getBuyPrice(address(token), amount);
        assertGt(price2, price1, "Price should increase with supply");

        vm.prank(buyer2);
        bondingCurve.buy{value: price2}(address(token), amount);

        assertEq(bondingCurve.getSupply(address(token)), amount * 2, "Supply should be 2x amount");
    }

    function testEmitBuyEvent() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 cost = bondingCurve.getBuyPrice(address(token), amount);

        vm.prank(buyer);
        vm.expectEmit(true, true, false, true);
        emit Buy(buyer, address(token), amount, cost);
        bondingCurve.buy{value: cost}(address(token), amount);
    }

    function testEmitSellEvent() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 buyCost = bondingCurve.getBuyPrice(address(token), amount);

        vm.prank(buyer);
        bondingCurve.buy{value: buyCost}(address(token), amount);

        uint256 sellPrice = bondingCurve.getSellPrice(address(token), amount);

        vm.prank(buyer);
        vm.expectEmit(true, true, false, true);
        emit Sell(buyer, address(token), amount, sellPrice);
        bondingCurve.sell(address(token), amount);
    }

    function testBuyBelowMinimumReverts() public {
        vm.prank(buyer);
        vm.expectRevert("Amount below minimum");
        bondingCurve.buy{value: 0}(address(token), 0);
    }

    function testSellBelowMinimumReverts() public {
        vm.prank(buyer);
        vm.expectRevert("Amount below minimum");
        bondingCurve.sell(address(token), 0);
    }

    function testBuyWithoutInventoryReverts() public {
        // A token the curve was never seeded with has no inventory to dispense.
        AgentToken empty = new AgentToken("Empty", "EMP", address(0x789));
        uint256 amount = 100 * 10 ** 18;
        uint256 cost = bondingCurve.getBuyPrice(address(empty), amount);

        vm.prank(buyer);
        vm.expectRevert("Insufficient curve inventory");
        bondingCurve.buy{value: cost}(address(empty), amount);
    }

    // Receive ETH for testing
    receive() external payable {}
}
