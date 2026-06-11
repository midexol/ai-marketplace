'use client';

import Link from 'next/link';
import { Portfolio, Agent } from '@/types';
import { formatPrice, formatNumber } from '@/utils/formatters';

interface PortfolioTableProps {
  holdings: (Portfolio & { agent?: Agent; price?: string; percentageChange?: string })[];
  isLoading?: boolean;
  error?: string | null;
  onSell?: (holding: Portfolio) => void;
}

export function PortfolioTable({
  holdings,
  isLoading = false,
  error = null,
  onSell,
}: PortfolioTableProps) {
  const totalValue = holdings.reduce((sum, h) => {
    const price = parseFloat(h.price || '0');
    const balance = parseFloat(h.balance);
    return sum + price * balance;
  }, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 rounded-lg p-4 animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-700 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-700 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!holdings || holdings.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Holdings</h3>
        <p className="text-slate-400 mb-4">
          You haven't purchased any agent tokens yet
        </p>
        <Link
          href="/marketplace"
          className="inline-block px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium text-white transition"
        >
          Browse Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-cyan-400">
            {formatPrice(totalValue)}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Holdings</p>
          <p className="text-2xl font-bold text-white">{holdings.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Avg. Return</p>
          <p className="text-2xl font-bold text-green-400">+12.5%</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Last Updated</p>
          <p className="text-sm font-semibold text-slate-300">Just now</p>
        </div>
      </div>

      {/* Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Agent
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Value
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Change
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Chain
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {holdings.map((holding) => {
              const price = parseFloat(holding.price || '0');
              const balance = parseFloat(holding.balance);
              const value = price * balance;
              const change = parseFloat(holding.percentageChange || '0');

              return (
                <tr
                  key={holding.id}
                  className="hover:bg-slate-800/50 transition border-b border-slate-700/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/agent/${holding.agentId}`}
                      className="flex items-center gap-3 hover:text-cyan-400 transition"
                    >
                      {holding.agent?.avatarUrl ? (
                        <img
                          src={holding.agent.avatarUrl}
                          alt={holding.agent?.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffb640] via-[#ffd166] to-[#f59e1b] flex items-center justify-center text-[#211100] text-xs font-bold shadow-[0_12px_24px_-18px_rgba(255,190,76,0.9)]">
                          {holding.agent?.name[0] || 'A'}
                        </div>
                      )}
                      <span className="font-medium text-white">
                        {holding.agent?.name || 'Unknown'}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-white font-medium">
                      {formatNumber(balance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-300">{formatPrice(price)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-white font-semibold">
                      {formatPrice(value)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-semibold ${
                        change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-medium px-2 py-1 bg-slate-700/50 text-slate-300 rounded">
                      {holding.chain}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {onSell && (
                      <button
                        onClick={() => onSell(holding)}
                        className="px-3 py-1 text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded transition"
                      >
                        Sell
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {holdings.map((holding) => {
          const price = parseFloat(holding.price || '0');
          const balance = parseFloat(holding.balance);
          const value = price * balance;
          const change = parseFloat(holding.percentageChange || '0');

          return (
            <div
              key={holding.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <Link
                  href={`/agent/${holding.agentId}`}
                  className="flex items-center gap-3 hover:text-cyan-400 transition"
                >
                  {holding.agent?.avatarUrl ? (
                    <img
                      src={holding.agent.avatarUrl}
                      alt={holding.agent?.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ffb640] via-[#ffd166] to-[#f59e1b] flex items-center justify-center text-[#211100] text-sm font-bold shadow-[0_12px_24px_-18px_rgba(255,190,76,0.9)]">
                      {holding.agent?.name[0] || 'A'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">
                      {holding.agent?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-400">{holding.chain}</p>
                  </div>
                </Link>
                {onSell && (
                  <button
                    onClick={() => onSell(holding)}
                    className="px-3 py-1 text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded transition"
                  >
                    Sell
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Balance</p>
                  <p className="font-semibold text-white">
                    {formatNumber(balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Price</p>
                  <p className="font-semibold text-white">{formatPrice(price)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Value</p>
                  <p className="font-semibold text-white">
                    {formatPrice(value)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Change</p>
                  <p
                    className={`font-semibold ${
                      change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
