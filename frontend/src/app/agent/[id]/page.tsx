'use client';

import { useState } from 'react';
import { useAgent } from '@/hooks/useAgent';
import { useTrades, useMarketPrice } from '@/hooks/useMarketplace';
import { useAppStore } from '@/store/useAppStore';
import { PriceChart } from '@/components/PriceChart';
import { TradeForm, TradeFormData } from '@/components/TradeForm';
import { Spinner } from '@/components/PageHeader';
import {
  formatPrice,
  formatDate,
  formatTimeAgo,
  formatNumber,
  shortenAddress,
} from '@/utils/formatters';
import { Trade } from '@/types';
import { AlertCircle, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface PageProps {
  params: { id: string };
}

export default function AgentDetailPage({ params }: PageProps) {
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedChain, setSelectedChain] = useState('ethereum');

  const userAddress = useAppStore((state) => state.userAddress);
  const { data: agent, isLoading: agentLoading, error: agentError } = useAgent(params.id);
  const { data: trades, isLoading: tradesLoading } = useTrades(params.id);
  const { data: priceData } = useMarketPrice(params.id, selectedChain);

  const mockChartData = [
    { timestamp: Date.now() - 7 * 86400000, price: 0.38 },
    { timestamp: Date.now() - 6 * 86400000, price: 0.4 },
    { timestamp: Date.now() - 5 * 86400000, price: 0.42 },
    { timestamp: Date.now() - 4 * 86400000, price: 0.39 },
    { timestamp: Date.now() - 3 * 86400000, price: 0.43 },
    { timestamp: Date.now() - 2 * 86400000, price: 0.41 },
    { timestamp: Date.now() - 1 * 86400000, price: 0.45 },
    { timestamp: Date.now(), price: 0.45 },
  ];

  const handleTradeSubmit = async (data: TradeFormData) => {
    console.log('Trade submitted:', { ...data, agentId: params.id, chain: selectedChain });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setShowTradeForm(false);
  };

  if (agentLoading) return <Spinner />;

  if (agentError || !agent) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="card flex items-center gap-3 border-red-500/30 bg-red-500/10 p-6 text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Failed to load agent details. Please try again.
        </div>
      </main>
    );
  }

  const price = priceData?.price || '0';
  const change24h = priceData?.change24h || '0';
  const isUp = parseFloat(change24h) >= 0;
  const tradeHistory = trades?.data || [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <div className="animate-fade-up mb-8 flex flex-col items-start gap-6 sm:flex-row">
        {agent.avatarUrl ? (
          <img src={agent.avatarUrl} alt={agent.name} className="h-24 w-24 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-4xl font-bold text-white">
            {agent.name[0]}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-white">{agent.name}</h1>
          <p className="mt-2 max-w-2xl text-slate-400">{agent.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="chip capitalize text-cyan-300">{agent.type}</span>
            <span className="text-sm text-slate-500">
              by {shortenAddress(agent.creatorAddress)}
            </span>
            <span className="text-sm text-slate-500">{formatDate(agent.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-6 lg:col-span-2">
          {/* Chain selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Blockchain</label>
            <div className="flex flex-wrap gap-2">
              {agent.chains.map((chain) => (
                <button
                  key={chain}
                  onClick={() => setSelectedChain(chain)}
                  className={`rounded-lg px-4 py-2 font-medium capitalize transition ${
                    selectedChain === chain
                      ? 'bg-cyan-600 text-white'
                      : 'border border-[#342d22] bg-[#201b13] text-slate-300 hover:border-[#473e2f]'
                  }`}
                >
                  {chain}
                </button>
              ))}
            </div>
          </div>

          {/* Price summary */}
          <div className="card grid grid-cols-3 gap-4 p-6">
            <div>
              <p className="text-sm text-slate-400">Current Price</p>
              <p className="mt-1 text-3xl font-bold text-gradient-accent">{formatPrice(price)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">24h Change</p>
              <p
                className={`mt-1 flex items-center gap-1 text-2xl font-bold ${
                  isUp ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isUp ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {Math.abs(parseFloat(change24h)).toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Market Cap</p>
              <p className="mt-1 text-2xl font-bold text-white">${formatNumber('1500000', 0)}</p>
            </div>
          </div>

          {/* Chart */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-white">Price History</h2>
            <PriceChart data={mockChartData} height={300} showArea={true} />
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="card p-6">
              <h3 className="mb-4 font-semibold text-white">Agent Stats</h3>
              <Row label="Type" value={agent.type} capitalize />
              <Row label="Networks" value={String(agent.chains.length)} />
              <Row label="Created" value={formatDate(agent.createdAt)} small />
              <Row label="Last Updated" value={formatDate(agent.updatedAt)} small />
            </div>
            <div className="card p-6">
              <h3 className="mb-4 font-semibold text-white">Contract Info</h3>
              {agent.chains.map((chain) => (
                <div key={chain} className="flex items-center justify-between py-1.5">
                  <span className="text-sm capitalize text-slate-400">{chain}</span>
                  <span className="font-mono text-xs text-cyan-400">
                    {agent.tokenAddresses[chain] ? shortenAddress(agent.tokenAddresses[chain]) : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - trade */}
        <div className="space-y-6">
          {userAddress ? (
            showTradeForm ? (
              <div className="card p-6">
                <h2 className="mb-4 text-xl font-semibold text-white">
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} {agent.name}
                </h2>
                <TradeForm
                  agentName={agent.name}
                  currentPrice={price}
                  userBalance="10.5"
                  onSubmit={handleTradeSubmit}
                  tradeType={tradeType}
                  onCancel={() => setShowTradeForm(false)}
                />
              </div>
            ) : (
              <div className="card space-y-3 p-6">
                <button
                  onClick={() => {
                    setTradeType('buy');
                    setShowTradeForm(true);
                  }}
                  className="btn-primary w-full"
                >
                  Buy {agent.name}
                </button>
                <button
                  onClick={() => {
                    setTradeType('sell');
                    setShowTradeForm(true);
                  }}
                  className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-500 active:scale-[0.98]"
                >
                  Sell {agent.name}
                </button>
              </div>
            )
          ) : (
            <div className="card p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#342d22] bg-[#201b13]">
                <Wallet className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-slate-400">Connect your wallet to trade</p>
            </div>
          )}

          <div className="card p-6">
            <h3 className="mb-4 font-semibold text-white">Quick Stats</h3>
            <Row label="Total Supply" value={formatNumber('1000000', 0)} small />
            <Row label="Circulating" value={formatNumber('850000', 0)} small />
            <Row label="24h Volume" value={`$${formatNumber('450000', 0)}`} small />
          </div>
        </div>
      </div>

      {/* Trade history */}
      <div className="card p-6">
        <h2 className="mb-6 text-2xl font-bold text-white">Recent Trades</h2>
        {tradesLoading ? (
          <Spinner />
        ) : tradeHistory.length === 0 ? (
          <p className="py-8 text-center text-slate-400">No trades yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#342d22] text-xs uppercase text-slate-500">
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#342d22]">
                {tradeHistory.slice(0, 10).map((trade: Trade) => (
                  <tr key={trade.id} className="transition hover:bg-[#201b13]">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                          trade.buyer === userAddress
                            ? 'bg-cyan-500/15 text-cyan-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {trade.buyer === userAddress ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white">{formatNumber(trade.amount)}</td>
                    <td className="px-4 py-3 text-right text-white">{formatPrice(trade.price)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      {formatPrice(parseFloat(trade.amount) * parseFloat(trade.price))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-400">
                      {formatTimeAgo(trade.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  small,
  capitalize,
}: {
  label: string;
  value: string;
  small?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium text-white ${small ? 'text-sm' : ''} ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </span>
    </div>
  );
}
