'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/services/api';
import { AgentType } from '@/types';

const AGENT_TYPES: { label: string; value: AgentType }[] = [
  { label: 'Writing', value: 'writing' },
  { label: 'Research', value: 'research' },
  { label: 'Governance', value: 'governance' },
  { label: 'Butler', value: 'butler' },
];

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      if (!userAddress) {
        throw new Error('Please connect your wallet first');
      }

      if (!formData.name.trim()) {
        throw new Error('Agent name is required');
      }

      if (!formData.description.trim()) {
        throw new Error('Agent description is required');
      }

      if (formData.chains.length === 0) {
        throw new Error('Select at least one blockchain');
      }

      const response = await apiClient.createAgent({
        ...formData,
        creatorAddress: userAddress,
      });

      alert(`Agent created! ID: ${response.id}`);
      setFormData({ name: '', description: '', type: 'writing', chains: ['ethereum'] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create agent';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userAddress) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <p className="text-slate-300 mb-4">Please connect your wallet to create an agent</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Create AI Agent</h1>
        <p className="text-slate-400 mb-8">Launch your own AI agent on the marketplace</p>

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 border border-slate-700 rounded-lg p-8">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Agent Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., ResearchBot3000"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              maxLength={255}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what your agent does..."
              rows={4}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Agent Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              {AGENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Chains */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Deploy to Chains</label>
            <div className="grid grid-cols-2 gap-3">
              {['ethereum', 'polygon', 'arbitrum', 'base'].map((chain) => (
                <button
                  key={chain}
                  type="button"
                  onClick={() => handleChainToggle(chain)}
                  className={`px-4 py-3 rounded-lg font-medium transition ${
                    formData.chains.includes(chain)
                      ? 'bg-cyan-600 text-white border border-cyan-500'
                      : 'bg-slate-700 text-slate-300 border border-slate-600 hover:border-slate-500'
                  }`}
                >
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
          >
            {isLoading ? 'Creating...' : 'Create Agent'}
          </button>
        </form>
      </div>
    </main>
  );
}
