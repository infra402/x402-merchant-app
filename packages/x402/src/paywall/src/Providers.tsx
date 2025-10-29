import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import type { ReactNode } from "react";
import { http, type Chain } from "viem";
import { base, baseSepolia, bsc, bscTestnet } from "viem/chains";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./window.d.ts";

type ProvidersProps = {
  children: ReactNode;
};

// Create QueryClient outside component to avoid recreating on each render
const queryClient = new QueryClient();

/**
 * Providers component for the paywall
 *
 * @param props - The component props
 * @param props.children - The children of the Providers component
 * @returns The Providers component
 */
export function Providers({ children }: ProvidersProps) {
  const { appName } = window.x402;

  // Create wagmi config with RainbowKit's getDefaultConfig
  // This automatically includes injected wallet detection (MetaMask, OKX, Phantom, etc.)
  const wagmiConfig = getDefaultConfig({
    appName: appName || "x402 Merchant App",
    projectId: "disabled", // No WalletConnect support as requested
    chains: [baseSepolia, base, bscTestnet, bsc] as readonly [Chain, ...Chain[]],
    transports: {
      [baseSepolia.id]: http(),
      [base.id]: http(),
      [bscTestnet.id]: http(),
      [bsc.id]: http(),
    },
    ssr: false, // Client-side only for paywall
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#F4C84A', // --primary color from design system
            accentColorForeground: '#0B0B10', // --bg color for contrast
            borderRadius: 'medium',
            fontStack: 'system',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
