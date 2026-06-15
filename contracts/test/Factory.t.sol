// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Agent.sol";
import "../src/AgentToken.sol";
import "../src/Factory.sol";
import "../src/BondingCurve.sol";

contract FactoryTest is Test {
    Agent agent;
    Factory factory;
    BondingCurve bondingCurve;
    address creator = address(0x123);

    // Local copy for vm.expectEmit (qualified Contract.Event needs solc >= 0.8.22).
    event AgentTokenCreated(
        uint256 indexed agentTokenId,
        address indexed tokenAddress,
        string name,
        string symbol,
        address indexed creator
    );

    function setUp() public {
        agent = new Agent();
        bondingCurve = new BondingCurve();
        factory = new Factory(address(agent), address(bondingCurve));
        // Factory must be an authorized minter to create agents.
        agent.setMinter(address(factory), true);
        // Tests also mint agents directly as `creator`.
        agent.setMinter(creator, true);
    }

    function testCreateAgentWithToken() public {
        string memory agentName = "Test Agent";
        string memory agentDesc = "Test description";
        string memory agentType = "writing";
        string memory tokenName = "Test Token";
        string memory tokenSymbol = "TEST";

        vm.prank(creator);
        (uint256 agentId, address tokenAddr) = factory.createAgentWithToken(
            agentName,
            agentDesc,
            agentType,
            tokenName,
            tokenSymbol
        );

        assertEq(agentId, 1);
        assertNotEq(tokenAddr, address(0));

        // Verify agent was created
        Agent.AgentMetadata memory metadata = agent.getAgentMetadata(agentId);
        assertEq(metadata.name, agentName);
        assertEq(metadata.creator, creator);

        // Verify token was created
        AgentToken token = AgentToken(tokenAddr);
        assertEq(token.name(), tokenName);
        assertEq(token.symbol(), tokenSymbol);
    }

    function testCreateTokenForAgent() public {
        // First create agent without token
        vm.prank(creator);
        uint256 agentId = agent.createAgent(
            "Agent Without Token",
            "Testing",
            "research"
        );

        // Now create token for it
        vm.prank(creator);
        address tokenAddr = factory.createTokenForAgent(
            agentId,
            "New Token",
            "NEWT"
        );

        assertNotEq(tokenAddr, address(0));
        assertEq(factory.getTokenAddress(agentId), tokenAddr);
    }

    function testCreateTokenForAgentOnlyOwner() public {
        vm.prank(creator);
        uint256 agentId = agent.createAgent(
            "Agent Without Token",
            "Testing",
            "research"
        );

        address nonOwner = address(0x456);

        vm.prank(nonOwner);
        vm.expectRevert("Only agent owner can create token");
        factory.createTokenForAgent(agentId, "New Token", "NEWT");
    }

    function testCreateTokenForAgentAlreadyExists() public {
        vm.prank(creator);
        (uint256 agentId, address tokenAddr) = factory.createAgentWithToken(
            "Agent",
            "desc",
            "writing",
            "Token",
            "TOK"
        );

        vm.prank(creator);
        vm.expectRevert("Token already exists for this agent");
        factory.createTokenForAgent(agentId, "Second Token", "ST");
    }

    function testGetTokenAddress() public {
        vm.prank(creator);
        (uint256 agentId, address tokenAddr) = factory.createAgentWithToken(
            "Agent",
            "desc",
            "writing",
            "Token",
            "TOK"
        );

        assertEq(factory.getTokenAddress(agentId), tokenAddr);
    }

    function testGetCreatedTokensCount() public {
        assertEq(factory.getCreatedTokensCount(), 0);

        vm.prank(creator);
        factory.createAgentWithToken("Agent1", "desc", "writing", "Token1", "T1");

        assertEq(factory.getCreatedTokensCount(), 1);

        vm.prank(creator);
        factory.createAgentWithToken("Agent2", "desc", "research", "Token2", "T2");

        assertEq(factory.getCreatedTokensCount(), 2);
    }

    function testGetCreatedToken() public {
        vm.prank(creator);
        (uint256 agentId1, address tokenAddr1) = factory.createAgentWithToken(
            "Agent1",
            "desc",
            "writing",
            "Token1",
            "T1"
        );

        vm.prank(creator);
        (uint256 agentId2, address tokenAddr2) = factory.createAgentWithToken(
            "Agent2",
            "desc",
            "research",
            "Token2",
            "T2"
        );

        assertEq(factory.getCreatedToken(0), tokenAddr1);
        assertEq(factory.getCreatedToken(1), tokenAddr2);
    }

    function testGetCreatedTokenIndexOutOfBounds() public {
        vm.prank(creator);
        factory.createAgentWithToken("Agent", "desc", "writing", "Token", "T");

        vm.expectRevert("Index out of bounds");
        factory.getCreatedToken(1);
    }

    function testMultipleAgentCreation() public {
        for (uint256 i = 1; i <= 5; i++) {
            vm.prank(creator);
            (uint256 agentId, address tokenAddr) = factory.createAgentWithToken(
                string(abi.encodePacked("Agent ", vm.toString(i))),
                "Test agent",
                "writing",
                string(abi.encodePacked("Token ", vm.toString(i))),
                string(abi.encodePacked("T", vm.toString(i)))
            );

            assertEq(agentId, i);
            assertNotEq(tokenAddr, address(0));
        }

        assertEq(factory.getCreatedTokensCount(), 5);
    }

    function testAgentTokenSeedsBondingCurve() public {
        vm.prank(creator);
        (, address tokenAddr) = factory.createAgentWithToken(
            "Agent",
            "desc",
            "writing",
            "Token",
            "TOK"
        );

        AgentToken token = AgentToken(tokenAddr);

        // Full supply is seeded into the bonding curve (fair launch) — buyers
        // acquire tokens from the curve rather than from the creator.
        assertEq(token.balanceOf(address(bondingCurve)), 1_000_000 * 10 ** 18);
        assertEq(token.balanceOf(creator), 0);
    }

    function testEmitAgentTokenCreated() public {
        // Only check topics we know up front (agentId + creator); the token
        // address is unknown before deployment, so don't match on data.
        vm.prank(creator);
        vm.expectEmit(true, false, true, false);
        emit AgentTokenCreated(1, address(0), "Token", "TOK", creator);

        factory.createAgentWithToken("Agent", "desc", "writing", "Token", "TOK");
    }

    function testTokenApprovalAndTransfer() public {
        vm.prank(creator);
        (uint256 agentId, address tokenAddr) = factory.createAgentWithToken(
            "Agent",
            "desc",
            "writing",
            "Token",
            "TOK"
        );

        AgentToken token = AgentToken(tokenAddr);

        address recipient = address(0x789);
        uint256 transferAmount = 1000 * 10 ** 18;

        // The curve holds the supply now; fund the creator for the ERC-20 test.
        vm.prank(address(bondingCurve));
        token.transfer(creator, transferAmount);

        vm.prank(creator);
        token.approve(recipient, transferAmount);

        assertEq(token.allowance(creator, recipient), transferAmount);

        vm.prank(recipient);
        token.transferFrom(creator, recipient, transferAmount);

        assertEq(token.balanceOf(recipient), transferAmount);
    }

    function testFactoryInvalidAddresses() public {
        vm.expectRevert("Invalid agent address");
        new Factory(address(0), address(bondingCurve));

        vm.expectRevert("Invalid bonding curve address");
        new Factory(address(agent), address(0));
    }

    function testEmptyTokenNameRevert() public {
        vm.prank(creator);
        vm.expectRevert("Token name cannot be empty");
        factory.createAgentWithToken(
            "Agent",
            "desc",
            "writing",
            "",
            "TOK"
        );
    }

    function testEmptyTokenSymbolRevert() public {
        vm.prank(creator);
        vm.expectRevert("Token symbol cannot be empty");
        factory.createAgentWithToken(
            "Agent",
            "desc",
            "writing",
            "Token",
            ""
        );
    }
}
