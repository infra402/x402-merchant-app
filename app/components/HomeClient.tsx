'use client';

import Link from 'next/link';
import Logo from '../assets/infra402.svg';

export function HomeClient() {
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
