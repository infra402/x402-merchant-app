import { OnchainKitProvider } from "@coinbase/onchainkit";
import type { ReactNode } from "react";
import { http, type Chain } from "viem";
import { base, baseSepolia, bsc, bscTestnet } from "viem/chains";
import { WagmiProvider, createConfig } from "wagmi";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
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
  const { testnet, cdpClientKey, appName, appLogo, paymentRequirements } = window.x402;

  // Get the network from payment requirements
  const allPaymentRequirements = paymentRequirements ? [paymentRequirements].flat()[0] : null;
  const network = allPaymentRequirements?.network || (testnet ? "base-sepolia" : "base");

  // Map network ID to viem chain
  const getChainFromNetwork = (networkId: string): Chain => {
    const chainMap: Record<string, Chain> = {
      "base-sepolia": baseSepolia,
      "base": base,
      "bsc-testnet": bscTestnet,
      "bsc": bsc,
    };
    return chainMap[networkId] || baseSepolia;
  };

  const chain = getChainFromNetwork(network);

  // Create wagmi config with all supported chains
  const wagmiConfig = createConfig({
    chains: [baseSepolia, base, bscTestnet, bsc],
    connectors: [
      // Generic EIP-6963 detection (MetaMask, Rabby, Trust, Frame, Rainbow, Brave)
      injected(),

      // Explicit OKX Wallet
      injected({
        target() {
          return {
            id: 'okxWallet',
            name: 'OKX Wallet',
            provider: typeof window !== 'undefined' ? window.okxwallet : undefined,
          };
        },
      }),

      // Explicit Bybit Wallet
      injected({
        target() {
          return {
            id: 'bybitWallet',
            name: 'Bybit Wallet',
            provider: typeof window !== 'undefined' ? window.bybitWallet : undefined,
          };
        },
      }),

      // Explicit Phantom Wallet (for EVM mode)
      injected({
        target() {
          return {
            id: 'phantom',
            name: 'Phantom',
            provider: typeof window !== 'undefined' ? window.phantom?.ethereum : undefined,
          };
        },
      }),

      // Explicit Coin98 Wallet
      injected({
        target() {
          return {
            id: 'coin98',
            name: 'Coin98 Wallet',
            provider: typeof window !== 'undefined' ? window.coin98 : undefined,
          };
        },
      }),

      // Explicit TokenPocket
      injected({
        target() {
          return {
            id: 'tokenpocket',
            name: 'TokenPocket',
            provider: typeof window !== 'undefined' ? window.tokenpocket : undefined,
          };
        },
      }),

      // Explicit Bitget Wallet (BitKeep)
      injected({
        target() {
          return {
            id: 'bitkeep',
            name: 'Bitget Wallet',
            provider: typeof window !== 'undefined' ? window.bitkeep : undefined,
          };
        },
      }),

      coinbaseWallet({ appName: appName || "x402 Merchant App" }),
      walletConnect({ projectId: "your-project-id" }),
    ],
    transports: {
      [baseSepolia.id]: http(),
      [base.id]: http(),
      [bscTestnet.id]: http(),
      [bsc.id]: http(),
    },
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={cdpClientKey || undefined}
          chain={chain}
      config={{
        appearance: {
          mode: "auto",
          theme: "base",
          name: appName || undefined,
          logo: appLogo || undefined,
        },
        wallet: {
          display: "modal",
          supportedWallets: {
            rabby: true,
            trust: true,
            frame: true,
          },
        },
      }}
    >
      {children}
    </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
