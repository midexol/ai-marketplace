'use client';

import { useEffect, useState } from 'react';
import { Wallet, Loader2 } from 'lucide-react';
import { shortenAddress } from '@/utils/formatters';
import { useAppStore } from '@/store/useAppStore';

interface WalletConnectProps {
  className?: string;
}

interface MetaMaskProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  isConnected?: boolean;
}

export function WalletConnect({ className = '' }: WalletConnectProps) {
  const [mounted, setMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSmartAccount, setIsSmartAccount] = useState(false);

  const userAddress = useAppStore((state) => state.userAddress);
  const setUserAddress = useAppStore((state) => state.setUserAddress);
  const setChainId = useAppStore((state) => state.setChainId);

  // Listen for account/chain changes
  useEffect(() => {
    if (!mounted) return;

    const provider = window.ethereum as MetaMaskProvider | undefined;
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
      } else {
        setUserAddress(null);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [mounted, setUserAddress, setChainId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const provider = window.ethereum as MetaMaskProvider | undefined;
      if (!provider) {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      setUserAddress(address);

      // Get current chain
      const chainIdHex = await provider.request({
        method: 'eth_chainId',
      });
      const chain = parseInt(chainIdHex, 16);
      setChainId(chain);

      // Check if using Smart Account
      try {
        const code = await provider.request({
          method: 'eth_getCode',
          params: [address, 'latest'],
        });
        // If code exists, it's a smart account contract
        setIsSmartAccount(code !== '0x');
      } catch (e) {
        // Fallback: assume EOA if can't check
        setIsSmartAccount(false);
      }

      console.log('Wallet connected:', { address, chain, isSmartAccount });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = () => {
    setUserAddress(null);
    setChainId(null);
    setError(null);
    setIsSmartAccount(false);
  };

  if (!mounted) {
    return null;
  }

  if (userAddress) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg">
          <div className="flex flex-col">
            <p className="text-sm font-medium text-cyan-200">
              {shortenAddress(userAddress)}
            </p>
            {isSmartAccount && (
              <p className="text-xs text-cyan-300 mt-0.5">Smart Account</p>
            )}
          </div>
        </div>
        <button
          onClick={handleDisconnectWallet}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm font-medium text-slate-200 transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleConnectWallet}
        disabled={isConnecting}
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition flex items-center justify-center gap-2"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-400 text-center p-2 bg-red-500/10 rounded-lg border border-red-500/30">
          {error}
        </p>
      )}
    </div>
  );
}

// Type augmentation for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
