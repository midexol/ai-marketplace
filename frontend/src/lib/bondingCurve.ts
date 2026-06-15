/**
 * On-chain trading against the deployed BondingCurve (Base Sepolia), using a
 * direct ethers signer (the Web3Auth key, EIP-7702-upgraded EOA). Buy dispenses
 * tokens for ETH; sell returns ETH for tokens. Prices are read from the
 * contract — the on-chain source of truth. Requires Base Sepolia ETH for gas.
 */

export const BONDING_CURVE_ADDRESS =
  process.env.NEXT_PUBLIC_BONDING_CURVE_ADDRESS ||
  '0x997FB663329ECFA2A02251De107317640a40738E';

const RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

const CURVE_ABI = [
  'function getBuyPrice(address token, uint256 amount) view returns (uint256)',
  'function getSellPrice(address token, uint256 amount) view returns (uint256)',
  'function getSupply(address token) view returns (uint256)',
  'function buy(address token, uint256 amount) payable',
  'function sell(address token, uint256 amount)',
];

const ERC20_ABI = ['function approve(address spender, uint256 amount) returns (bool)'];

/** Turn a raw ethers/contract error into a short, human-readable message. */
export function humanizeTradeError(err: unknown): string {
  const e = err as any;
  const reason: string =
    e?.reason || e?.revert?.args?.[0] || e?.shortMessage || e?.message || '';

  const map: Record<string, string> = {
    'Insufficient supply': "There aren't enough tokens in the pool to sell that amount yet.",
    'Cannot sell more than supply': "You can't sell more than the pool currently holds.",
    'Insufficient curve inventory': 'This agent has no tokens available to buy yet.',
    'Insufficient payment': 'The price moved — not enough ETH sent. Try again.',
    'Insufficient reserve': 'The pool has no ETH reserve to pay out this sale yet.',
    'Amount below minimum': 'Trade amount is too small (minimum is 1 token).',
  };
  for (const key of Object.keys(map)) {
    if (reason.includes(key)) return map[key];
  }

  if (reason.includes('insufficient funds')) {
    return 'Not enough Base Sepolia ETH for gas. Use the faucet to get test ETH.';
  }
  if (e?.code === 'ACTION_REJECTED' || reason.includes('user rejected')) {
    return 'Transaction rejected.';
  }
  return 'Transaction failed. Please try again.';
}

/** Read-only curve contract (public RPC). */
async function readCurve() {
  const { ethers } = await import('ethers');
  const provider = new ethers.JsonRpcProvider(RPC);
  return new ethers.Contract(BONDING_CURVE_ADDRESS, CURVE_ABI, provider);
}

/** Live buy cost (wei) for `amountTokens` whole tokens. */
export async function getBuyPrice(token: string, amountTokens: number): Promise<bigint> {
  const { ethers } = await import('ethers');
  const curve = await readCurve();
  const amount = ethers.parseUnits(String(amountTokens), 18);
  return curve.getBuyPrice(token, amount);
}

/**
 * Live spot price per 1 token, as a formatted ETH string (e.g. "0.000100").
 * Returns null for DB-only agents (no real on-chain token).
 */
export async function getSpotPriceEth(token?: string): Promise<string | null> {
  if (!token || token === '0x0000000000000000000000000000000000000000') return null;
  try {
    const { ethers } = await import('ethers');
    const wei = await getBuyPrice(token, 1);
    const eth = Number(ethers.formatEther(wei));
    // Small floor price needs more decimals than 2 to be visible.
    return eth.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  } catch {
    return null;
  }
}

export async function getSellPrice(token: string, amountTokens: number): Promise<bigint> {
  const { ethers } = await import('ethers');
  const curve = await readCurve();
  const amount = ethers.parseUnits(String(amountTokens), 18);
  return curve.getSellPrice(token, amount);
}

/** Buy tokens from the curve. `signer` is an ethers Wallet on Base Sepolia. */
export async function buyTokens(params: {
  signer: any;
  token: string;
  amountTokens: number;
}): Promise<{ hash: string }> {
  const { signer, token, amountTokens } = params;
  try {
    const { ethers } = await import('ethers');
    const curve = new ethers.Contract(BONDING_CURVE_ADDRESS, CURVE_ABI, signer);
    const amount = ethers.parseUnits(String(amountTokens), 18);
    const cost: bigint = await curve.getBuyPrice(token, amount);

    // Small buffer so a price tick between quote and mine doesn't revert.
    const value = (cost * 101n) / 100n;
    const tx = await curve.buy(token, amount, { value });
    await tx.wait();
    return { hash: tx.hash };
  } catch (err) {
    throw new Error(humanizeTradeError(err));
  }
}

/** Sell tokens back to the curve (approve, then sell). */
export async function sellTokens(params: {
  signer: any;
  token: string;
  amountTokens: number;
}): Promise<{ hash: string }> {
  const { signer, token, amountTokens } = params;
  try {
    const { ethers } = await import('ethers');
    const amount = ethers.parseUnits(String(amountTokens), 18);

    const erc20 = new ethers.Contract(token, ERC20_ABI, signer);
    const approveTx = await erc20.approve(BONDING_CURVE_ADDRESS, amount);
    await approveTx.wait();

    const curve = new ethers.Contract(BONDING_CURVE_ADDRESS, CURVE_ABI, signer);
    const tx = await curve.sell(token, amount);
    await tx.wait();
    return { hash: tx.hash };
  } catch (err) {
    throw new Error(humanizeTradeError(err));
  }
}
