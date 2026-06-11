import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e]">
          <Compass className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">404</p>
        <h1 className="mt-2 text-xl font-semibold text-white">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/marketplace" className="btn-primary">
            <Compass className="h-4 w-4" />
            Browse marketplace
          </Link>
          <Link href="/" className="btn-ghost">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
