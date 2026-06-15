// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Agent.sol";
import "../src/AgentToken.sol";
import "../src/BondingCurve.sol";
import "../src/VIRTUAL.sol";
import "../src/Factory.sol";
import "../src/Marketplace.sol";

/// @title Deploy
/// @notice Main deployment script for all AI Agents Marketplace contracts
/// @dev Deploy to Ethereum, Polygon, Arbitrum, Base with: forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
contract Deploy is Script {
    address public agentAddress;
    address public agentTokenAddress;
    address public bondingCurveAddress;
    address public virtualAddress;
    address public factoryAddress;
    address public marketplaceAddress;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Agent NFT contract
        Agent agent = new Agent();
        agentAddress = address(agent);
        console.log("Agent deployed at:", agentAddress);

        // Deploy AgentToken implementation
        AgentToken agentToken = new AgentToken(
            "Test Token",
            "TEST",
            agentAddress
        );
        agentTokenAddress = address(agentToken);
        console.log("AgentToken implementation deployed at:", agentTokenAddress);

        // Deploy BondingCurve contract
        BondingCurve bondingCurve = new BondingCurve();
        bondingCurveAddress = address(bondingCurve);
        console.log("BondingCurve deployed at:", bondingCurveAddress);

        // Deploy VIRTUAL governance token
        VIRTUAL virtualToken = new VIRTUAL();
        virtualAddress = address(virtualToken);
        console.log("VIRTUAL governance token deployed at:", virtualAddress);

        // Deploy Factory contract (wired to the bonding curve for inventory seeding)
        Factory factory = new Factory(agentAddress, bondingCurveAddress);
        factoryAddress = address(factory);
        console.log("Factory deployed at:", factoryAddress);

        // Authorize the Factory to mint agents on the Agent NFT contract.
        agent.setMinter(factoryAddress, true);
        console.log("Factory authorized as Agent minter");

        // Deploy Marketplace contract
        Marketplace marketplace = new Marketplace();
        marketplaceAddress = address(marketplace);
        console.log("Marketplace deployed at:", marketplaceAddress);

        vm.stopBroadcast();

        // Log deployment info
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", vm.envString("CHAIN_NAME"));
        console.log("Deployer:", vm.envAddress("DEPLOYER_ADDRESS"));
        console.log("\nDeployed Contracts:");
        console.log("- Agent (ERC-721):", agentAddress);
        console.log("- AgentToken (ERC-20 Implementation):", agentTokenAddress);
        console.log("- BondingCurve:", bondingCurveAddress);
        console.log("- VIRTUAL (Governance Token):", virtualAddress);
        console.log("- Factory:", factoryAddress);
        console.log("- Marketplace:", marketplaceAddress);

        // Save deployment addresses
        _saveDeploymentAddresses();
    }

    function _saveDeploymentAddresses() internal view {
        console.log("\n=== Save the following to your .env.addresses file ===");
        console.log(
            "export AGENT_ADDRESS=",
            agentAddress
        );
        console.log(
            "export AGENT_TOKEN_ADDRESS=",
            agentTokenAddress
        );
        console.log(
            "export BONDING_CURVE_ADDRESS=",
            bondingCurveAddress
        );
        console.log(
            "export VIRTUAL_ADDRESS=",
            virtualAddress
        );
        console.log(
            "export FACTORY_ADDRESS=",
            factoryAddress
        );
        console.log(
            "export MARKETPLACE_ADDRESS=",
            marketplaceAddress
        );
    }
}
