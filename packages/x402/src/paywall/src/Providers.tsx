import { OnchainKitProvider } from "@coinbase/onchainkit";
import type { ReactNode } from "react";
import type { Chain } from "viem";
import { base, baseSepolia, bsc, bscTestnet } from "viem/chains";
import "./window.d.ts";

type ProvidersProps = {
  children: ReactNode;
};

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

  return (
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
  );
}
