'use client';

import { useState } from 'react';
import { formatPrice } from '@/utils/formatters';
import { isValidTradeAmount } from '@/utils/validators';

export interface TradeFormData {
  amount: string;
  price: string;
  total: string;
  type: 'buy' | 'sell';
}

interface TradeFormProps {
  agentName: string;
  currentPrice: string;
  userBalance: string;
  onSubmit: (data: TradeFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onCancel?: () => void;
  tradeType?: 'buy' | 'sell';
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

  const priceNum = parseFloat(currentPrice) || 0;
  const amountNum = parseFloat(amount) || 0;
  const total = (priceNum * amountNum).toFixed(6);

  const balanceNum = parseFloat(userBalance) || 0;
  const maxAmount =
    selectedType === 'buy'
      ? priceNum > 0 ? (balanceNum / priceNum).toFixed(6) : '0'
      : userBalance;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setFormError(null);
  };

  const handleMaxClick = () => {
    setAmount(maxAmount);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!amount) {
      setFormError('Please enter an amount');
      return;
    }

    if (!isValidTradeAmount(amount, maxAmount)) {
      setFormError(
        `Amount exceeds available ${selectedType === 'buy' ? 'balance' : 'holdings'}`
      );
      return;
    }

    try {
      await onSubmit({
        amount,
        price: currentPrice,
        total,
        type: selectedType,
      });
      setAmount('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Trade failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Trade Type Selector */}
      <div className="flex gap-2 p-1 bg-slate-700/50 rounded-lg">
        <button
          type="button"
          onClick={() => {
            setSelectedType('buy');
            setAmount('');
            setFormError(null);
          }}
          className={`flex-1 py-2 px-3 rounded font-medium transition ${
            selectedType === 'buy'
              ? 'bg-cyan-600 text-white'
              : 'bg-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedType('sell');
            setAmount('');
            setFormError(null);
          }}
          className={`flex-1 py-2 px-3 rounded font-medium transition ${
            selectedType === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Price Display */}
      <div className="bg-slate-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Current Price</span>
          <span className="text-lg font-semibold text-cyan-400">
            {formatPrice(currentPrice)}
          </span>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Amount ({agentName} tokens)
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            step="0.0001"
            min="0"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
          <button
            type="button"
            onClick={handleMaxClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
          >
            Max
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Available: {maxAmount} {agentName}
          </p>
          <p className="text-xs text-slate-500">
            Max: {maxAmount}
          </p>
        </div>
      </div>

      {/* Total */}
      <div className="bg-slate-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Total {selectedType === 'buy' ? 'Cost' : 'Proceeds'}
          </span>
          <span className="text-lg font-semibold text-white">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {(formError || error) && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <p className="text-sm text-red-400">{formError || error}</p>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading || !amount}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedType === 'buy'
              ? 'bg-cyan-600 hover:bg-cyan-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            `${selectedType === 'buy' ? 'Buy' : 'Sell'} ${amount ? amount + ' ' : ''}${agentName}`
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-white transition"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Info Message */}
      <p className="text-xs text-slate-500 text-center">
        {selectedType === 'buy'
          ? 'You will receive the tokens after confirmation'
          : 'You will receive payment after confirmation'}
      </p>
    </form>
  );
}
