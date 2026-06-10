'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * MetaMask Embedded Wallets (Web3Auth) integration.
 *
 * Exposes a provider-agnostic auth surface via `useAuth()` so the rest of the
 * app never imports the SDK directly. Swapping wallet providers later only
 * touches this file.
 *
 * Requires NEXT_PUBLIC_WEB3AUTH_CLIENT_ID (https://dashboard.web3auth.io).
 * Without it, the app still renders — auth simply stays unavailable.
 */

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  address: string;
}

interface AuthContextValue {
  ready: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  /** Base64 token sent to the backend as a Bearer credential. */
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const CLIENT_ID = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '';
const CHAIN_ID_HEX = '0x1'; // Ethereum mainnet for display/signing namespace

function encodeToken(user: AuthUser): string {
  // Mirrors the backend authMiddleware expectation: base64(JSON) with sub + wallet.
  return btoa(JSON.stringify({ sub: user.id, wallet: { address: user.address } }));
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [web3auth, setWeb3auth] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Initialize the SDK on mount (client-side only).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!CLIENT_ID) {
        // No client ID configured — render the app, leave auth disabled.
        setReady(true);
        return;
      }

      try {
        const [{ Web3Auth }, { EthereumPrivateKeyProvider }, baseMod] =
          await Promise.all([
            import('@web3auth/modal'),
            import('@web3auth/ethereum-provider'),
            import('@web3auth/base'),
          ]);

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: {
            chainConfig: {
              chainNamespace: baseMod.CHAIN_NAMESPACES.EIP155,
              chainId: CHAIN_ID_HEX,
              rpcTarget: 'https://rpc.ankr.com/eth',
              displayName: 'Ethereum',
              ticker: 'ETH',
              tickerName: 'Ethereum',
            },
          },
        });

        const instance = new Web3Auth({
          clientId: CLIENT_ID,
          web3AuthNetwork: 'sapphire_mainnet',
          privateKeyProvider,
          uiConfig: {
            appName: 'Synapse',
            mode: 'dark',
            theme: { primary: '#06b6d4' },
            logoLight: '',
            logoDark: '',
          },
        });

        await instance.initModal();
        if (cancelled) return;

        setWeb3auth(instance);

        if (instance.connected) {
          await hydrateUser(instance);
        }
      } catch (err) {
        // Surface to console but never block rendering.
        console.error('Wallet init failed:', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hydrateUser = useCallback(async (instance: any) => {
    try {
      const provider = instance.provider;
      const accounts: string[] = await provider.request({ method: 'eth_accounts' });
      const info = await instance.getUserInfo().catch(() => ({}));
      const address = accounts?.[0] ?? '';
      if (!address) return;

      setUser({
        id: info?.verifierId || info?.email || address,
        email: info?.email,
        name: info?.name,
        address,
      });
    } catch (err) {
      console.error('Failed to read wallet user:', err);
    }
  }, []);

  const login = useCallback(async () => {
    if (!web3auth) {
      console.warn('Wallet not configured — set NEXT_PUBLIC_WEB3AUTH_CLIENT_ID.');
      return;
    }
    await web3auth.connect();
    await hydrateUser(web3auth);
  }, [web3auth, hydrateUser]);

  const logout = useCallback(async () => {
    if (web3auth?.connected) {
      await web3auth.logout();
    }
    setUser(null);
  }, [web3auth]);

  const getToken = useCallback(() => (user ? encodeToken(user) : null), [user]);

  const value: AuthContextValue = {
    ready,
    authenticated: !!user,
    user,
    login,
    logout,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <WalletProvider>');
  }
  return ctx;
}
