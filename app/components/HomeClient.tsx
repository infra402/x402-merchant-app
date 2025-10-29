'use client';

import Link from 'next/link';
import Logo from '../assets/infra402.svg';
import { base, baseSepolia, bsc, bscTestnet } from 'viem/chains';

// Get chain icon URLs - these come from viem/chains but may be undefined
// RainbowKit populates these at runtime in the protected page
const networkIconsFromChains: Record<string, string | undefined> = {
  'base': base.iconUrl,
  'base-sepolia': baseSepolia.iconUrl,
  'bsc': bsc.iconUrl,
  'bsc-testnet': bscTestnet.iconUrl,
};

// Fallback to RainbowKit's CDN URLs if chain.iconUrl is undefined
const networkIcons: Record<string, string> = {
  'base': networkIconsFromChains['base'] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTExIiBoZWlnaHQ9IjExMSIgdmlld0JveD0iMCAwIDExMSAxMTEiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01NC41IDE5VjQyIiBzdHJva2U9IiMwMDUyRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik01NC41IDY5Vjk3IiBzdHJva2U9IiMwMDUyRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik03MiA1NC41SDk3IiBzdHJva2U9IiMwMDUyRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0xOSA1NC41SDQyIiBzdHJva2U9IiMwMDUyRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxjaXJjbGUgY3g9IjU0LjUiIGN5PSI1NC41IiByPSI1NC41IiBmaWxsPSIjMDA1MkZGIi8+Cjwvc3ZnPg==',
  'base-sepolia': networkIconsFromChains['base-sepolia'] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTExIiBoZWlnaHQ9IjExMSIgdmlld0JveD0iMCAwIDExMSAxMTEiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01NC41IDE5VjQyIiBzdHJva2U9IiMwMDUyRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik01NC41IDY5Vjk3IiBzdHJva2U9IiMwMDUyRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik03MiA1NC41SDk3IiBzdHJva2U9IiMwMDUyRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0xOSA1NC41SDQyIiBzdHJva2U9IiMwMDUyRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxjaXJjbGUgY3g9IjU0LjUiIGN5PSI1NC41IiByPSI1NC41IiBmaWxsPSIjMDA1MkZGIi8+Cjwvc3ZnPg==',
  'bsc': networkIconsFromChains['bsc'] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI2IiBoZWlnaHQ9IjEyNiIgdmlld0JveD0iMCAwIDEyNiAxMjYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYzIiBjeT0iNjMiIHI9IjYzIiBmaWxsPSIjRjBCOTBCIi8+CjxwYXRoIGQ9Ik00Ni43IDQ5LjJMNjMgMzIuOUw3OS4zIDQ5LjJMODkuNiAzOC45TDYzIDEyLjNMMzYuNCAzOC45TDQ2LjcgNDkuMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMS43IDYzTDMyIDUyLjdMNDIuMyA2M0wzMiA3My4zTDIxLjcgNjNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNDYuNyA3Ni44TDYzIDkzLjFMNzkuMyA3Ni44TDg5LjYgODcuMUw2MyAxMTMuN0wzNi40IDg3LjFMNDYuNyA3Ni44WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTgzLjcgNjNMOTQgNTIuN0wxMDQuMyA2M0w5NCA3My4zTDgzLjcgNjNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNzIuOCA2M0w2MyA1My4yTDUzLjIgNjNMNjMgNzIuOEw3Mi44IDYzWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
  'bsc-testnet': networkIconsFromChains['bsc-testnet'] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI2IiBoZWlnaHQ9IjEyNiIgdmlld0JveD0iMCAwIDEyNiAxMjYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYzIiBjeT0iNjMiIHI9IjYzIiBmaWxsPSIjRjBCOTBCIi8+CjxwYXRoIGQ9Ik00Ni43IDQ5LjJMNjMgMzIuOUw3OS4zIDQ5LjJMODkuNiAzOC45TDYzIDEyLjNMMzYuNCAzOC45TDQ2LjcgNDkuMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMS43IDYzTDMyIDUyLjdMNDIuMyA2M0wzMiA3My4zTDIxLjcgNjNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNDYuNyA3Ni44TDYzIDkzLjFMNzkuMyA3Ni44TDg5LjYgODcuMUw2MyAxMTMuN0wzNi40IDg3LjFMNDYuNyA3Ni44WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTgzLjcgNjNMOTQgNTIuN0wxMDQuMyA2M0w5NCA3My4zTDgzLjcgNjNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNzIuOCA2M0w2MyA1My4yTDUzLjIgNjNMNjMgNzIuOEw3Mi44IDYzWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
};

const networkNames: Record<string, string> = {
  'base': 'Base',
  'base-sepolia': 'Base Sepolia',
  'bsc': 'BNB Smart Chain',
  'bsc-testnet': 'BSC Testnet',
};

export function HomeClient() {
  const networksEnv = process.env.NEXT_PUBLIC_NETWORKS || 'base-sepolia';
  const networks = networksEnv.split(',').map(n => n.trim()).filter(n => n);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0B0B10', color: '#E8ECF1' }}>
      <div className="flex-grow">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 py-20 lg:py-28">
          <div className="flex flex-col items-center">
            <Logo className="w-64 mx-auto mb-8" />
            <p className="text-4xl font-semibold mb-8 text-center" style={{ fontFamily: 'Geist Mono, monospace', color: '#E8ECF1' }}>
              x402 merchant app demo
            </p>

            {/* Network Icons */}
            {networks.length > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <span style={{ fontSize: '0.875rem', color: '#9AA4B2', fontFamily: 'Geist Sans, sans-serif' }}>
                  Supported networks:
                </span>
                <div className="flex items-center gap-2">
                  {networks.map((network) => (
                    <div
                      key={network}
                      title={networkNames[network] || network}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#1A2130',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {networkIcons[network] ? (
                        <img
                          src={networkIcons[network]}
                          alt={networkNames[network] || network}
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#9AA4B2' }}>
                          {network.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/protected"
                className="px-6 py-3 rounded-lg transition-colors"
                style={{ backgroundColor: '#F4C84A', color: '#0B0B10', fontFamily: 'Geist Mono, monospace' }}
              >
                Try an x402 payment
              </Link>
            </div>
          </div>
        </section>
      </div>
      <footer className="py-8 text-center text-sm" style={{ color: '#9AA4B2', fontFamily: 'Geist Sans, sans-serif' }}>
        Powered by {' '}
        <a
          href="https://infra402.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: '#F4C84A' }}
        >
          Infra402
        </a>{' '}
        and settled on {' '}
        <a
          href="https://facilitator.infra402.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: '#F4C84A' }}
        >
          Infra402 Multi-chain Facilitator
        </a>
        .
      </footer>
    </div>
  );
}
