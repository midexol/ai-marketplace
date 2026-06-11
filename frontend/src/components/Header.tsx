'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/WalletProvider';
import { LogIn, LogOut, Menu, Network } from 'lucide-react';
import { shortenAddress } from '@/utils/formatters';
import { apiClient } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

export function Header() {
  const pathname = usePathname();
  const { user, login, logout, authenticated, getToken } = useAuth();
  const setUserAddress = useAppStore((state) => state.setUserAddress);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sync auth state -> API token + global store so every page sees the wallet.
  useEffect(() => {
    const token = getToken();
    if (authenticated && token && user?.address) {
      apiClient.setAuthToken(token);
      setUserAddress(user.address);
    } else {
      apiClient.clearAuthToken();
      setUserAddress(null);
    }
  }, [authenticated, getToken, user?.address, setUserAddress]);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Create Agent', href: '/create-agent' },
    { label: 'Governance', href: '/governance' },
  ];

  const walletAddress = user?.address || '';

  return (
    <header className="sticky top-0 z-50 border-b border-[#342d22] bg-[#16120b]">
      <div className="container mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-bold text-white transition hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Network className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <span className="hidden text-gradient sm:inline">Synapse</span>
          </Link>

          {/* Desktop Navigation */}
          {authenticated && (
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                    isActive(item.href)
                      ? 'bg-[#29231a] text-cyan-300'
                      : 'text-slate-400 hover:bg-[#201b13] hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {authenticated && walletAddress ? (
              <div className="hidden items-center gap-3 sm:flex">
                <div className="chip font-mono">
                  <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                  {shortenAddress(walletAddress, 4)}
                </div>
                <button onClick={() => logout()} className="btn-ghost px-4 py-2 text-sm">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            ) : (
              <button onClick={() => login()} className="btn-primary hidden px-5 py-2 text-sm sm:flex">
                <LogIn className="h-4 w-4" /> Sign In
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
