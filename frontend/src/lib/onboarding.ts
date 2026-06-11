/**
 * Tracks which wallet addresses have completed onboarding, so returning users
 * skip the wizard and land straight in the app.
 */
const KEY = 'synapse_onboarded';

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
