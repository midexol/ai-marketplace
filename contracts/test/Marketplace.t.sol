// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Marketplace.sol";
import "../src/AgentToken.sol";

contract MarketplaceTest is Test {
    Marketplace marketplace;
    AgentToken token;
    address seller = address(0x123);
    address buyer = address(0x456);
    uint256 pricePerToken = 0.1 ether;

    // Local copies for vm.expectEmit (qualified Contract.Event needs solc >= 0.8.22).
    event OrderCreated(
        uint256 indexed orderId,
        address indexed seller,
        address indexed agentToken,
        uint256 amount,
        uint256 pricePerToken
    );
    event TokensBought(
        uint256 indexed orderId,
        address indexed buyer,
        uint256 amount,
        uint256 totalPrice
    );

    function setUp() public {
        marketplace = new Marketplace();
        token = new AgentToken("Test Token", "TEST", address(0x789));

        // Mint tokens
        token.mint(seller, 1_000_000 * 10 ** 18);
        token.mint(buyer, 1_000_000 * 10 ** 18);

        // Deal ETH
        vm.deal(seller, 100 ether);
        vm.deal(buyer, 100 ether);

        // Approve marketplace
        vm.prank(seller);
        token.approve(address(marketplace), type(uint256).max);

        vm.prank(buyer);
        token.approve(address(marketplace), type(uint256).max);
    }

    function testCreateOrder() public {
        uint256 amount = 100 * 10 ** 18;

        vm.prank(seller);
        uint256 orderId = marketplace.createOrder(
            address(token),
            amount,
            pricePerToken
        );

        assertEq(orderId, 1, "First order should have ID 1");

        Marketplace.Order memory order = marketplace.getOrder(orderId);
        assertEq(order.seller, seller);
        assertEq(order.agentToken, address(token));
        assertEq(order.amount, amount);
        assertEq(order.pricePerToken, pricePerToken);
        assertEq(order.active, true);
    }

    function testCreateOrderTransfersTokens() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 balanceBefore = token.balanceOf(seller);

        vm.prank(seller);
        marketplace.createOrder(address(token), amount, pricePerToken);

        uint256 balanceAfter = token.balanceOf(seller);

        assertEq(
            balanceBefore - balanceAfter,
            amount,
            "Tokens should be transferred"
        );
        assertEq(
            token.balanceOf(address(marketplace)),
            amount,
            "Marketplace should hold tokens"
        );
    }

    function testCreateOrderWithoutAllowance() public {
        address newSeller = address(0x999);
        token.mint(newSeller, 1_000_000 * 10 ** 18);

        uint256 amount = 100 * 10 ** 18;

        vm.prank(newSeller);
        vm.expectRevert("Insufficient allowance");
        marketplace.createOrder(address(token), amount, pricePerToken);
    }

    function testCancelOrder() public {
        uint256 amount = 100 * 10 ** 18;

        vm.prank(seller);
        uint256 orderId = marketplace.createOrder(
            address(token),
            amount,
            pricePerToken
        );

        vm.prank(seller);
        marketplace.cancelOrder(orderId);

        Marketplace.Order memory order = marketplace.getOrder(orderId);
        assertEq(order.active, false, "Order should be inactive");

        uint256 balanceAfter = token.balanceOf(seller);
        assertEq(balanceAfter, 1_000_000 * 10 ** 18, "Tokens should be returned");
    }

    function testCancelOrderOnlyByOwner() public {
        uint256 amount = 100 * 10 ** 18;

        vm.prank(seller);
        uint256 orderId = marketplace.createOrder(
            address(token),
            amount,
            pricePerToken
        );

        vm.prank(buyer);
        vm.expectRevert("Only seller can cancel order");
        marketplace.cancelOrder(orderId);
    }

    function testBuyFromOrder() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 totalPrice = amount * pricePerToken;
        uint256 fee = (totalPrice * 250) / 10000; // 2.5% default fee
        uint256 sellerProceeds = totalPrice - fee;

        vm.prank(seller);
        uint256 orderId = marketplace.createOrder(
            address(token),
            amount,
            pricePerToken
        );

        uint256 sellerBalanceBefore = seller.balance;
        uint256 buyerBalanceBefore = buyer.balance;

        vm.prank(buyer);
        marketplace.buyFromOrder{value: totalPrice}(orderId, amount);

        assertEq(token.balanceOf(buyer), 1_000_000 * 10 ** 18 + amount);
        assertEq(
            token.balanceOf(address(marketplace)),
            0,
            "Marketplace should have no tokens"
        );

        assertEq(
            seller.balance,
            sellerBalanceBefore + sellerProceeds,
            "Seller should receive proceeds minus fee"
        );

        assertEq(
            marketplace.getAccumulatedFees(),
            fee,
            "Fee should be accumulated"
        );
    }

    function testBuyPartialOrder() public {
        uint256 orderAmount = 100 * 10 ** 18;
        uint256 buyAmount = 50 * 10 ** 18;
        uint256 totalPrice = buyAmount * pricePerToken;

        vm.prank(seller);
        uint256 orderId = marketplace.createOrder(
            address(token),
            orderAmount,
            pricePerToken
        );

        vm.prank(buyer);
        marketplace.buyFromOrder{value: totalPrice}(orderId, buyAmount);

        Marketplace.Order memory order = marketplace.getOrder(orderId);
        assertEq(order.amount, orderAmount - buyAmount);
        assertEq(order.active, true, "Order should still be active");
    }

    function testBuyFullOrder() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 totalPrice = amount * pricePerToken;

        vm.prank(seller);
        uint256 orderId = marketplace.createOrder(
            address(token),
            amount,
            pricePerToken
        );

        vm.prank(buyer);
        marketplace.buyFromOrder{value: totalPrice}(orderId, amount);

        Marketplace.Order memory order = marketplace.getOrder(orderId);
        assertEq(order.amount, 0);
        assertEq(order.active, false, "Order should be inactive");
    }

    function testBuyFromOrderCannotBuyFromYourself() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 totalPrice = amount * pricePerToken;

        vm.prank(seller);
        uint256 orderId = marketplace.createOrder(
            address(token),
            amount,
            pricePerToken
        );

        vm.prank(seller);
        vm.expectRevert("Cannot buy from yourself");
        marketplace.buyFromOrder{value: totalPrice}(orderId, amount);
    }

    function testBuyWithExcessETH() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 totalPrice = amount * pricePerToken;
        uint256 excess = 1 ether;

        vm.prank(seller);
        uint256 orderId = marketplace.createOrder(
            address(token),
            amount,
            pricePerToken
        );

        uint256 balanceBefore = buyer.balance;

        vm.prank(buyer);
        marketplace.buyFromOrder{value: totalPrice + excess}(orderId, amount);

        uint256 balanceAfter = buyer.balance;

        assertEq(balanceBefore - balanceAfter, totalPrice);
    }

    function testGetTokenOrders() public {
        vm.prank(seller);
        uint256 orderId1 = marketplace.createOrder(
            address(token),
            100 * 10 ** 18,
            pricePerToken
        );

        vm.prank(seller);
        uint256 orderId2 = marketplace.createOrder(
            address(token),
            200 * 10 ** 18,
            pricePerToken
        );

        uint256[] memory orders = marketplace.getTokenOrders(address(token));

        assertEq(orders.length, 2);
        assertEq(orders[0], orderId1);
        assertEq(orders[1], orderId2);
    }

    function testGetActiveTokenOrders() public {
        vm.prank(seller);
        uint256 orderId1 = marketplace.createOrder(
            address(token),
            100 * 10 ** 18,
            pricePerToken
        );

        vm.prank(seller);
        uint256 orderId2 = marketplace.createOrder(
            address(token),
            200 * 10 ** 18,
            pricePerToken
        );

        // Cancel first order
        vm.prank(seller);
        marketplace.cancelOrder(orderId1);

        uint256[] memory activeOrders = marketplace.getActiveTokenOrders(
            address(token)
        );

        assertEq(activeOrders.length, 1);
        assertEq(activeOrders[0], orderId2);
    }

    function testSetFeePercentage() public {
        uint256 newFee = 500; // 5%

        marketplace.setFeePercentage(newFee);

        assertEq(marketplace.getFeePercentage(), newFee);
    }

    function testSetFeePercentageOnlyOwner() public {
        vm.prank(buyer);
        vm.expectRevert("Ownable: caller is not the owner");
        marketplace.setFeePercentage(500);
    }

    function testSetFeePercentageTooHigh() public {
        uint256 tooHighFee = 5001;

        vm.expectRevert("Fee percentage exceeds maximum");
        marketplace.setFeePercentage(tooHighFee);
    }

    function testWithdrawFees() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 totalPrice = amount * pricePerToken;

        vm.prank(seller);
        uint256 orderId = marketplace.createOrder(
            address(token),
            amount,
            pricePerToken
        );

        vm.prank(buyer);
        marketplace.buyFromOrder{value: totalPrice}(orderId, amount);

        uint256 feesBefore = marketplace.getAccumulatedFees();

        uint256 ownerBalanceBefore = address(this).balance;

        marketplace.withdrawFees();

        uint256 feesAfter = marketplace.getAccumulatedFees();

        assertEq(feesBefore, (totalPrice * 250) / 10000);
        assertEq(feesAfter, 0);
    }

    function testEmitOrderCreated() public {
        uint256 amount = 100 * 10 ** 18;

        vm.prank(seller);
        vm.expectEmit(true, true, true, true);
        emit OrderCreated(1, seller, address(token), amount, pricePerToken);
        marketplace.createOrder(address(token), amount, pricePerToken);
    }

    function testEmitTokensBought() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 totalPrice = amount * pricePerToken;

        vm.prank(seller);
        uint256 orderId = marketplace.createOrder(
            address(token),
            amount,
            pricePerToken
        );

        vm.prank(buyer);
        vm.expectEmit(true, true, false, true);
        emit TokensBought(orderId, buyer, amount, totalPrice);
        marketplace.buyFromOrder{value: totalPrice}(orderId, amount);
    }

    // Receive ETH
    receive() external payable {}
}
