'use client';

import { useState } from 'react';
import { useAgent } from '@/hooks/useAgent';
import { useTrades, useMarketPrice } from '@/hooks/useMarketplace';
import { useAppStore } from '@/store/useAppStore';
import { PriceChart } from '@/components/PriceChart';
import { TradeForm, TradeFormData } from '@/components/TradeForm';
import { formatPrice, formatDate, formatTimeAgo, formatNumber, shortenAddress } from '@/utils/formatters';
import { Trade } from '@/types';

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

  // Mock chart data (in production, fetch from API)
  const mockChartData = [
    { timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, price: 0.38 },
    { timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000, price: 0.40 },
    { timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, price: 0.42 },
    { timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000, price: 0.39 },
    { timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, price: 0.43 },
    { timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, price: 0.41 },
    { timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, price: 0.45 },
    { timestamp: Date.now(), price: 0.45 },
  ];

  const handleTradeSubmit = async (data: TradeFormData) => {
    // Mock trade submission
    console.log('Trade submitted:', { ...data, agentId: params.id, chain: selectedChain });
    // In production, call API to execute trade
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setShowTradeForm(false);
  };

  if (agentLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            <p className="text-slate-400">Loading agent details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (agentError || !agent) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-200 mb-2">Error</h2>
          <p className="text-red-300">Failed to load agent details. Please try again.</p>
        </div>
      </main>
    );
  }

  const price = priceData?.price || '0';
  const change24h = priceData?.change24h || '0';
  const tradeHistory = trades?.data || [];

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-start gap-6 mb-6">
          {agent.avatarUrl ? (
            <img
              src={agent.avatarUrl}
              alt={agent.name}
              className="w-24 h-24 rounded-xl object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
              {agent.name[0]}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">{agent.name}</h1>
            <p className="text-lg text-slate-400 mb-4">{agent.description}</p>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-medium">
                {agent.type.charAt(0).toUpperCase() + agent.type.slice(1)}
              </span>
              <span className="text-sm text-slate-400">
                Created by {shortenAddress(agent.creatorAddress)}
              </span>
              <span className="text-sm text-slate-400">
                {formatDate(agent.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column - Chart and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chain Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Blockchain
            </label>
            <div className="flex flex-wrap gap-2">
              {agent.chains.map((chain) => (
                <button
                  key={chain}
                  onClick={() => setSelectedChain(chain)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedChain === chain
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {chain}
                </button>
              ))}
            </div>
          </div>

          {/* Price Section */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">Current Price</p>
                <p className="text-3xl font-bold text-cyan-400">
                  {formatPrice(price)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">24h Change</p>
                <p
                  className={`text-2xl font-bold ${
                    parseFloat(change24h) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {parseFloat(change24h) >= 0 ? '+' : ''}{parseFloat(change24h).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Market Cap</p>
                <p className="text-2xl font-bold text-white">
                  ${formatNumber('1500000', 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Price History</h2>
            <PriceChart data={mockChartData} height={300} showArea={true} />
          </div>

          {/* Agent Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4">Agent Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white font-medium">
                    {agent.type.charAt(0).toUpperCase() + agent.type.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Networks</span>
                  <span className="text-white font-medium">{agent.chains.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Created</span>
                  <span className="text-white font-medium text-sm">
                    {formatDate(agent.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Updated</span>
                  <span className="text-white font-medium text-sm">
                    {formatDate(agent.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4">Contract Info</h3>
              <div className="space-y-3">
                {agent.chains.map((chain) => (
                  <div key={chain} className="flex items-start justify-between">
                    <span className="text-slate-400 text-sm">{chain}</span>
                    <span className="text-cyan-400 font-mono text-xs break-all">
                      {agent.tokenAddresses[chain] ? shortenAddress(agent.tokenAddresses[chain]) : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Trade Form */}
        <div className="space-y-6">
          {/* Trade Section */}
          {userAddress ? (
            <>
              {showTradeForm ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
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
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-3">
                  <button
                    onClick={() => {
                      setTradeType('buy');
                      setShowTradeForm(true);
                    }}
                    className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold text-white transition"
                  >
                    Buy {agent.name}
                  </button>
                  <button
                    onClick={() => {
                      setTradeType('sell');
                      setShowTradeForm(true);
                    }}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white transition"
                  >
                    Sell {agent.name}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center">
              <p className="text-slate-400 mb-4">Connect your wallet to trade</p>
              <button className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold text-white transition">
                Connect Wallet
              </button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="font-semibold text-white mb-4">Quick Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Supply</span>
                <span className="text-white font-medium">
                  {formatNumber('1000000', 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Circulating</span>
                <span className="text-white font-medium">
                  {formatNumber('850000', 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">24h Volume</span>
                <span className="text-white font-medium">
                  ${formatNumber('450000', 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trade History */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Trades</h2>

        {tradesLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : tradeHistory.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No trades yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {tradeHistory.slice(0, 10).map((trade: Trade) => (
                  <tr key={trade.id} className="hover:bg-slate-700/50 transition">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          trade.buyer === userAddress
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-orange-500/20 text-orange-300'
                        }`}
                      >
                        {trade.buyer === userAddress ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {formatNumber(trade.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {formatPrice(trade.price)}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-semibold">
                      {formatPrice(parseFloat(trade.amount) * parseFloat(trade.price))}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 text-sm">
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
