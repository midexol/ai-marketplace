import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { WalletProvider } from '@/providers/WalletProvider';
import { Header } from '@/components/Header';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Synapse — Multi-Chain AI Agents Marketplace',
  description: 'Synapse: Create, trade, and govern AI agents across Ethereum, Polygon, Arbitrum, and Base.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <WalletProvider>
          <div className="app-bg">
            <Header />
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
