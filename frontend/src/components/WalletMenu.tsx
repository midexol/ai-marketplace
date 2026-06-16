'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/WalletProvider';
import { shortenAddress } from '@/utils/formatters';
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Droplets,
  ShieldCheck,
  ChevronDown,
  UserRound,
} from 'lucide-react';

const EXPLORER = 'https://sepolia.basescan.org/address/';
const FAUCET = 'https://www.alchemy.com/faucets/base-sepolia';

function AddressRow({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked — ignore */
    }
  };
  return (
    <div className="rounded-lg border border-[#493113] bg-[#130f08] px-3 py-2.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
        <div className="flex items-center gap-1.5">
          <button onClick={copy} className="text-slate-400 transition hover:text-white" title="Copy">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <a
            href={`${EXPLORER}${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 transition hover:text-white"
            title="View on Basescan"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <p className="font-mono text-sm text-slate-200">{shortenAddress(address, 8)}</p>
    </div>
  );
}

export function WalletMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const sa = user.smartAccountAddress;
  const display = sa || user.address;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="chip font-mono transition hover:border-[#76501d]"
        title="Manage wallet"
      >
        <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
        {sa && <span className="text-clay-400">SA</span>}
        {shortenAddress(display, 4)}
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-[#493113] bg-[#1b1308] p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#30200c]">
              <Wallet className="h-4 w-4 text-clay-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Wallet</p>
              {user.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
            </div>
          </div>

          <div className="space-y-2">
            {/* With EIP-7702 the smart account IS the EOA (upgraded in place),
                so there's a single address — no need to show it twice. */}
            <AddressRow
              label={sa ? 'Smart Account · EIP-7702' : 'Embedded wallet'}
              address={sa || user.address}
            />
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#493113] bg-[#130f08] px-3 py-2 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-clay-400" />
            Network: <span className="text-slate-200">Base Sepolia</span>
          </div>

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-[#76501d] bg-[#23170a] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-[#30200c]"
          >
            <UserRound className="h-4 w-4" /> View profile
          </Link>

          <a
            href={FAUCET}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-[#76501d] bg-[#23170a] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-[#30200c]"
          >
            <Droplets className="h-4 w-4" /> Get test ETH
          </a>

          <button
            onClick={() => {
              logout();
              setOpen(false);
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
