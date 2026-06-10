'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Rocket, Globe, DollarSign, Building2, Lock, Loader, Network } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { authenticated, ready, login } = usePrivy();
  const isLoading = !ready;

  useEffect(() => {
    if (ready && authenticated) {
      router.push('/onboarding');
    }
  }, [authenticated, ready, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-cyan-500" size={48} />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <Network className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          Synapse
        </h1>
        <p className="text-lg text-cyan-400 font-medium mb-4">
          The Multi-Chain AI Agents Marketplace
        </p>

        <p className="text-xl text-slate-300 mb-8 max-w-xl mx-auto">
          Create, trade, and govern AI agents across multiple blockchains. No wallet
          installation required.
        </p>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 mb-8 text-left">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Why Choose Us?</h2>
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <Rocket className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">No Wallet Installation</p>
                <p className="text-sm text-slate-400">Sign up with email or social login</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <Globe className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Multi-Chain</p>
                <p className="text-sm text-slate-400">Trade on Ethereum, Polygon, Arbitrum, Base</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <DollarSign className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Fair Pricing</p>
                <p className="text-sm text-slate-400">Bonding curves for price discovery</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <Building2 className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Governance</p>
                <p className="text-sm text-slate-400">Vote on protocol changes</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => login()}
          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-lg rounded-lg transition transform hover:scale-105 mb-4 flex items-center justify-center gap-2"
        >
          <Lock size={20} />
          Sign In to Get Started
        </button>

        <p className="text-slate-400 text-sm">
          Sign in with email. No credit card required.
        </p>
      </div>
    </main>
  );
}
