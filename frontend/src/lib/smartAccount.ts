import type { ToMetaMaskSmartAccountReturnType } from '@metamask/delegation-toolkit';

/**
 * MetaMask Smart Account (Delegation Toolkit) wiring.
 *
 * Takes the EOA private key produced by the Web3Auth embedded wallet and wraps
 * it in a MetaMask Hybrid smart account on Base Sepolia. This is the
 * hackathon-qualification core: ERC-7710 delegations and the 1Shot relayer
 * operate on the returned smart account.
 *
 * All heavy SDK imports are dynamic so they never run during SSR.
 */

export type SmartAccount = ToMetaMaskSmartAccountReturnType<any>;

// Base Sepolia — cheap testnet with MetaMask Smart Account support.
export const SA_CHAIN_ID = 84532;
const RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

export async function createSmartAccount(privateKey: string): Promise<SmartAccount> {
  const [{ createPublicClient, http }, { privateKeyToAccount }, { baseSepolia }, toolkit] =
    await Promise.all([
      import('viem'),
      import('viem/accounts'),
      import('viem/chains'),
      import('@metamask/delegation-toolkit'),
    ]);

  const { Implementation, toMetaMaskSmartAccount } = toolkit;

  const pk = (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`;
  const account = privateKeyToAccount(pk);

  const client = createPublicClient({ chain: baseSepolia, transport: http(RPC) });

  const smartAccount = await toMetaMaskSmartAccount({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: client as any,
    implementation: Implementation.Hybrid,
    // Hybrid deploy params: [owner, keyIds, xValues, yValues] — no passkeys here.
    deployParams: [account.address, [], [], []],
    deploySalt: '0x',
    signer: { account },
  });

  return smartAccount as SmartAccount;
}
