import type { SmartAccount } from './smartAccount';
import { SA_CHAIN_ID } from './smartAccount';

/**
 * 1Shot Permissionless Relayer client (EIP-7710 + EIP-7702).
 *
 * Submits gas-abstracted delegated transactions: the user signs a delegation
 * to the relayer's targetAddress, the relayer redeems it on-chain and is paid
 * in USDC (no ETH needed). No API key — it's a public JSON-RPC service.
 *
 * Flow per 1Shot public-relayer skill (estimate-first, self-sponsored, 1 chain):
 *   getCapabilities → build+sign bundle → estimate7710Transaction → send7710Transaction → getStatus
 */

type Hex = `0x${string}`;

// Base Sepolia (84532) + Sepolia use the .dev relayer; mainnets use .com.
const RELAYER_URL =
  process.env.NEXT_PUBLIC_RELAYER_URL ||
  (SA_CHAIN_ID === 84532 || SA_CHAIN_ID === 11155111
    ? 'https://relayer.1shotapi.dev/relayers'
    : 'https://relayer.1shotapi.com/relayers');

interface ChainCapabilities {
  feeCollector: Hex;
  targetAddress: Hex;
  tokens: { address: Hex; symbol?: string; decimals: number | string }[];
}

export interface Estimate7710Result {
  success: boolean;
  requiredPaymentAmount?: string;
  context?: string;
  gasUsed?: Record<string, string>;
  error?: string;
}

export interface RelayResult {
  taskId: string;
  requiredPaymentAmount?: string;
  relayerUrl: string;
}

/** Minimal JSON-RPC POST helper against the relayer. */
async function rpc<T>(method: string, params: unknown, id = 1): Promise<T> {
  const res = await fetch(RELAYER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  if (json.error) {
    throw new Error(`[${json.error.code}] ${json.error.message} ${JSON.stringify(json.error.data ?? '')}`);
  }
  return json.result as T;
}

/** Convert delegation bigints / Uint8Arrays into JSON-safe hex for the relayer. */
function toRelayerJson(value: unknown, bytesToHex: (b: Uint8Array) => Hex): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return `0x${value.toString(16)}`;
  if (value instanceof Uint8Array) return bytesToHex(value);
  if (Array.isArray(value)) return value.map((v) => toRelayerJson(v, bytesToHex));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = toRelayerJson(v, bytesToHex);
    return out;
  }
  return value;
}

/**
 * Relay a gasless USDC transfer on behalf of the user's smart account, paying
 * the relayer fee in USDC. Self-sponsored, single-chain (Base Sepolia).
 *
 * @param to        recipient of the "work" transfer
 * @param amount    work amount in USDC atoms (6 decimals), e.g. 20000n = 0.02 USDC
 * @param onStatus  optional progress callback for UI
 */
