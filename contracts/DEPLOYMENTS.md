# Deployments

## Base Sepolia (chainId 84532)

Deployed via `forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --broadcast`.

| Contract | Address |
|---|---|
| Agent (ERC-721) | `0x86020f6A49b0b6d4F3139e492221A1972E66F809` |
| AgentToken (implementation) | `0xb6755a34128A4E4D1666C24F84A911Ad64bBfFbA` |
| BondingCurve | `0x052A5157Af55ad957C92a0dD5c3C0EAe669c64cB` |
| VIRTUAL (governance) | `0x5c12e3753529607942Ee4c5BD9753857d5d8f67a` |
| Factory | `0xdf40B6087Ac3B2517953d9c2E47D196b45742917` |
| Marketplace | `0x2D42c1bc5f6197DFAfa4F62dB60228657631fd02` |

- Deployer: `0x06fd7eDeb4fbCB626357222aDC2f8Eb5a051535b`
- USDC (Base Sepolia): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Explorer: https://sepolia.basescan.org

The Factory is authorized as the Agent minter, and seeds each new agent token's
full supply into the BondingCurve (fair launch).
