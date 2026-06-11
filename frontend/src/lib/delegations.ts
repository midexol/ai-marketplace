import type { SmartAccount } from './smartAccount';
import { SA_CHAIN_ID } from './smartAccount';

/**
 * ERC-7710 delegations (MetaMask Delegation Toolkit).
 *
 * The core hackathon primitive: one MetaMask Smart Account (an "agent") grants
 * another a *scoped* permission — e.g. "spend ≤ X USDC" or "call this method on
 * this contract". The delegate later redeems it (directly, or via the 1Shot
 * permissionless relayer paying gas in USDC) to act on the delegator's behalf.
 *
 * - createSpendDelegation  → agent A lets agent B spend up to a USDC cap (x402 payments)
 * - createActionDelegation → agent A lets agent B call a specific target/method (A2A)
 * - buildRedemption        → assembles what the delegate submits to redeem
 */

export type Hex = `0x${string}`;

export interface Delegation {
  delegate: Hex;
  delegator: Hex;
  authority: Hex;
  caveats: { enforcer: Hex; terms: Hex; args: Hex }[];
  salt: Hex;
  signature: Hex;
}

// USDC on Base Sepolia (Circle testnet).
export const USDC_BASE_SEPOLIA: Hex = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

/**
 * Agent A delegates to `delegate` the right to move up to `maxAmount` of an
 * ERC-20 (USDC by default). Returns the signed delegation.
 */
export async function createSpendDelegation(params: {
  delegator: SmartAccount;
  delegate: Hex;
  maxAmount: bigint;
  token?: Hex;
}): Promise<Delegation> {
  const { delegator, delegate, maxAmount, token = USDC_BASE_SEPOLIA } = params;
  const { createDelegation } = await import('@metamask/delegation-toolkit');

  const delegation = createDelegation({
    environment: delegator.environment,
    from: delegator.address as Hex,
    to: delegate,
    scope: {
      type: 'erc20TransferAmount',
      tokenAddress: token,
      maxAmount,
    },
  }) as unknown as Delegation;

  const signature = await delegator.signDelegation({
    delegation,
    chainId: SA_CHAIN_ID,
  });

  return { ...delegation, signature };
}

/**
 * Agent A delegates to `delegate` the right to call specific `selectors` on
 * specific `targets` — the building block for agent-to-agent coordination
 * (the delegate executes an action on the delegator's smart account).
 */
export async function createActionDelegation(params: {
  delegator: SmartAccount;
  delegate: Hex;
  targets: Hex[];
  selectors: Hex[];
}): Promise<Delegation> {
  const { delegator, delegate, targets, selectors } = params;
  const { createDelegation } = await import('@metamask/delegation-toolkit');

  const delegation = createDelegation({
    environment: delegator.environment,
    from: delegator.address as Hex,
    to: delegate,
    scope: {
      type: 'functionCall',
      targets,
      selectors,
    },
  }) as unknown as Delegation;

  const signature = await delegator.signDelegation({
    delegation,
    chainId: SA_CHAIN_ID,
  });

  return { ...delegation, signature };
}

/**
 * Re-delegation: the delegate of `parent` issues a further-scoped delegation to
 * a third party (the A2A coordination requirement). `parent` must already be
 * signed by its delegator.
 */
export async function redelegate(params: {
  delegator: SmartAccount; // the current delegate, now re-delegating
  delegate: Hex;
  parent: Delegation;
  maxAmount: bigint;
  token?: Hex;
}): Promise<Delegation> {
  const { delegator, delegate, parent, maxAmount, token = USDC_BASE_SEPOLIA } = params;
  const { createDelegation } = await import('@metamask/delegation-toolkit');

  const delegation = createDelegation({
    environment: delegator.environment,
    from: delegator.address as Hex,
    to: delegate,
    parentDelegation: parent as never,
    scope: {
      type: 'erc20TransferAmount',
      tokenAddress: token,
      maxAmount,
    },
  }) as unknown as Delegation;

  const signature = await delegator.signDelegation({
    delegation,
    chainId: SA_CHAIN_ID,
  });

  return { ...delegation, signature };
}

/**
 * Assembles the redemption the delegate submits (directly or via the 1Shot
 * relayer) to execute `execution` under the authority of the `delegationChain`.
 * For a single delegation pass `[delegation]`; for re-delegation pass the full
 * chain `[child, ..., root]`.
 */
export async function buildRedemption(params: {
  delegationChain: Delegation[];
  target: Hex;
  value?: bigint;
  callData?: Hex;
}) {
  const { delegationChain, target, value = 0n, callData = '0x' } = params;
  const toolkit = await import('@metamask/delegation-toolkit');
  const { ExecutionMode } = toolkit as unknown as {
    ExecutionMode: { SingleDefault: Hex };
  };

  const execution = { target, value, callData };

  return {
    permissionContext: delegationChain,
    executions: [execution],
    mode: ExecutionMode.SingleDefault,
  };
}
