import Link from 'next/link';
import Logo from './assets/infra402.svg';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900 flex flex-col">
      <div className="flex-grow">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 py-20 lg:py-28">
          <div className="text-center">
            <div className="w-48 mb-8 mx-auto">
              <Logo className="mx-auto" />
            </div>
            <p className="text-3xl text-gray-600 mb-8 font-mono">
              x402 merchant app demo
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/protected"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-mono transition-colors text-white"
              >
                Live demo
              </Link>
            </div>
          </div>
        </section>
      </div>
      <footer className="py-8 text-center text-sm text-gray-500">
        Powered by {' '}
        <a
          href="https://infra402.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500"
        >
          Infra402
        </a>{' '}
        and settled on {' '}
        <a
          href="https://facilitator.infra402.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500"
        >
          Infra402 Multi-chain Facilitator
        </a>
        .
      </footer>
    </div>
  );
}
