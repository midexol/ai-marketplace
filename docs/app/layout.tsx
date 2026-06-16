import React from 'react'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import './globals.css'

export const metadata = {
  title: {
    template: '%s - Synapse Docs',
    default: 'Synapse Docs - Delegated AI Agent Reputation System'
  },
  description: 'Developer and Protocol documentation for Synapse, a delegated AI agent reputation and trust-co-ownership protocol.',
  metadataBase: new URL('http://localhost:3002')
}

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const navbar = (
    <Navbar
      logo={
        <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#ffb640', color: '#211100', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>S</span>
          Synapse Docs
        </span>
      }
      projectLink="https://github.com/16navigabraham/ai-marketplace"
      chatLink="https://discord.gg"
    />
  )
  const footer = (
    <Footer>
      Synapse Protocol © {new Date().getFullYear()}. Built for MetaMask Smart Accounts Dev Cook-Off.
    </Footer>
  )

  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
