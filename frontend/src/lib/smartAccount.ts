import type { ToMetaMaskSmartAccountReturnType } from '@metamask/smart-accounts-kit';
import type { PrivateKeyAccount } from 'viem';

/**
 * MetaMask Smart Account (Smart Accounts Kit) wiring.
 *
 * Wraps the Web3Auth embedded-wallet EOA key in a MetaMask **Stateless7702**
 * smart account on Base Sepolia. This is the form the 1Shot permissionless
 * relayer redeems delegations from (EIP-7710 + EIP-7702). With Stateless7702
 * the smart-account address IS the EOA address (the EOA is upgraded in place).
 *
 * Heavy SDK imports are dynamic so they never run during SSR.
 */

export type SmartAccount = ToMetaMaskSmartAccountReturnType<any>;

export interface SmartAccountBundle {
  smartAccount: SmartAccount;
  /** The underlying viem account — needed to sign the EIP-7702 authorization. */
  account: PrivateKeyAccount;
}

// Base Sepolia — testnet relayer endpoint is https://relayer.1shotapi.dev/relayers
export const SA_CHAIN_ID = 84532;
const RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

export async function createSmartAccount(privateKey: string): Promise<SmartAccountBundle> {
  const [{ createPublicClient, http }, { privateKeyToAccount }, { baseSepolia }, kit] =
    await Promise.all([
      import('viem'),
      import('viem/accounts'),
      import('viem/chains'),
      import('@metamask/smart-accounts-kit'),
    ]);

  const { Implementation, toMetaMaskSmartAccount } = kit;

  const pk = (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`;
  const account = privateKeyToAccount(pk);

  const client = createPublicClient({ chain: baseSepolia, transport: http(RPC) });

  const smartAccount = await toMetaMaskSmartAccount({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: client as any,
    implementation: Implementation.Stateless7702,
    address: account.address,
    signer: { account },
  });

  return { smartAccount: smartAccount as SmartAccount, account };
}
