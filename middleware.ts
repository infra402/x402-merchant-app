import { Address } from "viem";
import { paymentMiddleware, Network, Resource } from "x402-next";
import {
  SupportedEVMNetworks,
  SupportedSVMNetworks,
} from "x402/types";

const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL as Resource;

// Customizable paywall content
const paywallTitle = process.env.PAYWALL_TITLE || "";
const paywallMessage = process.env.PAYWALL_MESSAGE || "";

// Parse multi-chain configuration (all comma-separated)
const networks = (process.env.NETWORKS || "base-sepolia").split(',').map(n => n.trim());
const walletAddresses = (process.env.RESOURCE_WALLET_ADDRESSES || "").split(',').map(a => a.trim());
const amounts = (process.env.PAYWALL_AMOUNTS || "0.01").split(',').map(a => a.trim());
const tokenAddresses = (process.env.PAYMENT_TOKEN_ADDRESSES || "").split(',').map(a => a.trim());
const tokenNames = (process.env.PAYMENT_TOKEN_NAMES || "").split(',').map(n => n.trim());
const tokenSymbols = (process.env.PAYMENT_TOKEN_SYMBOLS || "").split(',').map(s => s.trim());
const tokenVersions = (process.env.PAYMENT_TOKEN_VERSIONS || "").split(',').map(v => v.trim());
const tokenDecimals = (process.env.PAYMENT_TOKEN_DECIMALS || "").split(',').map(d => d.trim());

// Create configuration for each network
type NetworkRouteConfig = {
  price: string | {
    amount: string;
    asset: {
      address: Address;
      decimals: number;
      eip712: {
        name: string;
        version: string;
        symbol?: string;
      };
    };
  };
  network: Network;
  config: {
    description: string;
    title: string;
    message: string;
  };
};

const networkConfigs: NetworkRouteConfig[] = networks.map((networkEnv, index) => {
  // Auto-detect if network is natively supported
  const isNativelySupported = ([...SupportedEVMNetworks, ...SupportedSVMNetworks] as string[]).includes(networkEnv);

  // Cast network for TypeScript
  const network = (isNativelySupported ? networkEnv : (networkEnv as string)) as Network;

  // Get config values for this network index
  const amount = amounts[index] || amounts[0] || "0.01";
  const customTokenAddress = tokenAddresses[index] as Address | undefined;
  const customTokenName = tokenNames[index];
  const customTokenSymbol = tokenSymbols[index];
  const customTokenVersion = tokenVersions[index];
  const customTokenDecimalsStr = tokenDecimals[index];
  const customTokenDecimals = customTokenDecimalsStr ? parseInt(customTokenDecimalsStr, 10) : undefined;

  // Determine payment configuration
  const getPaymentPrice = () => {
    // For custom networks, custom token MUST be configured
    if (!isNativelySupported) {
      if (!customTokenAddress || !customTokenName || !customTokenVersion || !customTokenDecimals) {
        throw new Error(
          `Custom network "${networkEnv}" requires custom token configuration. ` +
          `Please set all token fields for this network in your .env file.`
        );
      }
    }

    // Use custom token if fully configured
    if (customTokenAddress && customTokenName && customTokenVersion && customTokenDecimals) {
      const amountFloat = parseFloat(amount);
      const amountBigInt = ((BigInt(Math.floor(amountFloat * 100)) * BigInt(10) ** BigInt(customTokenDecimals)) / BigInt(100)).toString();

      return {
        amount: amountBigInt,
        asset: {
          address: customTokenAddress,
          decimals: customTokenDecimals,
          eip712: {
            name: customTokenName,
            version: customTokenVersion,
            symbol: customTokenSymbol,
          },
        },
      };
    }

    // Use default USDC for natively supported networks
    return `$${amount}`;
  };

  return {
    price: getPaymentPrice(),
    network,
    config: {
      description: "Access to protected content",
      title: paywallTitle,
      message: paywallMessage,
    },
  };
});

// Use first network configuration (for now, multi-network requires user to configure one primary network)
// TODO: Future enhancement - support dynamic network switching based on connected wallet
const primaryNetworkConfig = networkConfigs[0];

const routes: Record<string, NetworkRouteConfig> = {
  "/protected": primaryNetworkConfig,
};

// Use first wallet address or empty string
const payTo = (walletAddresses[0] || "") as Address;

export const middleware = paymentMiddleware(
  payTo,
  routes,
  {
    url: facilitatorUrl,
  },
  {
    appName: "x402 Merchant App",
    appLogo: "/web-app-manifest-512x512.png",
    networksEnv: process.env.NETWORKS || "base-sepolia",
    amountsEnv: process.env.PAYWALL_AMOUNTS || "0.01",
  },
);

// Configure which paths the middleware should run on
export const config = {
  matcher: ["/protected/:path*"],
};
