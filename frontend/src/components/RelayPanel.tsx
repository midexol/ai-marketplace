'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/WalletProvider';
import { relayGaslessUsdcTransfer, getRelayStatus } from '@/lib/relayer';
import { Fuel, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

/**
 * Gas-abstracted transfer via the 1Shot permissionless relayer.
 * The user signs an ERC-7710 delegation; the relayer executes on-chain and is
 * paid in USDC — no ETH required (EIP-7710 + EIP-7702).
 */
export function RelayPanel({
  recipient,
  recipientLabel,
}: {
  recipient: string;
  recipientLabel: string;
}) {
  const { smartAccount, signerAccount, authenticated } = useAuth();
  const [amount, setAmount] = useState('0.02');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [finalHash, setFinalHash] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    setTaskId(null);
    setFinalHash(null);

    if (!smartAccount || !signerAccount) {
      setError('Smart account not ready. Sign in and wait for it to initialize.');
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Enter a USDC amount greater than 0.');
      return;
    }

    setBusy(true);
    try {
      const atoms = BigInt(Math.floor(amt * 1e6)); // USDC = 6 decimals
      const result = await relayGaslessUsdcTransfer({
        smartAccount,
        signerAccount: signerAccount as never,
        to: recipient as `0x${string}`,
        amount: atoms,
        onStatus: setStatus,
      });
      setTaskId(result.taskId);
      setStatus('Submitted — waiting for confirmation…');

      // Light polling for the demo (webhooks are the production path).
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const s = await getRelayStatus(result.taskId);
        if (s.status === 200) {
          setFinalHash(s.hash || '');
          setStatus('Confirmed on-chain — gas paid in USDC.');
          break;
        }
        if (s.status === 400 || s.status === 500) {
          throw new Error(s.message || 'Relayed transaction reverted');
        }
        setStatus(`Relaying… (status ${s.status})`);
      }
    } catch (err) {
      console.error('Relay failed:', err);
      setError(err instanceof Error ? err.message : 'Relay failed');
      setStatus(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="mb-1 flex items-center gap-2">
        <Fuel className="h-4 w-4 text-clay-400" />
        <h3 className="font-semibold text-white">Gasless Transfer</h3>
      </div>
      <p className="mb-4 text-sm text-slate-400">
        Send USDC to <span className="text-white">{recipientLabel}</span> with{' '}
        <span className="text-clay-400">no ETH</span> — gas is paid in USDC via the 1Shot relayer
        (EIP-7710 + 7702).
      </p>

      {!authenticated ? (
        <p className="rounded-lg border border-[#493113] bg-[#130f08] px-4 py-3 text-sm text-slate-400">
          Sign in to relay a transaction.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-[#493113] bg-[#130f08] px-3 py-2 font-mono text-white placeholder-slate-500 focus:border-clay-600 focus:outline-none"
            />
            <span className="text-sm font-medium text-slate-400">USDC</span>
          </div>

          {status && !error && (
            <div className="flex items-center gap-2 rounded-lg border border-[#493113] bg-[#130f08] px-3 py-2 text-xs text-slate-300">
              {finalHash !== null ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-clay-400" />
              )}
              {status}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {taskId && (
            <p className="font-mono text-[11px] text-slate-500">task: {taskId}</p>
          )}
          {finalHash && (
            <a
              href={`https://sepolia.basescan.org/tx/${finalHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-clay-400 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View on Basescan
            </a>
          )}

          <button onClick={run} disabled={busy} className="btn-primary w-full">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Relaying…
              </>
            ) : (
              <>
                <Fuel className="h-4 w-4" /> Send {amount || '0'} USDC gaslessly
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
