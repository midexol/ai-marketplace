import type { Metadata } from 'next';
import '@/styles/globals.css';
import { PrivyAuthProvider } from '@/providers/PrivyProvider';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'AI Agents Marketplace',
  description: 'Multi-chain AI Agents Marketplace - Trade, Create, and Govern AI Agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PrivyAuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Header />
            {children}
          </div>
        </PrivyAuthProvider>
      </body>
    </html>
  );
}
