/**
 * Tracks which wallet addresses have completed onboarding, so returning users
 * skip the wizard and land straight in the app.
 *
 * The wallet address is deterministic per identity (same email/Google → same
 * Web3Auth key → same address), so the BACKEND user profile is the real source
 * of truth — it works across devices/browsers. localStorage is only a fast
 * cache so we don't flash the wizard while the network check resolves.
 */
import { apiClient } from '@/services/api';

const KEY = 'synapse_onboarded';

/** Synchronous cache check (fast path; may be stale on a fresh device). */
export function hasOnboarded(address?: string | null): boolean {
  if (typeof window === 'undefined' || !address) return false;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const set: string[] = JSON.parse(raw);
    return Array.isArray(set) && set.includes(address.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Authoritative check: localStorage first, then the backend profile. A user is
 * "onboarded" if they've previously saved preferences (metadata.interests).
 * Caches a positive result locally for next time.
 */
export async function checkOnboarded(address?: string | null): Promise<boolean> {
  if (!address) return false;
  if (hasOnboarded(address)) return true;

  const profile = await apiClient.getUserProfile(address);
  const onboarded = !!profile?.metadata?.interests;
  if (onboarded) setOnboarded(address);
  return onboarded;
}

export function setOnboarded(address?: string | null): void {
  if (typeof window === 'undefined' || !address) return;
  try {
    const raw = localStorage.getItem(KEY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    const a = address.toLowerCase();
    if (!set.includes(a)) {
      set.push(a);
      localStorage.setItem(KEY, JSON.stringify(set));
    }
  } catch {
    /* storage unavailable — ignore */
  }
}
