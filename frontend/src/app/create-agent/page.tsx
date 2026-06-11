'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/services/api';
import { AgentType } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { Wallet, AlertCircle, Loader2, Sparkles } from 'lucide-react';

const AGENT_TYPES: { label: string; value: AgentType }[] = [
  { label: 'Writing', value: 'writing' },
  { label: 'Research', value: 'research' },
  { label: 'Governance', value: 'governance' },
  { label: 'Butler', value: 'butler' },
];

const CHAINS = ['ethereum', 'polygon', 'arbitrum', 'base'];

export default function CreateAgentPage() {
  const userAddress = useAppStore((state) => state.userAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'writing' as AgentType,
    chains: ['ethereum'],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChainToggle = (chain: string) => {
    setFormData((prev) => ({
      ...prev,
      chains: prev.chains.includes(chain)
        ? prev.chains.filter((c) => c !== chain)
        : [...prev.chains, chain],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!userAddress) throw new Error('Please connect your wallet first');
      if (!formData.name.trim()) throw new Error('Agent name is required');
      if (!formData.description.trim()) throw new Error('Agent description is required');
      if (formData.chains.length === 0) throw new Error('Select at least one blockchain');

      const response = await apiClient.createAgent({ ...formData, creatorAddress: userAddress });
      alert(`Agent created! ID: ${response.id}`);
      setFormData({ name: '', description: '', type: 'writing', chains: ['ethereum'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userAddress) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="card flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#342d22] bg-[#201b13]">
            <Wallet className="h-8 w-8 text-slate-500" />
          </div>
          <p className="max-w-sm text-slate-400">Connect your wallet to create an agent.</p>
        </div>
      </main>
    );
  }

  const inputClass =
    'w-full rounded-xl border border-[#342d22] bg-[#201b13] px-4 py-2.5 text-white placeholder-slate-500 transition focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20';

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <PageHeader
        eyebrow="Create"
        title="Launch an AI Agent"
        subtitle="Deploy your agent to the marketplace across one or more chains."
      />

      <form onSubmit={handleSubmit} className="card space-y-6 p-8">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Agent Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., ResearchBot 3000"
            className={inputClass}
            maxLength={255}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe what your agent does..."
            rows={4}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Agent Type</label>
          <select name="type" value={formData.type} onChange={handleInputChange} className={inputClass}>
            {AGENT_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-slate-800">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-slate-300">Deploy to Chains</label>
          <div className="grid grid-cols-2 gap-3">
            {CHAINS.map((chain) => {
              const active = formData.chains.includes(chain);
              return (
                <button
                  key={chain}
                  type="button"
                  onClick={() => handleChainToggle(chain)}
                  className={`rounded-xl border px-4 py-3 font-medium capitalize transition ${
                    active
                      ? 'border-cyan-500 bg-cyan-600 text-white'
                      : 'border-[#342d22] bg-[#201b13] text-slate-300 hover:border-[#473e2f]'
                  }`}
                >
                  {chain}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Create Agent
            </>
          )}
        </button>
      </form>
    </main>
  );
}
