// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Agent.sol";
import "./AgentToken.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title Factory
/// @notice Factory contract for creating agent tokens and managing agent creation
/// @dev Deploys new AgentToken instances for each agent
contract Factory is Ownable {
    /// @notice The Agent NFT contract address
    Agent public agent;

    /// @notice The BondingCurve that holds token inventory and prices trades
    address public bondingCurve;

    /// @notice Mapping from token ID to agent token address
    mapping(uint256 => address) public tokenAddresses;

    /// @notice Array of all created agent tokens
    address[] public createdTokens;

    /// @notice Emitted when an agent token is created
    /// @param agentTokenId The ID of the agent NFT
    /// @param tokenAddress The address of the created ERC-20 token
    /// @param name The name of the token
    /// @param symbol The symbol of the token
    /// @param creator The address that created the agent
    event AgentTokenCreated(
        uint256 indexed agentTokenId,
        address indexed tokenAddress,
        string name,
        string symbol,
        address indexed creator
    );

    /// @notice Initialize the Factory contract
    /// @param _agent The address of the Agent NFT contract
    /// @param _bondingCurve The address of the BondingCurve (receives token inventory)
    constructor(address _agent, address _bondingCurve) {
        require(_agent != address(0), "Invalid agent address");
        require(_bondingCurve != address(0), "Invalid bonding curve address");
        agent = Agent(_agent);
        bondingCurve = _bondingCurve;
    }

    /// @notice Create a new agent and its associated token
    /// @param name The name of the agent
    /// @param description The description of the agent
    /// @param agentType The type of agent
    /// @param tokenName The name of the agent's token
    /// @param tokenSymbol The symbol of the agent's token
    /// @return agentTokenId The ID of the created agent NFT
    /// @return tokenAddress The address of the created ERC-20 token
    function createAgentWithToken(
        string memory name,
        string memory description,
        string memory agentType,
        string memory tokenName,
        string memory tokenSymbol
    ) public returns (uint256 agentTokenId, address tokenAddress) {
        require(bytes(tokenName).length > 0, "Token name cannot be empty");
        require(bytes(tokenSymbol).length > 0, "Token symbol cannot be empty");

        // Create agent NFT
        agentTokenId = agent.createAgent(name, description, agentType);

        // Create agent token
        tokenAddress = _createAgentToken(agentTokenId, tokenName, tokenSymbol);

        // Set the token address on the agent NFT
        agent.setAgentTokenAddress(agentTokenId, tokenAddress);

        return (agentTokenId, tokenAddress);
    }

    /// @notice Create an agent token for an existing agent NFT
    /// @param agentTokenId The ID of the agent NFT
    /// @param tokenName The name of the token
    /// @param tokenSymbol The symbol of the token
    /// @return tokenAddress The address of the created ERC-20 token
    function createTokenForAgent(
        uint256 agentTokenId,
        string memory tokenName,
        string memory tokenSymbol
    ) public returns (address tokenAddress) {
        require(bytes(tokenName).length > 0, "Token name cannot be empty");
        require(bytes(tokenSymbol).length > 0, "Token symbol cannot be empty");

        // Verify agent exists and caller is the owner
        Agent.AgentMetadata memory metadata = agent.getAgentMetadata(agentTokenId);
        require(
            agent.ownerOf(agentTokenId) == msg.sender,
            "Only agent owner can create token"
        );

        // Verify token doesn't already exist
        require(
            tokenAddresses[agentTokenId] == address(0),
            "Token already exists for this agent"
        );

        // Create token
        tokenAddress = _createAgentToken(agentTokenId, tokenName, tokenSymbol);

        // Set the token address on the agent NFT
        agent.setAgentTokenAddress(agentTokenId, tokenAddress);

        return tokenAddress;
    }

    /// @notice Internal function to create an agent token
    /// @param agentTokenId The ID of the agent NFT
    /// @param tokenName The name of the token
    /// @param tokenSymbol The symbol of the token
    /// @return tokenAddress The address of the created token
    function _createAgentToken(
        uint256 agentTokenId,
        string memory tokenName,
        string memory tokenSymbol
    ) internal returns (address tokenAddress) {
        // Create new AgentToken instance (mints INITIAL_SUPPLY to this Factory)
        AgentToken newToken = new AgentToken(
            tokenName,
            tokenSymbol,
            address(agent)
        );

        tokenAddress = address(newToken);

        // Seed the bonding curve with the full supply so it can dispense tokens
        // to buyers. All tokens are sold through the curve (fair launch).
        uint256 supplyToSeed = newToken.balanceOf(address(this));
        require(
            newToken.transfer(bondingCurve, supplyToSeed),
            "Curve seeding failed"
        );

        // Store token address
        tokenAddresses[agentTokenId] = tokenAddress;
        createdTokens.push(tokenAddress);

        // Get creator from agent metadata
        Agent.AgentMetadata memory metadata = agent.getAgentMetadata(agentTokenId);

        emit AgentTokenCreated(
            agentTokenId,
            tokenAddress,
            tokenName,
            tokenSymbol,
            metadata.creator
        );

        return tokenAddress;
    }

    /// @notice Get the token address for an agent
    /// @param agentTokenId The ID of the agent NFT
    /// @return The address of the agent's ERC-20 token
    function getTokenAddress(uint256 agentTokenId)
        public
        view
        returns (address)
    {
        return tokenAddresses[agentTokenId];
    }

    /// @notice Get the total number of created tokens
    /// @return The total count of created agent tokens
    function getCreatedTokensCount() public view returns (uint256) {
        return createdTokens.length;
    }

    /// @notice Get a token address by index
    /// @param index The index in the createdTokens array
    /// @return The address of the token at the specified index
    function getCreatedToken(uint256 index) public view returns (address) {
        require(index < createdTokens.length, "Index out of bounds");
        return createdTokens[index];
    }
}
