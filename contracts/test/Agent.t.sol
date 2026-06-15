// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Agent.sol";

contract AgentTest is Test {
    Agent agent;
    address creator = address(0x123);

    // Local copy for vm.expectEmit (qualified Contract.Event needs solc >= 0.8.22).
    event AgentCreated(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        string agentType
    );

    function setUp() public {
        agent = new Agent();
        // createAgent is now minter-gated; authorize the test creator.
        agent.setMinter(creator, true);
    }

    function testCreateAgent() public {
        vm.prank(creator);
        uint256 tokenId = agent.createAgent(
            "Test Agent",
            "A test AI agent",
            "writing"
        );

        assertEq(tokenId, 1);
        assertEq(agent.ownerOf(tokenId), creator);

        Agent.AgentMetadata memory metadata = agent.getAgentMetadata(tokenId);
        assertEq(metadata.name, "Test Agent");
        assertEq(metadata.creator, creator);
    }

    function testCreateAgentEmitsEvent() public {
        vm.prank(creator);
        vm.expectEmit(true, true, false, true);
        emit AgentCreated(1, creator, "Test Agent", "writing");

        agent.createAgent("Test Agent", "A test AI agent", "writing");
    }

    function testSetAgentTokenAddress() public {
        vm.prank(creator);
        uint256 tokenId = agent.createAgent(
            "Test Agent",
            "A test AI agent",
            "writing"
        );

        address tokenAddress = address(0x456);
        vm.prank(creator);
        agent.setAgentTokenAddress(tokenId, tokenAddress);

        assertEq(agent.agentTokenAddress(tokenId), tokenAddress);
    }

    function testSetAgentTokenAddressOnlyOwner() public {
        vm.prank(creator);
        uint256 tokenId = agent.createAgent(
            "Test Agent",
            "A test AI agent",
            "writing"
        );

        address tokenAddress = address(0x456);
        vm.prank(address(0x789));
        vm.expectRevert("Only token owner can set token address");
        agent.setAgentTokenAddress(tokenId, tokenAddress);
    }
}
