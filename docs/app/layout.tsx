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
  metadataBase: new URL('http://localhost:3000')
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const navbar = <Navbar logo={
    <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ background: '#ffb640', color: '#211100', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '14px', fontWeight: 'bold' }}>S</span>
      Synapse Docs
    </span>
  } />
  const footer = <Footer>Synapse © {new Date().getFullYear()}</Footer>

  return (
    <html lang="en" suppressHydrationWarning>
      <Head />
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
