// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Agent.sol";
import "../src/AgentToken.sol";
import "../src/BondingCurve.sol";
import "../src/VIRTUAL.sol";
import "../src/Factory.sol";
import "../src/Marketplace.sol";

/// @title IntegrationTest
/// @notice Integration tests for the complete AI Agents Marketplace
contract IntegrationTest is Test {
    Agent agent;
    BondingCurve bondingCurve;
    VIRTUAL virtual_;
    Factory factory;
    Marketplace marketplace;

    address agentCreator = address(0x111);
    address trader1 = address(0x222);
    address trader2 = address(0x333);

    function setUp() public {
        // Deploy contracts
        agent = new Agent();
        bondingCurve = new BondingCurve();
        virtual_ = new VIRTUAL();
        factory = new Factory(address(agent), address(bondingCurve));
        marketplace = new Marketplace();

        // Factory must be an authorized minter to create agents.
        agent.setMinter(address(factory), true);

        // Setup ETH
        vm.deal(agentCreator, 100 ether);
        vm.deal(trader1, 100 ether);
        vm.deal(trader2, 100 ether);
    }

    function testCompleteMarketplaceFlow() public {
        // Step 1: Create an agent with token
        vm.prank(agentCreator);
        (uint256 agentId, address tokenAddr) = factory.createAgentWithToken(
            "Trading Bot AI",
            "Advanced trading bot with ML capabilities",
            "research",
            "Trading Bot Token",
            "TBOT"
        );

        assertEq(agentId, 1);
        assertNotEq(tokenAddr, address(0));
        console.log("Created agent #%d with token: %s", agentId, tokenAddr);

        // Step 2: Verify agent metadata
        Agent.AgentMetadata memory metadata = agent.getAgentMetadata(agentId);
        assertEq(metadata.name, "Trading Bot AI");
        assertEq(metadata.creator, agentCreator);

        // Step 3: Get tokens to traders. The full supply now lives in the
        // bonding curve (fair launch), so distribute from there for the test.
        AgentToken token = AgentToken(tokenAddr);
        uint256 transferAmount = 1000 * 10 ** 18;

        vm.prank(address(bondingCurve));
        token.transfer(trader1, transferAmount);

        vm.prank(address(bondingCurve));
        token.transfer(trader2, transferAmount);

        assertEq(token.balanceOf(trader1), transferAmount);
        assertEq(token.balanceOf(trader2), transferAmount);
        console.log("Distributed tokens to traders");

        // Step 4: Create marketplace order
        uint256 sellAmount = 500 * 10 ** 18;
        uint256 pricePerToken = 0.05 ether;

        vm.prank(trader1);
        token.approve(address(marketplace), sellAmount);

        vm.prank(trader1);
        uint256 orderId = marketplace.createOrder(
            tokenAddr,
            sellAmount,
            pricePerToken
        );

        assertEq(orderId, 1);
        console.log("Created marketplace order #%d", orderId);

        // Step 5: Verify order created
        Marketplace.Order memory order = marketplace.getOrder(orderId);
        assertEq(order.seller, trader1);
        assertEq(order.amount, sellAmount);
        assertEq(order.pricePerToken, pricePerToken);
        assertEq(order.active, true);

        // Step 6: Buy from order
        uint256 buyAmount = 100 * 10 ** 18;
        uint256 totalPrice = buyAmount * pricePerToken;

        uint256 trader2BalanceBefore = trader2.balance;

        vm.prank(trader2);
        marketplace.buyFromOrder{value: totalPrice}(orderId, buyAmount);

        // Verify purchase
        assertEq(token.balanceOf(trader2), transferAmount + buyAmount);
        assertEq(token.balanceOf(address(marketplace)), sellAmount - buyAmount);
        console.log("Trader2 bought %d tokens from order", buyAmount);

        // Step 7: Use bonding curve to trade. The curve dispenses tokens FROM
        // its own inventory in exchange for ETH, so seed it first.
        AgentToken testToken = new AgentToken(
            "Bonding Test",
            "BT",
            address(agent)
        );
        testToken.mint(address(bondingCurve), 10_000 * 10 ** 18);

        uint256 curveAmount = 100 * 10 ** 18;
        uint256 buyPrice = bondingCurve.getBuyPrice(address(testToken), curveAmount);

        vm.prank(trader1);
        bondingCurve.buy{value: buyPrice}(address(testToken), curveAmount);

        // Buyer received the tokens; curve tracked supply + reserve.
        assertEq(testToken.balanceOf(trader1), curveAmount);
        assertEq(bondingCurve.getSupply(address(testToken)), curveAmount);
        assertEq(bondingCurve.getReserve(address(testToken)), buyPrice);
        console.log("Bought %d tokens from bonding curve for %d wei", curveAmount, buyPrice);

        // Step 8: Sell back to the bonding curve (seller approves, curve pays ETH)
        uint256 sellPrice = bondingCurve.getSellPrice(address(testToken), curveAmount);

        vm.prank(trader1);
        testToken.approve(address(bondingCurve), curveAmount);

        vm.prank(trader1);
        bondingCurve.sell(address(testToken), curveAmount);

        assertEq(bondingCurve.getSupply(address(testToken)), 0);
        assertEq(sellPrice, buyPrice, "Buy/sell prices must be symmetric on the curve");
        console.log("Sold %d tokens back to bonding curve for %d wei", curveAmount, sellPrice);

        // Step 9: Verify marketplace fee collection
        uint256 fees = marketplace.getAccumulatedFees();
        assertGt(fees, 0);
        console.log("Marketplace accumulated fees: %d wei", fees);

        // Step 10: Create and manage multiple agents
        for (uint256 i = 2; i <= 4; i++) {
            vm.prank(agentCreator);
            (uint256 newAgentId, address newTokenAddr) = factory.createAgentWithToken(
                string(abi.encodePacked("Agent ", vm.toString(i))),
                "Test agent",
                "writing",
                string(abi.encodePacked("Token ", vm.toString(i))),
                string(abi.encodePacked("TK", vm.toString(i)))
            );

            assertEq(newAgentId, i);
            console.log("Created agent #%d", i);
        }

        // Verify total agents
        uint256 totalAgents = agent.getTotalAgents();
        assertEq(totalAgents, 4);
        console.log("\nTotal agents created: %d", totalAgents);

        // Final summary
        console.log("\n=== Integration Test Summary ===");
        console.log("Created 4 agents");
        console.log("Created 1 marketplace order");
        console.log("Executed bonding curve trades");
        console.log("Verified fee collection");
    }

    function testMultipleAgentManagement() public {
        // Create multiple agents
        uint256[] memory agentIds = new uint256[](3);
        address[] memory tokenAddrs = new address[](3);

        string[3] memory agentNames = ["Writer", "Researcher", "Governor"];
        string[3] memory agentTypes = ["writing", "research", "governance"];

        for (uint256 i = 0; i < 3; i++) {
            vm.prank(agentCreator);
            (uint256 id, address tokenAddr) = factory.createAgentWithToken(
                agentNames[i],
                "Test agent",
                agentTypes[i],
                string(abi.encodePacked(agentNames[i], " Token")),
                string(abi.encodePacked("T", vm.toString(i)))
            );

            agentIds[i] = id;
            tokenAddrs[i] = tokenAddr;
        }

        // Verify all agents
        for (uint256 i = 0; i < 3; i++) {
            Agent.AgentMetadata memory metadata = agent.getAgentMetadata(agentIds[i]);
            assertEq(metadata.name, agentNames[i]);
            assertEq(metadata.creator, agentCreator);
            assertNotEq(metadata.createdAt, 0);
        }

        console.log("Successfully created and verified agents:", uint256(3));
    }

    function testMarketplaceWithMultipleOrders() public {
        // Create agent and token
        vm.prank(agentCreator);
        (uint256 agentId, address tokenAddr) = factory.createAgentWithToken(
            "Multi-Order Test Agent",
            "For testing multiple orders",
            "research",
            "MOT Token",
            "MOT"
        );

        AgentToken token = AgentToken(tokenAddr);

        // Distribute tokens from the bonding curve (holds the fair-launch supply)
        vm.prank(address(bondingCurve));
        token.transfer(trader1, 10000 * 10 ** 18);
        vm.prank(address(bondingCurve));
        token.transfer(trader2, 10000 * 10 ** 18);

        // Create multiple orders
        uint256[] memory orderIds = new uint256[](3);
        for (uint256 i = 0; i < 3; i++) {
            uint256 amount = (i + 1) * 100 * 10 ** 18;
            uint256 price = (i + 1) * 0.01 ether;

            vm.prank(trader1);
            token.approve(address(marketplace), amount);

            vm.prank(trader1);
            orderIds[i] = marketplace.createOrder(tokenAddr, amount, price);
        }

        // Get token orders
        uint256[] memory orders = marketplace.getTokenOrders(tokenAddr);
        assertEq(orders.length, 3);

        // Buy from each order
        for (uint256 i = 0; i < 3; i++) {
            Marketplace.Order memory order = marketplace.getOrder(orderIds[i]);
            uint256 buyAmount = order.amount / 2;
            uint256 totalPrice = buyAmount * order.pricePerToken;

            vm.prank(trader2);
            marketplace.buyFromOrder{value: totalPrice}(orderIds[i], buyAmount);
        }

        console.log("Created and executed trades from orders:", uint256(3));
    }

    function testVIRTUALTokenFunctionality() public {
        uint256 initialBalance = virtual_.balanceOf(address(this));
        assertEq(initialBalance, 1_000_000_000 * 10 ** 18);

        // Test burning
        uint256 burnAmount = 100 * 10 ** 18;
        virtual_.burn(burnAmount);

        uint256 balanceAfter = virtual_.balanceOf(address(this));
        assertEq(balanceAfter, initialBalance - burnAmount);

        console.log("VIRTUAL token burn functionality verified");
    }

    receive() external payable {}
}
