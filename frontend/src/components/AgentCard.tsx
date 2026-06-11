'use client';

import Link from 'next/link';
import { Agent } from '@/types';
import { formatPrice, formatNumber } from '@/utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  price?: string;
  marketCap?: string;
  change24h?: string;
  onSelect?: (agent: Agent) => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  writing: { bg: 'bg-purple-500/15', text: 'text-purple-300', ring: 'ring-purple-500/30' },
  research: { bg: 'bg-blue-500/15', text: 'text-blue-300', ring: 'ring-blue-500/30' },
  governance: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', ring: 'ring-emerald-500/30' },
  butler: { bg: 'bg-amber-500/15', text: 'text-amber-300', ring: 'ring-amber-500/30' },
};

export function AgentCard({
  agent,
  price = '0',
  marketCap = '0',
  change24h = '0',
  onSelect,
}: AgentCardProps) {
  const typeColor = TYPE_COLORS[agent.type] || TYPE_COLORS.writing;
  const isPositiveChange = parseFloat(change24h) >= 0;

  return (
    <Link href={`/agent/${agent.id}`}>
      <div
        onClick={() => onSelect?.(agent)}
        className="card card-hover group h-full cursor-pointer p-6"
      >
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          {agent.avatarUrl ? (
            <img
              src={agent.avatarUrl}
              alt={agent.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-lg font-bold text-[#1a1509]">
              {agent.name[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-white transition group-hover:text-cyan-300">
              {agent.name}
            </h3>
            <span
              className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${typeColor.bg} ${typeColor.text} ${typeColor.ring}`}
            >
              {agent.type.charAt(0).toUpperCase() + agent.type.slice(1)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-slate-400">
          {agent.description}
        </p>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-3 border-y border-white/10 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Price</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{formatPrice(price)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Mkt Cap</p>
            <p className="mt-0.5 text-sm font-semibold text-white">${formatNumber(marketCap, 0)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">24h</p>
            <p
              className={`mt-0.5 flex items-center gap-1 text-sm font-semibold ${
                isPositiveChange ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isPositiveChange ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(parseFloat(change24h)).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Chains */}
        <div className="flex flex-wrap gap-2">
          {agent.chains.map((chain) => (
            <span key={chain} className="chip capitalize">
              {chain}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
