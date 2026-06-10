'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAgents } from '@/hooks/useAgent';
import { AgentCard } from '@/components/AgentCard';
import { PageHeader, Spinner } from '@/components/PageHeader';
import { PackageOpen } from 'lucide-react';

export default function MarketplacePage() {
  const { authenticated, isLoading: authLoading } = useRequireAuth();
  const { data, isLoading: agentsLoading } = useAgents();

  if (authLoading) return <Spinner />;
  if (!authenticated) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <PageHeader
        eyebrow="Marketplace"
        title="Discover AI Agents"
        subtitle="Browse, analyze, and trade autonomous agents across four blockchains."
      />

      {agentsLoading ? (
        <Spinner />
      ) : data && data.data.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((agent, i) => (
            <div key={agent.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <AgentCard agent={agent} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <PackageOpen className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white">No agents yet</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Be the first to launch an AI agent on Synapse. Head to Create Agent to get started.
          </p>
        </div>
      )}
    </main>
  );
}
