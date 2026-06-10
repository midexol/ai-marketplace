'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/services/api';
import { formatNumber, formatUSD, shortenAddress } from '@/utils/formatters';
import { PortfolioTable } from '@/components/PortfolioTable';
import { Portfolio } from '@/types';

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
    const interval = setInterval(fetchPortfolio, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [userAddress]);

  if (!userAddress) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <p className="text-slate-300 mb-4">Please connect your wallet to view your portfolio</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Portfolio</h1>
        <p className="text-slate-400">{shortenAddress(userAddress)}</p>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-400 text-sm mb-2">Total Value</p>
          <h2 className="text-3xl font-bold text-white">{formatUSD(parseFloat(value.totalValue))}</h2>
          <p className={`text-sm mt-2 ${value.change24h.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
            {value.change24h} (24h)
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-400 text-sm mb-2">Holdings</p>
          <h2 className="text-3xl font-bold text-white">{formatNumber(portfolio.length)}</h2>
          <p className="text-sm text-slate-400 mt-2">Unique agents</p>
        </div>
      </div>

      {/* Portfolio Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-400">Loading portfolio...</p>
        </div>
      ) : portfolio.length > 0 ? (
        <PortfolioTable holdings={portfolio} />
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-4">You don't have any holdings yet</p>
          <a
            href="/marketplace"
            className="inline-block px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition"
          >
            Browse Marketplace
          </a>
        </div>
      )}
    </main>
  );
}
