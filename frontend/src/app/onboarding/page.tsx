'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { apiClient } from '@/services/api';
import {
  TrendingUp,
  Rocket,
  Building2,
  FlaskConical,
  Hexagon,
  ArrowRight,
  ArrowLeft,
  PartyPopper,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

const INTERESTS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'trading', label: 'Trading', icon: TrendingUp },
  { id: 'creation', label: 'Creating Agents', icon: Rocket },
  { id: 'governance', label: 'Governance', icon: Building2 },
  { id: 'research', label: 'Research', icon: FlaskConical },
];

const CHAINS: { id: string; label: string; color: string }[] = [
  { id: 'ethereum', label: 'Ethereum', color: 'text-indigo-400' },
  { id: 'polygon', label: 'Polygon', color: 'text-purple-400' },
  { id: 'arbitrum', label: 'Arbitrum', color: 'text-blue-400' },
  { id: 'base', label: 'Base', color: 'text-sky-400' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, ready } = usePrivy();
  const privyLoading = !ready;
  const [step, setStep] = useState<'welcome' | 'interests' | 'chains' | 'done'>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [chains, setChains] = useState<string[]>(['ethereum']);

  useEffect(() => {
    if (!privyLoading && !user?.wallet) {
      router.push('/');
    }
  }, [user, privyLoading, router]);

  if (privyLoading || !user?.wallet) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </main>
    );
  }

  const walletAddress = user.wallet.address;

  const handleInterestToggle = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleChainToggle = (id: string) => {
    setChains((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await apiClient.saveUserPreferences(walletAddress, interests, chains);

      setStep('done');
      setTimeout(() => router.push('/marketplace'), 2000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      alert('Failed to save preferences. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">
              Step {step === 'welcome' ? 1 : step === 'interests' ? 2 : step === 'chains' ? 3 : 4} of 4
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{
                width:
                  step === 'welcome'
                    ? '25%'
                    : step === 'interests'
                      ? '50%'
                      : step === 'chains'
                        ? '75%'
                        : '100%',
              }}
            ></div>
          </div>
        </div>

        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <PartyPopper className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Welcome!</h1>
              <p className="text-slate-300 text-lg mb-8">
                Your embedded wallet is ready to use
              </p>

              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 mb-8">
                <p className="text-slate-400 text-sm mb-2">Your Wallet Address</p>
                <p className="text-cyan-200 font-mono text-lg font-semibold break-all">
                  {walletAddress}
                </p>
              </div>

              <p className="text-slate-300 mb-8">
                Let's personalize your experience. This will take just 2 minutes.
              </p>

              <button
                onClick={() => setStep('interests')}
                className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Interests Step */}
        {step === 'interests' && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-2">What interests you?</h1>
            <p className="text-slate-400 mb-8">Select all that apply</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {INTERESTS.map((interest) => {
                const Icon = interest.icon;
                const active = interests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => handleInterestToggle(interest.id)}
                    className={`p-6 rounded-lg font-medium transition border-2 flex flex-col items-center gap-3 ${
                      active
                        ? 'bg-cyan-600 border-cyan-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Icon className={`w-7 h-7 ${active ? 'text-white' : 'text-cyan-400'}`} />
                    <div className="text-sm">{interest.label}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('welcome')}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep('chains')}
                className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Chains Step */}
        {step === 'chains' && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Preferred blockchains?</h1>
            <p className="text-slate-400 mb-8">Where do you want to trade and create agents?</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {CHAINS.map((chain) => {
                const active = chains.includes(chain.id);
                return (
                  <button
                    key={chain.id}
                    onClick={() => handleChainToggle(chain.id)}
                    className={`p-6 rounded-lg font-medium transition border-2 flex flex-col items-center gap-3 ${
                      active
                        ? 'bg-cyan-600 border-cyan-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Hexagon className={`w-7 h-7 ${active ? 'text-white' : chain.color}`} />
                    <div className="text-sm">{chain.label}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('interests')}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 text-white font-medium rounded-lg transition"
              >
                {isLoading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}

        {/* Done Step */}
        {step === 'done' && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <Sparkles className="w-12 h-12 text-cyan-400 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">All Set!</h1>
            <p className="text-slate-300 mb-6">
              You're ready to explore the marketplace. Redirecting...
            </p>
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
