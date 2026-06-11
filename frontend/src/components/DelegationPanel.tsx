'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/WalletProvider';
import { createSpendDelegation, type Delegation, type Hex } from '@/lib/delegations';
import { shortenAddress } from '@/utils/formatters';
import { ShieldCheck, Loader2, AlertCircle, KeyRound } from 'lucide-react';

/**
 * ERC-7710 demo surface: grant this agent a scoped USDC spend allowance from
 * the user's MetaMask Smart Account. Produces a signed delegation the agent
 * (or the 1Shot relayer) can later redeem.
 */
export function DelegationPanel({
  agentName,
  delegateAddress,
}: {
  agentName: string;
  delegateAddress: string;
}) {
  const { smartAccount, authenticated } = useAuth();
  const [amount, setAmount] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Delegation | null>(null);

  const handleDelegate = async () => {
    setError(null);
    setResult(null);

    if (!smartAccount) {
      setError('Smart account not ready. Sign in and wait for the SA to initialize.');
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Enter a USDC amount greater than 0.');
      return;
    }

    setIsLoading(true);
    try {
      // USDC has 6 decimals.
      const maxAmount = BigInt(Math.floor(amt * 1e6));
      const delegation = await createSpendDelegation({
        delegator: smartAccount,
        delegate: delegateAddress as Hex,
        maxAmount,
      });
      setResult(delegation);
    } catch (err) {
      console.error('Delegation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create delegation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="mb-1 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-clay-400" />
        <h3 className="font-semibold text-white">Grant Spend Permission</h3>
      </div>
      <p className="mb-4 text-sm text-slate-400">
        Delegate a USDC allowance to <span className="text-white">{agentName}</span> via
        ERC-7710. The agent can spend up to this cap on your behalf.
      </p>

      {!authenticated ? (
        <p className="rounded-lg border border-[#342d22] bg-[#16120b] px-4 py-3 text-sm text-slate-400">
          Sign in to grant a delegation.
        </p>
      ) : result ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-clay-600/40 bg-[#201b13] px-4 py-3 text-sm text-clay-400">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Delegated up to {amount} USDC to {agentName}
          </div>
          <dl className="space-y-2 font-mono text-xs text-slate-400">
            <div className="flex justify-between gap-2">
              <dt>delegate</dt>
              <dd className="text-slate-300">{shortenAddress(result.delegate, 6)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>signature</dt>
              <dd className="truncate text-slate-300">{shortenAddress(result.signature, 8)}</dd>
            </div>
          </dl>
          <button onClick={() => setResult(null)} className="btn-ghost w-full text-sm">
            Grant another
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-[#342d22] bg-[#16120b] px-3 py-2 font-mono text-white placeholder-slate-500 focus:border-clay-600 focus:outline-none"
            />
            <span className="text-sm font-medium text-slate-400">USDC</span>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          <button onClick={handleDelegate} disabled={isLoading} className="btn-primary w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing delegation...
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" /> Delegate {amount || '0'} USDC
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
