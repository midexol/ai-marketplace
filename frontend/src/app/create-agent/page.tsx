'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/services/api';
import { AgentType } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { Wallet, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

const AGENT_TYPES: { label: string; value: AgentType }[] = [
  { label: 'Writing', value: 'writing' },
  { label: 'Research', value: 'research' },
  { label: 'Governance', value: 'governance' },
  { label: 'Butler', value: 'butler' },
];

const CHAINS = ['ethereum', 'polygon', 'arbitrum', 'base'];

export default function CreateAgentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userAddress = useAppStore((state) => state.userAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'writing' as AgentType,
    chains: ['ethereum'],
    allowedActions: 'run-inference, transfer',
    spendingLimit: '100',
    targetProtocols: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
    isLocked: true,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
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
      if (!formData.allowedActions.trim()) throw new Error('Allowed actions scope is required');

      // Create agent NFT and metadata via API
      await apiClient.createAgent({
        ...formData,
        creatorAddress: userAddress,
        metadata: {
          allowedActions: formData.allowedActions,
          spendingLimit: formData.spendingLimit,
          targetProtocols: formData.targetProtocols,
          isLocked: formData.isLocked,
        } as any,
      });

      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      setFormData({
        name: '',
        description: '',
        type: 'writing',
        chains: ['ethereum'],
        allowedActions: 'run-inference, transfer',
        spendingLimit: '100',
        targetProtocols: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
        isLocked: true,
      });
      router.push('/marketplace');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : err && typeof err === 'object' && 'message' in err
            ? String((err as any).message)
            : 'Failed to create agent';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userAddress) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="card flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#493113] bg-[#23170a]">
            <Wallet className="h-8 w-8 text-slate-500" />
          </div>
          <p className="max-w-sm text-slate-400">Connect your wallet to create an agent.</p>
        </div>
      </main>
    );
  }

  const inputClass =
    'w-full rounded-xl border border-[#493113] bg-[#23170a] px-4 py-2.5 text-white placeholder-slate-500 transition focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20';

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <PageHeader
        eyebrow="Create"
        title="Launch an AI Agent"
        subtitle="Deploy your agent and configure its reputation card and delegation bounds."
      />

      <form onSubmit={handleSubmit} className="card space-y-6 p-8">
        <div>
          <h3 className="text-md font-semibold text-white mb-2">1. Identity Details</h3>
          <div className="space-y-4">
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
                rows={3}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Agent Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={inputClass}
              >
                {AGENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-slate-800">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr className="border-[#38260f]" />

        <div>
          <h3 className="text-md font-semibold text-white mb-2">2. Character Card & Permission Scopes</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Allowed Actions Scope</label>
              <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                What functions can the agent run? Use <code className="text-cyan-400 font-mono">run-inference</code> to allow the agent to process reasoning queries, and <code className="text-cyan-400 font-mono">transfer</code> to allow it to move funds.
              </p>
              <input
                type="text"
                name="allowedActions"
                value={formData.allowedActions}
                onChange={handleInputChange}
                placeholder="e.g., run-inference, transfer"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Spending Limit (USDC)</label>
              <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                The maximum amount of money (in USDC) the agent is allowed to spend. This acts as a strict safety guardrail so the agent cannot spend more than this cap.
              </p>
              <input
                type="number"
                name="spendingLimit"
                value={formData.spendingLimit}
                onChange={handleInputChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Allowed Target Protocols</label>
              <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                The blockchain addresses (smart contracts) the agent is allowed to interact with. For security, default is set to the Base Sepolia USDC contract, preventing it from sending funds to unauthorized addresses.
              </p>
              <input
                type="text"
                name="targetProtocols"
                value={formData.targetProtocols}
                onChange={handleInputChange}
                placeholder="Contract address (e.g. USDC token contract)"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <hr className="border-[#38260f]" />

        <div>
          <h3 className="text-md font-semibold text-white mb-2">3. Deploy & Reputation Snapshots</h3>
          <div className="space-y-4">
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
                          : 'border-[#493113] bg-[#23170a] text-slate-300 hover:border-[#76501d]'
                      }`}
                    >
                      {chain}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-[#1d140a] p-4 border border-[#ffb640]/10">
              <input
                type="checkbox"
                name="isLocked"
                checked={formData.isLocked}
                onChange={handleCheckboxChange}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <label className="text-sm font-medium text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Lock Configuration Snapshot
                </label>
                <p className="text-xs text-slate-400 mt-1">
                  Locks this agent's identity and Character Card permissions until the reputation threshold is met, preventing silent changes.
                </p>
              </div>
            </div>
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
              <Loader2 className="h-4 w-4 animate-spin" /> Deploying...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Deploy Agent
            </>
          )}
        </button>
      </form>
    </main>
  );
}
