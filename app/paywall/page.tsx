'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PaywallApp, Providers, decodePaywallData, type PaywallRedirectData } from 'x402/paywall/components';
import 'x402/paywall/styles.css';

function PaywallContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<PaywallRedirectData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const encodedData = searchParams.get('data');

    if (!encodedData) {
      router.push('/');
      return;
    }

    try {
      const decoded = decodePaywallData(encodedData);

      // Reject stale redirects (>5 minutes)
      if (Date.now() - decoded.timestamp > 5 * 60 * 1000) {
        router.push('/');
        return;
      }

      setData(decoded);
    } catch (e) {
      setError('Invalid payment data');
      router.push('/');
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0B0B10',
        color: '#EF4444'
      }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0B0B10',
        color: '#E8ECF1'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Providers networksEnv={data.networksEnv} appName={data.appName}>
      <PaywallApp data={data} />
    </Providers>
  );
}

export default function PaywallPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0B0B10',
        color: '#E8ECF1'
      }}>
        Loading...
      </div>
    }>
      <PaywallContent />
    </Suspense>
  );
}
