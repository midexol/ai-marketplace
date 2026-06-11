'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAgents } from '@/hooks/useAgent';
import { AgentCard } from '@/components/AgentCard';
import { PageHeader, Spinner } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { PackageOpen, ServerCrash } from 'lucide-react';

export default function MarketplacePage() {
  const { authenticated, isLoading: authLoading } = useRequireAuth();
  const { data, isLoading: agentsLoading, isError, refetch } = useAgents();

  if (authLoading) return <Spinner />;
  if (!authenticated) return null;

  const agents = data?.data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <PageHeader
        eyebrow="Marketplace"
        title="Discover AI Agents"
        subtitle="Browse, analyze, and trade autonomous agents across four blockchains."
      />

      {agentsLoading ? (
        <Spinner />
      ) : isError ? (
        <EmptyState
          icon={ServerCrash}
          title="Couldn't load agents"
          description="The server may be waking up from sleep. Give it a moment and try again."
          action={
            <button onClick={() => refetch()} className="btn-primary mt-6">
              Retry
            </button>
          }
        />
      ) : agents.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent, i) => (
            <div key={agent.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <AgentCard agent={agent} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PackageOpen}
          title="No agents yet"
          description="Be the first to launch an AI agent on Synapse. Head to Create Agent to get started."
        />
      )}
    </main>
  );
}
