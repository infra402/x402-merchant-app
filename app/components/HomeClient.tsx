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

// Use RainbowKit's official CDN icons (same as what appears in CustomConnectButton)
const networkIcons: Record<string, string> = {
  'base': networkIconsFromChains['base'] || 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4',
  'base-sepolia': networkIconsFromChains['base-sepolia'] || 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4',
  'bsc': networkIconsFromChains['bsc'] || 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
  'bsc-testnet': networkIconsFromChains['bsc-testnet'] || 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
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
