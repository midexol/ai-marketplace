'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/services/api';
import { shortenAddress, formatNumber } from '@/utils/formatters';

export default function GovernancePage() {
  const userAddress = useAppStore((state) => state.userAddress);
  const [proposals, setProposals] = useState<any[]>([]);
  const [votingPower, setVotingPower] = useState({ power: '0', veVIRTUAL: '0' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [proposalsData, votingData] = await Promise.all([
          apiClient.getGovernanceProposals(),
          userAddress ? apiClient.getVotingPower(userAddress) : Promise.resolve({ power: '0', veVIRTUAL: '0' }),
        ]);
        setProposals(proposalsData.data || []);
        setVotingPower(votingData);
      } catch (err) {
        console.error('Failed to fetch governance data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userAddress]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Governance</h1>
        <p className="text-slate-400">Participate in protocol decisions and voting</p>
      </div>

      {/* Voting Power */}
      {userAddress && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2">Voting Power</p>
            <h2 className="text-3xl font-bold text-white">{formatNumber(votingPower.power)}</h2>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2">veVIRTUAL Staked</p>
            <h2 className="text-3xl font-bold text-white">{formatNumber(votingPower.veVIRTUAL)}</h2>
          </div>
        </div>
      )}

      {/* Proposals */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Active Proposals</h2>

        {isLoading ? (
          <p className="text-slate-400 text-center py-8">Loading proposals...</p>
        ) : proposals.length > 0 ? (
          <div className="space-y-4">
            {proposals.map((proposal: any) => (
              <div key={proposal.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{proposal.title}</h3>
                    <p className="text-slate-400 text-sm mt-1">{proposal.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    proposal.status === 'active' 
                      ? 'bg-green-500/20 text-green-400'
                      : proposal.status === 'voting'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {proposal.status}
                  </span>
                </div>

                {/* Voting Results */}
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-400">For: {formatNumber(proposal.forVotes)}</span>
                      <span className="text-slate-400">60%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-400">Against: {formatNumber(proposal.againstVotes)}</span>
                      <span className="text-slate-400">30%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Abstain: {formatNumber(proposal.abstainVotes)}</span>
                      <span className="text-slate-400">10%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-slate-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Proposer */}
                <div className="flex items-center justify-between text-sm text-slate-400 pt-4 border-t border-slate-700">
                  <span>Proposed by {shortenAddress(proposal.proposer)}</span>
                  {userAddress && (
                    <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-medium text-sm transition">
                      Vote
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-8">No active proposals</p>
        )}
      </div>
    </main>
  );
}
