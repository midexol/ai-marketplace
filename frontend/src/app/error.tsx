'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console for debugging; replace with telemetry if needed.
    console.error('Page error:', error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#342d22] bg-[#201b13]">
          <AlertTriangle className="h-7 w-7 text-slate-400" />
        </div>
        <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
          An unexpected error occurred while loading this page. You can retry, or head back home.
        </p>
        {error?.digest && (
          <p className="mt-3 font-mono text-xs text-slate-600">ref: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => reset()} className="btn-primary">
            <RotateCw className="h-4 w-4" />
            Try again
          </button>
          <Link href="/" className="btn-ghost">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
