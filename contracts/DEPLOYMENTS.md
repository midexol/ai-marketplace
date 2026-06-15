# Deployments

## Base Sepolia (chainId 84532)

Deployed via `forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --broadcast`.

| Contract | Address |
|---|---|
| Agent (ERC-721) | `0xA99e4f9BB53504d0ce76c0d1Cb3B8bf044a00fBe` |
| AgentToken (implementation) | `0x667A7fd2EFDb68450Cb9049Bf869323e318B680f` |
| BondingCurve | `0x997FB663329ECFA2A02251De107317640a40738E` |
| VIRTUAL (governance) | `0x91273248119dB5050cBC278629c67258daFb25Dd` |
| Factory | `0x50c98a7cA5167F002dD51A5f846b6F5606De276d` |
| Marketplace | `0x3fD571Edd15C7950B99836F809146Ab0fBF3D5D5` |

> Redeploy #2 — fixed `_safeMint`→`_mint` so the Factory (a contract) can mint agents.

- Deployer: `0x06fd7eDeb4fbCB626357222aDC2f8Eb5a051535b`
- USDC (Base Sepolia): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Explorer: https://sepolia.basescan.org

The Factory is authorized as the Agent minter, and seeds each new agent token's
full supply into the BondingCurve (fair launch).
