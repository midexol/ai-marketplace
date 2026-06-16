'use client';

import { useEffect, useState } from 'react';
import { useAgent } from '@/hooks/useAgent';
import { useTrades, useMarketPrice } from '@/hooks/useMarketplace';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/providers/WalletProvider';
import { PriceChart } from '@/components/PriceChart';
import { TradeForm, TradeFormData } from '@/components/TradeForm';
import { RelayPanel } from '@/components/RelayPanel';
import { RunAgentPanel } from '@/components/RunAgentPanel';
import { ReputationStakingPanel } from '@/components/ReputationStakingPanel';
import { BackButton } from '@/components/BackButton';
import { AgentAvatar } from '@/components/AgentAvatar';
import { Spinner } from '@/components/PageHeader';
import {
  formatPrice,
  formatDate,
  formatTimeAgo,
  formatNumber,
  shortenAddress,
} from '@/utils/formatters';
import { Trade } from '@/types';
import { AlertCircle, TrendingUp, TrendingDown, Wallet, Bot, Sparkles, BadgeCheck } from 'lucide-react';

interface PageProps {
  params: { id: string };
}

export default function AgentDetailPage({ params }: PageProps) {
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedChain, setSelectedChain] = useState('base');
  const [spotPrice, setSpotPrice] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState('0');

  const userAddress = useAppStore((state) => state.userAddress);
  const { getEthersSigner } = useAuth();
  const { data: agent, isLoading: agentLoading, error: agentError } = useAgent(params.id);
  const { data: trades, isLoading: tradesLoading } = useTrades(params.id);
  const { data: priceData } = useMarketPrice(params.id, selectedChain);
  const { data: portfolio } = usePortfolio(userAddress);

  const isCreator = agent?.creatorAddress?.toLowerCase() === userAddress?.toLowerCase();
  const hasBought = isCreator || (portfolio?.some((item) => item.agentId === params.id && parseFloat(item.balance) > 0) || false);
  const chains = Array.isArray(agent?.chains) ? agent.chains.filter(Boolean) : [];
  const activeChain = chains.includes(selectedChain) ? selectedChain : chains[0] || 'ethereum';

  useEffect(() => {
    if (agent && activeChain !== selectedChain) {
      setSelectedChain(activeChain);
    }
  }, [activeChain, agent, selectedChain]);

  // Read the live spot price from the on-chain BondingCurve.
  const onchainToken = agent?.tokenAddresses?.base;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!onchainToken) {
        setSpotPrice(null);
        return;
      }
      const { getSpotPriceEth, getTokenBalance } = await import('@/lib/bondingCurve');
      const [p, bal] = await Promise.all([
        getSpotPriceEth(onchainToken),
        userAddress ? getTokenBalance(onchainToken, userAddress) : Promise.resolve('0'),
      ]);
      if (!cancelled) {
        setSpotPrice(p);
        setTokenBalance(bal);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onchainToken, userAddress]);

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
    // Real on-chain trade against the deployed BondingCurve (Base Sepolia).
    const tokenAddress = agent?.tokenAddresses?.base;
    if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('This agent has no on-chain token yet — trading unavailable.');
    }
    const signer = await getEthersSigner();
    if (!signer) throw new Error('Wallet not ready. Sign in and try again.');

    const amountTokens = parseFloat(data.amount);
    if (!amountTokens || amountTokens <= 0) throw new Error('Enter a valid amount.');

    const { buyTokens, sellTokens } = await import('@/lib/bondingCurve');
    if (data.type === 'buy') {
      await buyTokens({ signer, token: tokenAddress, amountTokens });
    } else {
      await sellTokens({ signer, token: tokenAddress, amountTokens });
    }
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

  const change24h = priceData?.change24h || '0';
  const isUp = parseFloat(change24h) >= 0;
  const tradeHistory = trades?.data || [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <BackButton fallback="/marketplace" label="Back to marketplace" />

      {/* Hero — banner card matching the marketplace cards */}
      {(() => {
        const seed = agent.tokenAddresses?.base || agent.id;
        let hh = 0;
        for (let i = 0; i < seed.length; i++) hh = (hh * 31 + seed.charCodeAt(i)) >>> 0;
        const hue = hh % 360;
        const onChain =
          !!agent.tokenAddresses?.base &&
          agent.tokenAddresses.base !== '0x0000000000000000000000000000000000000000';
        return (
          <div className="card animate-fade-up mb-8 overflow-hidden p-0">
            {/* Cover banner */}
            <div
              className="relative h-28"
              style={{
                backgroundImage: `linear-gradient(120deg, hsl(${hue} 65% 30%), hsl(${(hue + 50) % 360} 60% 18%))`,
              }}
            >
              <div className="absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:14px_14px]" />
              {onChain && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/30 backdrop-blur-sm">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  On-chain
                </span>
              )}
            </div>

            <div className="relative z-10 px-6 pb-6 sm:px-8">
              <div className="relative z-10 -mt-12 mb-4 flex items-end gap-5">
                <div className="shrink-0 rounded-2xl ring-4 ring-[#23170a]">
                  {agent.avatarUrl ? (
                    <img src={agent.avatarUrl} alt={agent.name} className="h-24 w-24 rounded-2xl object-cover" />
                  ) : (
                    <AgentAvatar seed={seed} name={agent.name || 'Untitled Agent'} className="h-24 w-24" rounded="rounded-2xl" />
                  )}
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">{agent.name}</h1>
              <p className="mt-2 max-w-2xl text-slate-400">{agent.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="chip capitalize text-cyan-300">{agent.type || 'writing'}</span>
                <span className="text-sm text-slate-500">by {shortenAddress(agent.creatorAddress)}</span>
                <span className="text-sm text-slate-500">{formatDate(agent.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-6 lg:col-span-2">
          {/* Run the agent — Venice AI in the main flow (Unlocked only if bought/owned) */}
          {hasBought ? (
            <RunAgentPanel
              agentId={agent.id}
              agentName={agent.name}
              agentType={agent.type}
              creatorAddress={agent.creatorAddress}
            />
          ) : (
            <div className="card flex flex-col items-center justify-center h-[550px] text-center p-8 border-[#38260f] bg-[#0d0a05] relative overflow-hidden animate-fade-in">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,182,64,0.03)_0%,transparent_60%)] pointer-events-none" />
              
              <div className="relative z-10 space-y-6 max-w-md">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ffb640]/20 bg-[#23170a] text-[#ffb640] animate-pulse shadow-[0_0_20px_rgba(255,182,64,0.1)]">
                  <Bot className="h-8 w-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-display text-xl font-bold text-white">Terminal Locked</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    You must own <span className="font-semibold text-amber-400">{agent.name}</span> tokens to chat and interact with this agent.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setTradeType('buy');
                      setShowTradeForm(true);
                    }}
                    className="btn-primary px-8 py-3 inline-flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" /> Buy {agent.name} Tokens
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chain selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Blockchain</label>
            <div className="flex flex-wrap gap-2">
              {chains.length > 0 ? (
                chains.map((chain) => (
                  <button
                    key={chain}
                    onClick={() => setSelectedChain(chain)}
                    className={`rounded-lg px-4 py-2 font-medium capitalize transition ${
                      activeChain === chain
                        ? 'bg-cyan-600 text-white'
                        : 'border border-[#493113] bg-[#23170a] text-slate-300 hover:border-[#76501d]'
                    }`}
                  >
                    {chain}
                  </button>
                ))
              ) : (
                <span className="chip">No chains configured</span>
              )}
            </div>
          </div>

          {/* Price summary */}
          <div className="card grid grid-cols-3 gap-4 p-6">
            <div>
              <p className="text-sm text-slate-400">Current Price</p>
              <p className="mt-1 text-3xl font-bold text-gradient-accent">
                {spotPrice ? `${spotPrice} ETH` : onchainToken ? '…' : '—'}
              </p>
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
              <Row label="Type" value={agent.type || 'writing'} capitalize />
              <Row label="Networks" value={String(chains.length)} />
              <Row label="Created" value={formatDate(agent.createdAt)} small />
              <Row label="Last Updated" value={formatDate(agent.updatedAt)} small />
            </div>
            <div className="card p-6">
              <h3 className="mb-4 font-semibold text-white">Contract Info</h3>
              {chains.map((chain) => (
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
                  currentPrice={(spotPrice || '0').replace(/,/g, '')}
                  userBalance={tokenBalance}
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
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#493113] bg-[#23170a]">
                <Wallet className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-slate-400">Connect your wallet to trade</p>
            </div>
          )}

          {/* Trust and reputation staking backing */}
          <ReputationStakingPanel agentId={agent.id} />

          {/* Gasless USDC transfer via the 1Shot relayer (EIP-7710 + 7702) */}
          <RelayPanel recipient={agent.creatorAddress} recipientLabel={agent.name} />

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
                <tr className="border-b border-[#493113] text-xs uppercase text-slate-500">
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#493113]">
                {tradeHistory.slice(0, 10).map((trade: Trade) => (
                  <tr key={trade.id} className="transition hover:bg-[#23170a]">
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
