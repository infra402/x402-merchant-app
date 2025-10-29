import { Address } from "viem";
import { paymentMiddleware, Network, Resource } from "x402-next";
import {
  SupportedEVMNetworks,
  SupportedSVMNetworks,
} from "x402/types";

const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL as Resource;
const payTo = process.env.RESOURCE_WALLET_ADDRESS as Address;

// Auto-detect if network is natively supported or requires custom facilitator
const networkEnv = process.env.NETWORK;
const isNativelySupported =
  networkEnv &&
  ([...SupportedEVMNetworks, ...SupportedSVMNetworks] as string[]).includes(
    networkEnv,
  );

// If network is not natively supported, cast to bypass TypeScript validation
// This allows custom facilitators to support additional networks
const network = (isNativelySupported
  ? networkEnv
  : (networkEnv as string)) as Network;

// Custom EIP3009 token configuration (optional)
const customTokenAddress = process.env.PAYMENT_TOKEN_ADDRESS as Address | undefined;
const customTokenName = process.env.PAYMENT_TOKEN_NAME;
const customTokenSymbol = process.env.PAYMENT_TOKEN_SYMBOL;
const customTokenVersion = process.env.PAYMENT_TOKEN_VERSION;
const customTokenDecimals = process.env.PAYMENT_TOKEN_DECIMALS
  ? parseInt(process.env.PAYMENT_TOKEN_DECIMALS, 10)
  : undefined;

// Determine payment configuration based on whether custom token is configured
const getPaymentPrice = () => {
  // For custom networks (not natively supported), a custom token MUST be configured
  if (!isNativelySupported) {
    if (!customTokenAddress || !customTokenName || !customTokenVersion || !customTokenDecimals) {
      throw new Error(
        `Custom network "${networkEnv}" requires custom token configuration. ` +
        `Please set PAYMENT_TOKEN_ADDRESS, PAYMENT_TOKEN_NAME, PAYMENT_TOKEN_VERSION, and PAYMENT_TOKEN_DECIMALS in your .env file.`
      );
    }
  }

  // Use custom token if fully configured
  if (customTokenAddress && customTokenName && customTokenVersion && customTokenDecimals) {
    // Calculate amount: 0.01 tokens = 0.01 * 10^decimals
    // For 18 decimals: 0.01 * 10^18 = 10000000000000000
    // For 6 decimals: 0.01 * 10^6 = 10000
    // Use BigInt to avoid JavaScript precision loss with large numbers
    const amount = ((BigInt(1) * BigInt(10) ** BigInt(customTokenDecimals)) / BigInt(100)).toString();

    return {
      amount,
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
  return "$0.01";
};

export const middleware = paymentMiddleware(
  payTo,
  {
    "/protected": {
      price: getPaymentPrice(),
      network,
      config: {
        description: "Access to protected content",
      },
    },
  },
  {
    url: facilitatorUrl,
  },
  {
    appName: "Next x402 Demo",
    appLogo: "/x402-icon-blue.png",
  },
);

// Configure which paths the middleware should run on
export const config = {
  matcher: ["/protected/:path*"],
  runtime: 'nodejs',
};
