'use client';

import { useState, useEffect } from 'react';

export interface TradeFormData {
  amount: string;
  price: string;
  total: string;
  type: 'buy' | 'sell';
}

interface TradeFormProps {
  agentName: string;
  /** Spot price per 1 token, in ETH (decimal string). */
  currentPrice: string;
  /** User's token balance (whole tokens, decimal string). */
  userBalance: string;
  onSubmit: (data: TradeFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onCancel?: () => void;
  tradeType?: 'buy' | 'sell';
}

/** Plain decimal ETH formatter (these are ETH amounts, NOT wei). */
function fmtEth(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: n < 1 ? 4 : 2, maximumFractionDigits: 6 });
}

export function TradeForm({
  agentName,
  currentPrice,
  userBalance,
  onSubmit,
  isLoading = false,
  error = null,
  onCancel,
  tradeType = 'buy',
}: TradeFormProps) {
  const [amount, setAmount] = useState('');
  const [selectedType, setSelectedType] = useState<'buy' | 'sell'>(tradeType);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync when the parent flips Buy/Sell (was the "stuck" bug).
  useEffect(() => {
    setSelectedType(tradeType);
  }, [tradeType]);

  const pricePerToken = parseFloat(currentPrice) || 0; // ETH per token
  const amountNum = parseFloat(amount) || 0; // tokens
  const balanceNum = parseFloat(userBalance) || 0; // token balance
  const totalEth = pricePerToken * amountNum; // ETH cost/proceeds

  const switchTo = (t: 'buy' | 'sell') => {
    setSelectedType(t);
    setAmount('');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!amountNum || amountNum <= 0) {
      setFormError('Enter an amount');
      return;
    }
    if (selectedType === 'sell' && amountNum > balanceNum) {
      setFormError(`You only hold ${fmtEth(balanceNum)} ${agentName}`);
      return;
    }

    try {
      await onSubmit({ amount, price: currentPrice, total: String(totalEth), type: selectedType });
      setAmount('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Trade failed');
    }
  };

  const isBuy = selectedType === 'buy';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Buy / Sell toggle */}
      <div className="flex gap-1 rounded-lg bg-[#130f08] p-1">
        <button
          type="button"
          onClick={() => switchTo('buy')}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            isBuy ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => switchTo('sell')}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            !isBuy ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Rate */}
      <div className="flex items-center justify-between rounded-lg border border-[#493113] bg-[#130f08] px-4 py-3 text-sm">
        <span className="text-slate-400">Rate</span>
        <span className="font-mono text-clay-400">
          1 {agentName} = {fmtEth(pricePerToken)} ETH
        </span>
      </div>

      {/* Amount input */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300">Amount ({agentName})</label>
          {!isBuy && (
            <span className="text-xs text-slate-500">
              Balance: {fmtEth(balanceNum)}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setFormError(null);
            }}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full rounded-lg border border-[#493113] bg-[#130f08] px-4 py-3 font-mono text-white placeholder-slate-500 focus:border-clay-600 focus:outline-none"
          />
          {!isBuy && balanceNum > 0 && (
            <button
              type="button"
              onClick={() => setAmount(String(balanceNum))}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-clay-400 hover:text-clay-300"
            >
              Max
            </button>
          )}
        </div>
      </div>

      {/* Conversion summary — the DEX "you pay / you receive" */}
      <div className="space-y-2 rounded-lg border border-[#493113] bg-[#130f08] px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{isBuy ? 'You pay' : 'You receive'}</span>
          <span className="font-mono font-semibold text-white">{fmtEth(totalEth)} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{isBuy ? 'You receive' : 'You sell'}</span>
          <span className="font-mono text-slate-300">
            {amountNum ? fmtEth(amountNum) : '0.00'} {agentName}
          </span>
        </div>
      </div>

      {(formError || error) && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
          <p className="text-sm text-red-300">{formError || error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isLoading || !amountNum}
          className={`flex-1 rounded-lg py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isBuy ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing…
            </span>
          ) : (
            `${isBuy ? 'Buy' : 'Sell'} ${agentName}`
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-[#23170a] px-6 py-3 font-semibold text-white transition hover:bg-[#30200c]"
          >
            Cancel
          </button>
        )}
      </div>

      <p className="text-center text-xs text-slate-500">
        {isBuy
          ? 'Tokens are dispensed from the bonding curve after confirmation.'
          : 'ETH proceeds are sent after confirmation.'}
      </p>
    </form>
  );
}
