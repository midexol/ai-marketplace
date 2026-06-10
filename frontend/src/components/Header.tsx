'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { LogIn, LogOut, Menu, Network } from 'lucide-react';
import { shortenAddress } from '@/utils/formatters';
import { apiClient } from '@/services/api';

export function Header() {
  const pathname = usePathname();
  const { user, login, logout, authenticated } = usePrivy();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Set auth token when user authenticates
  useEffect(() => {
    if (authenticated && user?.id && user?.wallet?.address) {
      const token = btoa(JSON.stringify({ sub: user.id, wallet: { address: user.wallet.address } }));
      apiClient.setAuthToken(token);
    } else {
      apiClient.clearAuthToken();
    }
  }, [authenticated, user?.id, user?.wallet?.address]);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Create Agent', href: '/create-agent' },
    { label: 'Governance', href: '/governance' },
  ];

  const walletAddress = user?.wallet?.address || '';

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-white hover:text-cyan-400 transition"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:inline">Synapse</span>
          </Link>

          {/* Desktop Navigation */}
          {authenticated && (
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition ${
                    isActive(item.href)
                      ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1'
                      : 'text-slate-300 hover:text-cyan-400 pb-1'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {authenticated && walletAddress ? (
              <div className="hidden sm:flex items-center gap-3">
                <div className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg">
                  <p className="text-sm font-medium text-cyan-200">
                    {shortenAddress(walletAddress, 4)}
                  </p>
                </div>
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm font-medium text-slate-200 transition flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => login()}
                className="hidden sm:flex px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-slate-700 space-y-2">
            {authenticated &&
              navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg transition ${
                    isActive(item.href)
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-cyan-400'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

            {/* Mobile Auth */}
            {authenticated && walletAddress ? (
              <div className="px-4 py-2 space-y-2">
                <div className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg">
                  <p className="text-sm font-medium text-cyan-200">
                    {shortenAddress(walletAddress, 4)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm font-medium text-slate-200 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="px-4 py-2">
                <button
                  onClick={() => {
                    login();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
