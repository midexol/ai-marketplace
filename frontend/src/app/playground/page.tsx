'use client';

import { useState } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { PageHeader, Spinner } from '@/components/PageHeader';
import { RunAgentPanel } from '@/components/RunAgentPanel';
import type { AgentType } from '@/types';
import { PenLine, FlaskConical, Building2, Bot, type LucideIcon } from 'lucide-react';

// The backend only uses agentId for logging; a nil UUID lets the playground run
// any agent type without being tied to a specific marketplace agent.
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

const TYPES: { value: AgentType; label: string; icon: LucideIcon }[] = [
  { value: 'writing', label: 'Writing', icon: PenLine },
  { value: 'research', label: 'Research', icon: FlaskConical },
  { value: 'governance', label: 'Governance', icon: Building2 },
  { value: 'butler', label: 'Butler', icon: Bot },
];

export default function PlaygroundPage() {
  const { authenticated, isLoading } = useRequireAuth();
  const [type, setType] = useState<AgentType>('writing');

  if (isLoading) return <Spinner />;
  if (!authenticated) return null;

  const label = TYPES.find((t) => t.value === type)!.label;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader
        eyebrow="Playground"
        title="Run an AI Agent"
        subtitle="Prompt a Venice-powered agent and watch it reason in real time."
      />

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const active = type === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'border-clay-600 bg-[#30200c] text-white'
                  : 'border-[#493113] bg-[#23170a] text-slate-300 hover:border-[#76501d]'
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <RunAgentPanel key={type} agentId={NIL_UUID} agentName={`${label} Agent`} agentType={type} />
    </main>
  );
}
