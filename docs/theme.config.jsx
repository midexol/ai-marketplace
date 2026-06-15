import React from 'react'

export default {
  logo: <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span style={{ background: '#ffb640', color: '#211100', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '14px', fontWeight: 'bold' }}>S</span>
    Synapse Docs
  </span>,
  project: {
    link: 'https://github.com/16navigabraham/ai-marketplace',
  },
  chat: {
    link: 'https://discord.gg',
  },
  docsRepositoryBase: 'https://github.com/16navigabraham/ai-marketplace/tree/main/docs',
  footer: {
    text: 'Synapse Protocol © 2026. Built for MetaMask Smart Accounts Dev Cook-Off.',
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Synapse Docs'
    }
  }
}
