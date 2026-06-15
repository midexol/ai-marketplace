'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/services/api';
import { shortenAddress, formatCompact } from '@/utils/formatters';
import { PageHeader, Spinner } from '@/components/PageHeader';
import { Vote, Lock, FileText, Gauge, Check, X, Loader2, AlertCircle, Plus } from 'lucide-react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  proposer: string;
  forVotes: string | number;
  againstVotes: string | number;
  abstainVotes: string | number;
}

export default function GovernancePage() {
  const userAddress = useAppStore((state) => state.userAddress);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votingPower, setVotingPower] = useState({ power: '0', veVIRTUAL: '0' });
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [proposalsData, votingData] = await Promise.all([
        apiClient.getGovernanceProposals(),
        userAddress
          ? apiClient.getVotingPower(userAddress)
          : Promise.resolve({ power: '0', veVIRTUAL: '0' }),
      ]);
      setProposals(Array.isArray(proposalsData?.data) ? proposalsData.data : []);
      setVotingPower({
        power: votingData?.power ?? '0',
        veVIRTUAL: votingData?.veVIRTUAL ?? '0',
      });
    } catch (err) {
      console.error('Failed to fetch governance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeCount = proposals.filter((p) => p.status === 'active' || p.status === 'voting').length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader
        eyebrow="Governance"
        title="Shape the Protocol"
        subtitle="Stake, vote, and participate in protocol decisions."
      />

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={FileText} label="Proposals" value={formatCompact(proposals.length)} />
        <StatCard icon={Gauge} label="Active" value={formatCompact(activeCount)} />
        <StatCard icon={Vote} label="Voting Power" value={formatCompact(votingPower.power)} />
        <StatCard icon={Lock} label="veVIRTUAL" value={formatCompact(votingPower.veVIRTUAL)} />
      </div>

      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">Active Proposals</h2>
        {userAddress && (
          <CreateProposalButton proposer={userAddress} onCreated={fetchData} />
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              canVote={!!userAddress}
              onVoted={fetchData}
            />
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

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Vote;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate text-xs">{label}</span>
      </div>
      <p className="truncate text-2xl font-bold text-white" title={value}>
        {value}
      </p>
    </div>
  );
}

function ProposalCard({
  proposal,
  canVote,
  onVoted,
}: {
  proposal: Proposal;
  canVote: boolean;
  onVoted: () => void;
}) {
  const [voting, setVoting] = useState<'for' | 'against' | null>(null);
  const [voted, setVoted] = useState<'for' | 'against' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Real tallies — computed from the actual vote counts, not hardcoded.
  const forV = Number(proposal.forVotes) || 0;
  const againstV = Number(proposal.againstVotes) || 0;
  const abstainV = Number(proposal.abstainVotes) || 0;
  const total = forV + againstV + abstainV;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    voting: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  };

  const handleVote = async (type: 'for' | 'against') => {
    setError(null);
    setVoting(type);
    try {
      await apiClient.voteOnProposal(proposal.id, type);
      setVoted(type);
      onVoted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className="card card-hover p-6">
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
        <VoteBar label="For" value={formatCompact(forV)} pct={pct(forV)} color="bg-emerald-500" textColor="text-emerald-400" />
        <VoteBar label="Against" value={formatCompact(againstV)} pct={pct(againstV)} color="bg-red-500" textColor="text-red-400" />
        <VoteBar label="Abstain" value={formatCompact(abstainV)} pct={pct(abstainV)} color="bg-slate-500" textColor="text-slate-400" />
      </div>

      <p className="mt-3 text-xs text-slate-500">{formatCompact(total)} total votes</p>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-[#493113] pt-4 text-sm text-slate-400">
        <span>Proposed by {shortenAddress(proposal.proposer)}</span>
        {canVote &&
          (voted ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Check className="h-4 w-4" /> Voted {voted}
            </span>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleVote('for')}
                disabled={voting !== null}
                className="btn-primary px-4 py-2 text-sm"
              >
                {voting === 'for' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                For
              </button>
              <button
                onClick={() => handleVote('against')}
                disabled={voting !== null}
                className="flex items-center gap-1.5 rounded-md border border-[#76501d] bg-[#23170a] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-[#30200c] disabled:opacity-50"
              >
                {voting === 'against' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Against
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

function CreateProposalButton({
  proposer,
  onCreated,
}: {
  proposer: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setBusy(true);
    try {
      await apiClient.createProposal({ title, description, proposer });
      setTitle('');
      setDescription('');
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create proposal');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary px-4 py-2 text-sm">
        <Plus className="h-4 w-4" /> New Proposal
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-1 text-lg font-semibold text-white">Create Proposal</h3>
        <p className="mb-4 text-sm text-slate-400">
          Any token holder can submit a proposal for the community to vote on.
        </p>
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Proposal title"
            className="w-full rounded-lg border border-[#493113] bg-[#130f08] px-3 py-2 text-white placeholder-slate-500 focus:border-clay-600 focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this proposal does and why…"
            rows={4}
            className="w-full resize-none rounded-lg border border-[#493113] bg-[#130f08] px-3 py-2 text-white placeholder-slate-500 focus:border-clay-600 focus:outline-none"
          />
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">
              Cancel
            </button>
            <button onClick={submit} disabled={busy} className="btn-primary flex-1 text-sm">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
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
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
