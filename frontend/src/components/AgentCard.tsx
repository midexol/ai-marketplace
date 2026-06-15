'use client';

import Link from 'next/link';
import { Agent } from '@/types';
import { formatPrice, formatNumber } from '@/utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AgentAvatar } from '@/components/AgentAvatar';

interface AgentCardProps {
  agent: Agent;
  price?: string;
  marketCap?: string;
  change24h?: string;
  onSelect?: (agent: Agent) => void;
}

// Uniform warm chip — category is conveyed by the label, not a clashing hue.
const TYPE_CHIP = 'bg-[#30200c] text-slate-300 ring-[#76501d]';

export function AgentCard({
  agent,
  price = '0',
  marketCap = '0',
  change24h = '0',
  onSelect,
}: AgentCardProps) {
  const isPositiveChange = parseFloat(change24h) >= 0;
  const name = agent.name || 'Untitled Agent';
  const type = agent.type || 'writing';
  const chains = Array.isArray(agent.chains) ? agent.chains.filter(Boolean) : [];

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
              alt={name}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <AgentAvatar seed={agent.tokenAddresses?.base || agent.id} name={name} />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg font-medium text-white transition group-hover:text-clay-400">
              {name}
            </h3>
            <span
              className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${TYPE_CHIP}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-slate-400">
          {agent.description}
        </p>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-3 border-y border-[#493113] py-4">
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
          {chains.length > 0 ? (
            chains.map((chain) => (
              <span key={chain} className="chip capitalize">
                {chain}
              </span>
            ))
          ) : (
            <span className="chip">No chains</span>
          )}
        </div>
      </div>
    </Link>
  );
}
