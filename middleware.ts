import { Address } from "viem";
import { paymentMiddleware, Network, Resource } from "x402-next";

const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL as Resource;
const payTo = process.env.RESOURCE_WALLET_ADDRESS as Address;
const network = process.env.NETWORK as Network;

// Custom EIP3009 token configuration (optional)
const customTokenAddress = process.env.PAYMENT_TOKEN_ADDRESS as Address | undefined;
const customTokenName = process.env.PAYMENT_TOKEN_NAME;
const customTokenVersion = process.env.PAYMENT_TOKEN_VERSION;
const customTokenDecimals = process.env.PAYMENT_TOKEN_DECIMALS
  ? parseInt(process.env.PAYMENT_TOKEN_DECIMALS, 10)
  : undefined;

// Determine payment configuration based on whether custom token is configured
const getPaymentPrice = () => {
  if (customTokenAddress && customTokenName && customTokenVersion && customTokenDecimals) {
    // Use custom EIP3009 token
    return {
      amount: "10000", // 0.01 with 6 decimals (adjust based on your token decimals)
      asset: {
        address: customTokenAddress,
        decimals: customTokenDecimals,
        eip712: {
          name: customTokenName,
          version: customTokenVersion,
        },
      },
    };
  }
  // Use default USDC
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
};
