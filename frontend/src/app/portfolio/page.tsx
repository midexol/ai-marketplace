'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/services/api';
import { formatNumber, formatUSD, shortenAddress } from '@/utils/formatters';
import { PortfolioTable } from '@/components/PortfolioTable';
import { PageHeader, Spinner } from '@/components/PageHeader';
import { Portfolio } from '@/types';
import { Wallet, Layers, TrendingUp, TrendingDown, Inbox } from 'lucide-react';

export default function PortfolioPage() {
  const userAddress = useAppStore((state) => state.userAddress);
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [value, setValue] = useState({ totalValue: '0', change24h: '0%' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userAddress) return;

    const fetchPortfolio = async () => {
      setIsLoading(true);
      try {
        const [portfolioData, valueData] = await Promise.all([
          apiClient.getPortfolio(userAddress),
          apiClient.getPortfolioValue(userAddress),
        ]);
        setPortfolio(portfolioData);
        setValue(valueData);
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, [userAddress]);

  if (!userAddress) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <ConnectPrompt
          icon={<Wallet className="h-8 w-8 text-slate-500" />}
          text="Connect your wallet to view your portfolio."
        />
      </main>
    );
  }

  const isNegative = value.change24h.includes('-');

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <PageHeader eyebrow="Portfolio" title="Your Holdings" subtitle={shortenAddress(userAddress)} />

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="card p-6">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Total Value</span>
          </div>
          <h2 className="text-3xl font-bold text-white">{formatUSD(parseFloat(value.totalValue))}</h2>
          <p className={`mt-2 flex items-center gap-1 text-sm ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
            {isNegative ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            {value.change24h} (24h)
          </p>
        </div>

        <div className="card p-6">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <Layers className="h-4 w-4" />
            <span className="text-sm">Holdings</span>
          </div>
          <h2 className="text-3xl font-bold text-white">{formatNumber(portfolio.length)}</h2>
          <p className="mt-2 text-sm text-slate-400">Unique agents</p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner />
      ) : portfolio.length > 0 ? (
        <div className="card overflow-hidden">
          <PortfolioTable holdings={portfolio} />
        </div>
      ) : (
        <ConnectPrompt
          icon={<Inbox className="h-8 w-8 text-slate-500" />}
          text="You don't have any holdings yet."
          cta={
            <Link href="/marketplace" className="btn-primary mt-6">
              Browse Marketplace
            </Link>
          }
        />
      )}
    </main>
  );
}

function ConnectPrompt({
  icon,
  text,
  cta,
}: {
  icon: React.ReactNode;
  text: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#342d22] bg-[#201b13]">
        {icon}
      </div>
      <p className="max-w-sm text-slate-400">{text}</p>
      {cta}
    </div>
  );
}
