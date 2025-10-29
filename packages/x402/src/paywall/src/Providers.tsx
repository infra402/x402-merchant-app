import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, darkTheme, connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
  trustWallet,
  binanceWallet,
  okxWallet,
  bybitWallet,
  rainbowWallet,
  rabbyWallet,
  phantomWallet,
  tokenPocketWallet,
  safepalWallet,
  zerionWallet,
  braveWallet,
  imTokenWallet,
} from '@rainbow-me/rainbowkit/wallets';
import type { ReactNode } from "react";
import { http, type Chain } from "viem";
import { base, baseSepolia, bsc, bscTestnet } from "viem/chains";
import { WagmiProvider, createConfig, createStorage } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./window.d.ts";

type ProvidersProps = {
  children: ReactNode;
};

// Create QueryClient outside component to avoid recreating on each render
const queryClient = new QueryClient();

// Configure custom wallet list with popular wallets for BNB Chain, Base, and Ethereum
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        injectedWallet, // Always first - auto-detects any installed browser extension
        metaMaskWallet, // #1 globally (143M users)
        coinbaseWallet, // Native Base support (70M users)
        trustWallet, // Dominant on BNB Chain (115M+ users)
        binanceWallet, // BNB Chain ecosystem
        okxWallet, // 10% Asia market share
        bybitWallet, // Strong Asia presence
      ],
    },
    {
      groupName: 'More Wallets',
      wallets: [
        rainbowWallet, // Ethereum/L2 focused
        rabbyWallet, // DeFi advanced features
        phantomWallet, // Multi-chain expansion
        tokenPocketWallet, // 30M users, Asia popular
        safepalWallet, // 20M users, BSC focused
        zerionWallet, // Portfolio tracking
        braveWallet, // Browser integrated
        imTokenWallet, // Asia established (35+ chains)
      ],
    },
  ],
  {
    appName: typeof window !== 'undefined' && window.x402?.appName ? window.x402.appName : "x402 Merchant App",
    projectId: "disabled", // No WalletConnect support
  }
);

// Create wagmi config with custom connectors and persistent storage OUTSIDE component
const wagmiConfig = createConfig({
  connectors,
  chains: [baseSepolia, base, bscTestnet, bsc],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
    [bscTestnet.id]: http(),
    [bsc.id]: http(),
  },
  ssr: false, // Client-side only for paywall
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    key: 'x402.wallet',
  }),
});

/**
 * Providers component for the paywall
 *
 * @param props - The component props
 * @param props.children - The children of the Providers component
 * @returns The Providers component
 */
export function Providers({ children }: ProvidersProps) {

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#F4C84A', // --primary color from design system
            accentColorForeground: '#0B0B10', // --bg color for contrast
            borderRadius: 'medium',
            fontStack: 'system',
          })}
          initialChain={baseSepolia}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