export async function relayGaslessUsdcTransfer(params: {
  smartAccount: SmartAccount;
  signerAccount: { signAuthorization: (a: any) => Promise<any>; address: Hex };
  to: Hex;
  amount: bigint;
  webhookUrl?: string;
  onStatus?: (msg: string) => void;
}): Promise<RelayResult> {
  const { smartAccount, signerAccount, to, amount, webhookUrl, onStatus } = params;

  const [viem, viemUtils, kit] = await Promise.all([
    import('viem'),
    import('viem/utils'),
    import('@metamask/smart-accounts-kit'),
  ]);
  const { createPublicClient, http, encodeFunctionData, erc20Abi, parseUnits, getAddress } = viem;
  const { bytesToHex } = viemUtils;
  const { ScopeType, createDelegation, getSmartAccountsEnvironment } = kit;

  const chainId = String(SA_CHAIN_ID);
  const j = (v: unknown) => toRelayerJson(v, bytesToHex);
  const freshSalt = () => {
    const b = new Uint8Array(32);
    crypto.getRandomValues(b);
    return bytesToHex(b) as Hex;
  };

  // 1) capabilities — accepted token, feeCollector, and the targetAddress to delegate to
  onStatus?.('Fetching relayer capabilities…');
  const caps = await rpc<Record<string, ChainCapabilities>>('relayer_getCapabilities', [chainId]);
  const chainCaps = caps[chainId];
  if (!chainCaps) throw new Error(`Relayer does not support chain ${chainId}`);
  const usdc = chainCaps.tokens.find((t) => t.symbol === 'USDC') || chainCaps.tokens[0];
  if (!usdc) throw new Error('Relayer reports no accepted payment tokens');
  const usdcDecimals = Number(usdc.decimals);

  // 2) EIP-7702 authorization (upgrade the EOA to a stateless delegator on first use)
  const { baseSepolia } = await import('viem/chains');
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
  const env = getSmartAccountsEnvironment(SA_CHAIN_ID);
  const statelessImpl = env.implementations.EIP7702StatelessDeleGatorImpl;

  let authorizationList: unknown[] | undefined;
  try {
    const code = await publicClient.getCode({ address: signerAccount.address });
    const alreadyUpgraded = !!code && code.toLowerCase().includes(statelessImpl.slice(2).toLowerCase());
    if (!alreadyUpgraded) {
      onStatus?.('Authorizing smart-account upgrade (EIP-7702)…');
      const nonce = await publicClient.getTransactionCount({
        address: signerAccount.address,
        blockTag: 'pending',
      });
      const auth = await signerAccount.signAuthorization({
        chainId: SA_CHAIN_ID,
        contractAddress: getAddress(statelessImpl),
        nonce,
      });
      authorizationList = [
        { address: auth.address, chainId: auth.chainId, nonce: auth.nonce, r: auth.r, s: auth.s, yParity: auth.yParity ?? 0 },
      ];
    }
  } catch (e) {
    // If detection fails, include the authorization to be safe.
    console.warn('7702 upgrade detection failed; including authorization', e);
  }

  // Build + sign the bundle for a given fee amount (re-signable for the estimate loop).
  const buildBundle = async (feeAmount: bigint) => {
    const delegation = createDelegation({
      to: chainCaps.targetAddress,
      from: smartAccount.address as Hex,
      environment: smartAccount.environment,
      salt: freshSalt(),
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: usdc.address,
        maxAmount: feeAmount + amount,
      },
    } as any);
    const signature = await smartAccount.signDelegation({ delegation });
    const feeCalldata = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [chainCaps.feeCollector, feeAmount],
    });
    const workCalldata = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, amount],
    });
    return {
      chainId,
      ...(authorizationList ? { authorizationList } : {}),
      transactions: [
        {
          permissionContext: [j({ ...delegation, signature })],
          executions: [
            { target: usdc.address, value: '0', data: feeCalldata },
            { target: usdc.address, value: '0', data: workCalldata },
          ],
        },
      ],
    };
  };

  // 3) estimate with a mock fee (>= minFee); the relayer returns the real required fee
  onStatus?.('Estimating relayer fee…');
  const mockFee = parseUnits('0.01', usdcDecimals);
  let sendParams = await buildBundle(mockFee);
  let estimate = await rpc<Estimate7710Result>('relayer_estimate7710Transaction', sendParams);
  if (!estimate.success) throw new Error(estimate.error || 'Fee estimate failed');

  // 4) if the required fee differs, rebuild + re-sign + re-estimate
  const requiredFee = BigInt(estimate.requiredPaymentAmount || '0');
  if (requiredFee > 0n && requiredFee !== mockFee) {
    sendParams = await buildBundle(requiredFee);
    estimate = await rpc<Estimate7710Result>('relayer_estimate7710Transaction', sendParams);
    if (!estimate.success) throw new Error(estimate.error || 'Fee re-estimate failed');
  }

  // 5) submit with the signed price-lock context from the estimate
  onStatus?.('Submitting to relayer…');
  const taskId = await rpc<string>('relayer_send7710Transaction', {
    ...sendParams,
    context: estimate.context,
    ...(webhookUrl ? { destinationUrl: webhookUrl } : {}),
  });

  return { taskId, requiredPaymentAmount: estimate.requiredPaymentAmount, relayerUrl: RELAYER_URL };
}

/** Poll a relayed task until it reaches a terminal status. */
export async function getRelayStatus(taskId: string): Promise<{
  status: number;
  hash?: string;
  receipt?: unknown;
  message?: string;
}> {
  return rpc('relayer_getStatus', { id: taskId, logs: false });
}
