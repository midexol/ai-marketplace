'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/services/api';
import { shortenAddress, formatNumber } from '@/utils/formatters';
import { PageHeader, Spinner } from '@/components/PageHeader';
import { Vote, Lock, FileText } from 'lucide-react';

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
          userAddress
            ? apiClient.getVotingPower(userAddress)
            : Promise.resolve({ power: '0', veVIRTUAL: '0' }),
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

  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    voting: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader
        eyebrow="Governance"
        title="Shape the Protocol"
        subtitle="Stake, vote, and participate in protocol decisions."
      />

      {/* Voting Power */}
      {userAddress && (
        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="card p-6">
            <div className="mb-3 flex items-center gap-2 text-slate-400">
              <Vote className="h-4 w-4" />
              <span className="text-sm">Voting Power</span>
            </div>
            <h2 className="text-3xl font-bold text-white">{formatNumber(votingPower.power)}</h2>
          </div>
          <div className="card p-6">
            <div className="mb-3 flex items-center gap-2 text-slate-400">
              <Lock className="h-4 w-4" />
              <span className="text-sm">veVIRTUAL Staked</span>
            </div>
            <h2 className="text-3xl font-bold text-white">{formatNumber(votingPower.veVIRTUAL)}</h2>
          </div>
        </div>
      )}

      <h2 className="mb-5 text-xl font-semibold text-white">Active Proposals</h2>

      {isLoading ? (
        <Spinner />
      ) : proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map((proposal: any) => (
            <div key={proposal.id} className="card card-hover p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{proposal.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{proposal.description}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ring-1 ${
                    statusStyles[proposal.status] || 'bg-[#30200c] text-slate-300 ring-[#493113]'
                  }`}
                >
                  {proposal.status}
                </span>
              </div>

              <div className="space-y-3">
                <VoteBar label="For" value={formatNumber(proposal.forVotes)} pct={60} color="bg-emerald-500" textColor="text-emerald-400" />
                <VoteBar label="Against" value={formatNumber(proposal.againstVotes)} pct={30} color="bg-red-500" textColor="text-red-400" />
                <VoteBar label="Abstain" value={formatNumber(proposal.abstainVotes)} pct={10} color="bg-slate-500" textColor="text-slate-400" />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#493113] pt-4 text-sm text-slate-400">
                <span>Proposed by {shortenAddress(proposal.proposer)}</span>
                {userAddress && (
                  <button className="btn-primary px-4 py-2 text-sm">
                    <Vote className="h-4 w-4" /> Vote
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#493113] bg-[#23170a]">
            <FileText className="h-8 w-8 text-slate-500" />
          </div>
          <p className="max-w-sm text-slate-400">No active proposals right now.</p>
        </div>
      )}
    </main>
  );
}

function VoteBar({
  label,
  value,
  pct,
  color,
  textColor,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
  textColor: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className={textColor}>
          {label}: {value}
        </span>
        <span className="text-slate-500">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#30200c]">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
