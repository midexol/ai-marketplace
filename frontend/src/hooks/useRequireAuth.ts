'use client';

import { useAuth } from '@/providers/WalletProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRequireAuth() {
  const { authenticated, ready } = useAuth();
  const isLoading = !ready;
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [authenticated, ready, router]);

  return { authenticated, isLoading };
}
