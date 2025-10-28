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
      injected(),
      coinbaseWallet({ appName: appName || "Payment App" }),
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
          mode: "light",
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
