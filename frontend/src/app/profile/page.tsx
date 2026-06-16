'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/WalletProvider';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/services/api';
import { AgentAvatar } from '@/components/AgentAvatar';
import { PageHeader, Spinner } from '@/components/PageHeader';
import { shortenAddress, formatNumber } from '@/utils/formatters';
import type { Agent, Portfolio } from '@/types';
import {
  Copy,
  Check,
  ExternalLink,
  Pencil,
  Loader2,
  Wallet as WalletIcon,
  Bot,
  Layers,
  Activity,
} from 'lucide-react';

const EXPLORER = 'https://sepolia.basescan.org/address/';

export default function ProfilePage() {
  const { user, authenticated, ready } = useAuth();
  const userAddress = useAppStore((s) => s.userAddress);
  const address = user?.smartAccountAddress || user?.address || userAddress || '';

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [holdings, setHoldings] = useState<Portfolio[]>([]);
  const trades: any[] = []; // activity feed: stub until a per-user trades endpoint exists

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [profile, allAgents, port] = await Promise.all([
        apiClient.getUserProfile(address),
        apiClient.getAgents(1, 100).catch(() => ({ data: [] as Agent[] })),
        apiClient.getPortfolio(address).catch(() => [] as Portfolio[]),
      ]);
      setUsername(profile?.username || '');
      setBio(profile?.bio || '');
      // Agents this user created.
      setAgents(
        (allAgents.data || []).filter(
          (a) => a.creatorAddress?.toLowerCase() === address.toLowerCase()
        )
      );
      setHoldings(Array.isArray(port) ? port : []);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (ready && authenticated) load();
  }, [ready, authenticated, load]);

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.updateUserProfile(address, { username, bio });
      setEditing(false);
    } catch {
      /* keep editing on failure */
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };

  if (!ready) return <Spinner />;
  if (!authenticated || !address) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="card flex flex-col items-center justify-center px-6 py-20 text-center">
          <WalletIcon className="mb-3 h-8 w-8 text-slate-500" />
          <p className="text-slate-400">Sign in to view your profile.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader eyebrow="Account" title="Your Profile" />

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          {/* Identity card */}
          <div className="card p-6">
            <div className="flex items-start gap-5">
              <AgentAvatar seed={address} name={username || 'You'} className="h-20 w-20" rounded="rounded-2xl" />
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      maxLength={40}
                      className="w-full rounded-lg border border-[#493113] bg-[#130f08] px-3 py-2 text-white placeholder-slate-500 focus:border-clay-600 focus:outline-none"
                    />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Short bio"
                      rows={2}
                      maxLength={160}
                      className="w-full resize-none rounded-lg border border-[#493113] bg-[#130f08] px-3 py-2 text-white placeholder-slate-500 focus:border-clay-600 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={save} disabled={saving} className="btn-primary px-4 py-2 text-sm">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Save
                      </button>
                      <button onClick={() => setEditing(false)} className="btn-ghost px-4 py-2 text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <h2 className="truncate font-display text-2xl font-semibold text-white">
                        {username || 'Unnamed'}
                      </h2>
                      <button
                        onClick={() => setEditing(true)}
                        className="text-slate-400 transition hover:text-white"
                        title="Edit profile"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{bio || 'No bio yet.'}</p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#493113] bg-[#130f08] px-3 py-1.5">
                      <span className="font-mono text-sm text-slate-300">{shortenAddress(address, 6)}</span>
                      <button onClick={copy} className="text-slate-400 hover:text-white" title="Copy">
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <a
                        href={`${EXPLORER}${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white"
                        title="View on Basescan"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard icon={Bot} label="Agents Created" value={formatNumber(agents.length)} />
            <StatCard icon={Layers} label="Holdings" value={formatNumber(holdings.length)} />
            <StatCard icon={Activity} label="Trades" value={formatNumber(trades.length)} />
          </div>

          {/* My agents */}
          <section>
            <h3 className="mb-3 text-lg font-semibold text-white">Agents You Created</h3>
            {agents.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {agents.map((a) => (
                  <Link
                    key={a.id}
                    href={`/agent/${a.id}`}
                    className="card card-hover flex items-center gap-3 p-4"
                  >
                    <AgentAvatar seed={a.tokenAddresses?.base || a.id} name={a.name} className="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{a.name}</p>
                      <p className="truncate text-xs capitalize text-slate-500">{a.type}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="card px-6 py-10 text-center text-sm text-slate-400">
                You haven&apos;t created any agents yet.
              </p>
            )}
          </section>

          {/* Holdings */}
          <section>
            <h3 className="mb-3 text-lg font-semibold text-white">Holdings</h3>
            {holdings.length > 0 ? (
              <div className="card divide-y divide-[#493113]">
                {holdings.map((h) => (
                  <div key={h.id} className="flex items-center justify-between px-5 py-3">
                    <span className="font-mono text-sm text-slate-300">{shortenAddress(h.agentId, 6)}</span>
                    <span className="text-sm text-white">{formatNumber(h.balance)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="card px-6 py-10 text-center text-sm text-slate-400">No holdings yet.</p>
            )}
          </section>
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
  icon: typeof Bot;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
