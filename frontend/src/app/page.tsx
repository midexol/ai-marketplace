'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/WalletProvider';
import {
  Rocket,
  Globe,
  DollarSign,
  Building2,
  Loader2,
  Network,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Rocket,
    title: 'No Wallet Installation',
    desc: 'Sign up with email — an embedded wallet is created for you instantly.',
  },
  {
    icon: Globe,
    title: 'Multi-Chain',
    desc: 'Trade seamlessly across Ethereum, Polygon, Arbitrum, and Base.',
  },
  {
    icon: DollarSign,
    title: 'Fair Pricing',
    desc: 'Transparent bonding curves drive real-time price discovery.',
  },
  {
    icon: Building2,
    title: 'On-Chain Governance',
    desc: 'Stake, vote, and shape the future of every agent you hold.',
  },
];

const STATS = [
  { value: '4', label: 'Chains' },
  { value: '0', label: 'Extensions needed' },
  { value: '<30s', label: 'To onboard' },
];

export default function Home() {
  const router = useRouter();
  const { authenticated, ready, login } = useAuth();

  useEffect(() => {
    if (ready && authenticated) {
      router.push('/onboarding');
    }
  }, [authenticated, ready, router]);

  if (!ready) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={40} />
      </main>
    );
  }

  return (
    <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 md:pt-24">
      {/* Hero */}
      <section className="animate-fade-up text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff0a8] via-[#ffd166] to-[#ff9f1c] shadow-[0_22px_48px_-24px_rgba(255,190,76,0.95)]">
          <Network className="h-8 w-8 text-[#211100]" strokeWidth={2} />
        </div>

        <div className="mb-6 flex justify-center">
          <span className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            Multi-Chain AI Agents
          </span>
        </div>

        <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
          <span className="text-gradient">Synapse</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 md:text-xl">
          Create, trade, and govern autonomous AI agents across four blockchains —
          with <span className="text-white">no wallet extension required.</span>
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={() => login()} className="btn-primary text-base">
            Get Started — it's free
            <ArrowRight className="h-4 w-4" />
          </button>
          <a href="#features" className="btn-ghost text-base">
            Explore features
          </a>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Sign in with email. No credit card, no seed phrase.
        </p>

        {/* Stats */}
        <div className="mx-auto mt-14 grid max-w-lg grid-cols-3 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="card px-4 py-5">
              <div className="text-2xl font-bold text-gradient-accent md:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mt-28">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Everything you need to launch
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            A complete platform for the agent economy — onboarding to governance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="card card-hover animate-fade-up p-6"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                  <Icon className="h-6 w-6 text-cyan-300" />
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-28">
        <div className="card relative overflow-hidden p-10 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ffb640]/15 via-transparent to-[#ffd166]/10" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Ready to join the agent economy?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-slate-400">
              Onboard in under 30 seconds and start trading your first AI agent.
            </p>
            <button onClick={() => login()} className="btn-primary mt-8 text-base">
              Launch Synapse
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
