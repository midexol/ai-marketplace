'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/**
 * Back navigation. Uses browser history when possible, falling back to a
 * provided href (or the marketplace) so the user is never stranded.
 */
export function BackButton({
  fallback = '/marketplace',
  label = 'Back',
}: {
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      onClick={goBack}
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
