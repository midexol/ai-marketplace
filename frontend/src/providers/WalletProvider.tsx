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
import type { PrivateKeyAccount } from 'viem';
import { createSmartAccount, type SmartAccount } from '@/lib/smartAccount';

/**
 * Wallet layer: Web3Auth embedded wallet (email login) → MetaMask Smart Account.
 *
 * Web3Auth produces an EOA private key; we wrap it in a MetaMask Stateless7702
 * smart account (Smart Accounts Kit) on Base Sepolia. ERC-7710 delegations and
 * the 1Shot relayer build on `smartAccount` + `signerAccount`.
 *
 * Exposes a provider-agnostic surface via `useAuth()` so pages never import the
 * SDK directly. Requires NEXT_PUBLIC_WEB3AUTH_CLIENT_ID; without it the app
 * still renders and auth stays inactive.
 */

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  /** EOA (signer/owner) address from the embedded wallet. */
  address: string;
  /** MetaMask Smart Account address (the on-chain actor). */
  smartAccountAddress?: string;
}

interface AuthContextValue {
  ready: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  /** MetaMask Smart Account — use for user ops, delegations, relayed txns. */
  smartAccount: SmartAccount | null;
  /** Underlying viem signer — needed to sign EIP-7702 authorizations. */
  signerAccount: PrivateKeyAccount | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  /** Base64 token sent to the backend as a Bearer credential. */
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const CLIENT_ID = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '';
// Free/new Web3Auth projects default to "sapphire_devnet". Set this to
// "sapphire_mainnet" only once your dashboard project is on a paid/mainnet plan.
const WEB3AUTH_NETWORK =
  (process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK as 'sapphire_devnet' | 'sapphire_mainnet') ||
  'sapphire_devnet';
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
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null);
  const [signerAccount, setSignerAccount] = useState<PrivateKeyAccount | null>(null);

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
              // Keyless public RPC (overridable via env).
              rpcTarget:
                process.env.NEXT_PUBLIC_ETH_RPC || 'https://ethereum-rpc.publicnode.com',
              displayName: 'Ethereum',
              ticker: 'ETH',
              tickerName: 'Ethereum',
            },
          },
        });

        const instance = new Web3Auth({
          clientId: CLIENT_ID,
          web3AuthNetwork: WEB3AUTH_NETWORK,
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

      const baseUser: AuthUser = {
        id: info?.verifierId || info?.email || address,
        email: info?.email,
        name: info?.name,
        address,
      };
      setUser(baseUser);

      // Wrap the embedded-wallet key in a MetaMask Smart Account.
      try {
        const privateKey: string = await provider.request({ method: 'eth_private_key' });
        const { smartAccount: sa, account } = await createSmartAccount(privateKey);
        setSmartAccount(sa);
        setSignerAccount(account);
        setUser({ ...baseUser, smartAccountAddress: sa.address });
      } catch (saErr) {
        // Non-fatal: keep the EOA session even if the smart account fails.
        console.error('Smart account init failed:', saErr);
      }
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
    setSmartAccount(null);
    setSignerAccount(null);
  }, [web3auth]);

  const getToken = useCallback(() => (user ? encodeToken(user) : null), [user]);

  const value: AuthContextValue = {
    ready,
    authenticated: !!user,
    user,
    smartAccount,
    signerAccount,
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
