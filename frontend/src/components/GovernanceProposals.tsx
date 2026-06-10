'use client';

import { useState } from 'react';
import { formatDate, formatNumber } from '@/utils/formatters';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'failed' | 'pending';
  votesFor: string;
  votesAgainst: string;
  startDate: Date | string;
  endDate: Date | string;
  quorumPercentage?: number;
  proposer?: string;
}

interface GovernanceProposalsProps {
  proposals: Proposal[];
  isLoading?: boolean;
  error?: string | null;
  userVotingPower?: string;
  onVote?: (proposalId: string, voteType: 'for' | 'against') => Promise<void>;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/50' },
  passed: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/50' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/50' },
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/50' },
};

export function GovernanceProposals({
  proposals,
  isLoading = false,
  error = null,
  userVotingPower = '0',
  onVote,
}: GovernanceProposalsProps) {
  const [votingProposalId, setVotingProposalId] = useState<string | null>(null);
  const [votingType, setVotingType] = useState<'for' | 'against' | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (proposalId: string, type: 'for' | 'against') => {
    if (!onVote) return;

    try {
      setIsVoting(true);
      setVotingProposalId(proposalId);
      setVotingType(type);
      await onVote(proposalId, type);
    } catch (err) {
      console.error('Voting error:', err);
    } finally {
      setIsVoting(false);
      setVotingProposalId(null);
      setVotingType(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 rounded-lg p-6 animate-pulse"
          >
            <div className="space-y-3">
              <div className="h-5 bg-slate-700 rounded w-3/4" />
              <div className="h-4 bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-700 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Proposals</h3>
        <p className="text-slate-400">
          There are currently no governance proposals
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Voting Power */}
      {userVotingPower !== '0' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Your Voting Power</p>
          <p className="text-2xl font-bold text-cyan-400">
            {formatNumber(userVotingPower, 0)}
          </p>
        </div>
      )}

      {/* Proposals List */}
      {proposals.map((proposal) => {
        const totalVotes = parseFloat(proposal.votesFor) + parseFloat(proposal.votesAgainst);
        const forPercent = totalVotes > 0 ? (parseFloat(proposal.votesFor) / totalVotes) * 100 : 0;
        const againstPercent = totalVotes > 0 ? (parseFloat(proposal.votesAgainst) / totalVotes) * 100 : 0;
        const colors = STATUS_COLORS[proposal.status] || STATUS_COLORS.pending;

        return (
          <div
            key={proposal.id}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {proposal.title}
                </h3>
                <p className="text-slate-400 text-sm mb-3">
                  {proposal.description}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${colors.bg} ${colors.text}`}
              >
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </span>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-slate-700">
              <div>
                <p className="text-xs text-slate-400 mb-1">Start Date</p>
                <p className="text-sm font-medium text-white">
                  {formatDate(proposal.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">End Date</p>
                <p className="text-sm font-medium text-white">
                  {formatDate(proposal.endDate)}
                </p>
              </div>
              {proposal.quorumPercentage && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Quorum</p>
                  <p className="text-sm font-medium text-white">
                    {proposal.quorumPercentage}%
                  </p>
                </div>
              )}
              {proposal.proposer && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Proposer</p>
                  <p className="text-sm font-medium text-slate-300">
                    {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                  </p>
                </div>
              )}
            </div>

            {/* Voting Results */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-400">
                    For: {formatNumber(proposal.votesFor, 0)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {forPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${forPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-400">
                    Against: {formatNumber(proposal.votesAgainst, 0)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {againstPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${againstPercent}%` }}
                  />
                </div>
              </div>

              <div className="text-xs text-slate-500 text-right">
                Total votes: {formatNumber(totalVotes, 0)}
              </div>
            </div>

            {/* Voting Buttons */}
            {proposal.status === 'active' && onVote && (
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => handleVote(proposal.id, 'for')}
                  disabled={isVoting && votingProposalId === proposal.id}
                  className="flex-1 py-2 px-4 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 text-green-400 font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVoting && votingProposalId === proposal.id && votingType === 'for' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                      Voting...
                    </span>
                  ) : (
                    'Vote For'
                  )}
                </button>
                <button
                  onClick={() => handleVote(proposal.id, 'against')}
                  disabled={isVoting && votingProposalId === proposal.id}
                  className="flex-1 py-2 px-4 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-400 font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVoting && votingProposalId === proposal.id && votingType === 'against' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      Voting...
                    </span>
                  ) : (
                    'Vote Against'
                  )}
                </button>
              </div>
            )}

            {proposal.status !== 'active' && (
              <p className="text-xs text-slate-500 text-center pt-4 border-t border-slate-700">
                Voting is closed for this proposal
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
