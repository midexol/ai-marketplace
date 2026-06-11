import type { Metadata } from 'next';
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { WalletProvider } from '@/providers/WalletProvider';
import { Header } from '@/components/Header';

// Editorial serif display, warm grotesque body, monospace for numbers/data.
const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});
const sans = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

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
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
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
