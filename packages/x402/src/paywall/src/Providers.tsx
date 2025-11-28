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
import { useMemo, type ReactNode } from "react";
import { http, type Chain } from "viem";
import { base, baseSepolia, bsc, bscTestnet } from "viem/chains";
import { WagmiProvider, createConfig, createStorage } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export type ProvidersProps = {
  children: ReactNode;
  /** Comma-separated network keys (e.g., "base-sepolia,bsc-testnet") */
  networksEnv?: string;
  /** App name for wallet connect modal */
  appName?: string;
};

// Create QueryClient outside component to avoid recreating on each render
const queryClient = new QueryClient();

// Chain map for network key to chain object
const chainMap: Record<string, Chain> = {
  'base': base,
  'base-sepolia': baseSepolia,
  'bsc': bsc,
  'bsc-testnet': bscTestnet,
};

// All supported chains for transport config
const allChains = [baseSepolia, base, bscTestnet, bsc] as const;

// Parse configured networks from props or window.x402
const getConfiguredChains = (networksEnv?: string): Chain[] => {
  // Try props first, then window.x402, then default
  const envValue = networksEnv ||
    (typeof window !== 'undefined' ? window.x402?.networksEnv : undefined) ||
    'base-sepolia';

  const networkKeys = envValue.split(',').map(n => n.trim());

  const configuredChains = networkKeys
    .map(key => chainMap[key])
    .filter((chain): chain is Chain => chain !== undefined);

  return configuredChains.length > 0 ? configuredChains : [...allChains];
};

// Get app name from props or window.x402
const getAppName = (appName?: string): string => {
  return appName ||
    (typeof window !== 'undefined' ? window.x402?.appName : undefined) ||
    "x402 Merchant App";
};

/**
 * Providers component for the paywall
 *
 * @param props - The component props
 * @param props.children - The children of the Providers component
 * @param props.networksEnv - Comma-separated network keys (optional, falls back to window.x402)
 * @param props.appName - App name for wallet connect modal (optional, falls back to window.x402)
 * @returns The Providers component
 */
export function Providers({ children, networksEnv, appName }: ProvidersProps) {
  // Memoize config to avoid recreating on each render
  const { wagmiConfig, configuredChains } = useMemo(() => {
    const resolvedAppName = getAppName(appName);
    const chains = getConfiguredChains(networksEnv);

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
        appName: resolvedAppName,
        projectId: "disabled", // No WalletConnect support
      }
    );

    // Create wagmi config with custom connectors and persistent storage
    const config = createConfig({
      connectors,
      chains: chains as any,
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

    return { wagmiConfig: config, configuredChains: chains };
  }, [networksEnv, appName]);

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
          initialChain={configuredChains[0]}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
