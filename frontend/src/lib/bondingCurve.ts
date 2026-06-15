/**
 * On-chain trading against the deployed BondingCurve (Base Sepolia), using a
 * direct ethers signer (the Web3Auth key, EIP-7702-upgraded EOA). Buy dispenses
 * tokens for ETH; sell returns ETH for tokens. Prices are read from the
 * contract — the on-chain source of truth. Requires Base Sepolia ETH for gas.
 */

export const BONDING_CURVE_ADDRESS =
  process.env.NEXT_PUBLIC_BONDING_CURVE_ADDRESS ||
  '0x052A5157Af55ad957C92a0dD5c3C0EAe669c64cB';

const RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

const CURVE_ABI = [
  'function getBuyPrice(address token, uint256 amount) view returns (uint256)',
  'function getSellPrice(address token, uint256 amount) view returns (uint256)',
  'function getSupply(address token) view returns (uint256)',
  'function buy(address token, uint256 amount) payable',
  'function sell(address token, uint256 amount)',
];

const ERC20_ABI = ['function approve(address spender, uint256 amount) returns (bool)'];

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
  const { ethers } = await import('ethers');
  const curve = new ethers.Contract(BONDING_CURVE_ADDRESS, CURVE_ABI, signer);
  const amount = ethers.parseUnits(String(amountTokens), 18);
  const cost: bigint = await curve.getBuyPrice(token, amount);

  // Small buffer so a price tick between quote and mine doesn't revert.
  const value = (cost * 101n) / 100n;
  const tx = await curve.buy(token, amount, { value });
  await tx.wait();
  return { hash: tx.hash };
}

/** Sell tokens back to the curve (approve, then sell). */
export async function sellTokens(params: {
  signer: any;
  token: string;
  amountTokens: number;
}): Promise<{ hash: string }> {
  const { signer, token, amountTokens } = params;
  const { ethers } = await import('ethers');
  const amount = ethers.parseUnits(String(amountTokens), 18);

  const erc20 = new ethers.Contract(token, ERC20_ABI, signer);
  const approveTx = await erc20.approve(BONDING_CURVE_ADDRESS, amount);
  await approveTx.wait();

  const curve = new ethers.Contract(BONDING_CURVE_ADDRESS, CURVE_ABI, signer);
  const tx = await curve.sell(token, amount);
  await tx.wait();
  return { hash: tx.hash };
}
