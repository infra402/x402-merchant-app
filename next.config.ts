import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    RESOURCE_WALLET_ADDRESS: process.env.RESOURCE_WALLET_ADDRESS,
    NEXT_PUBLIC_FACILITATOR_URL: process.env.NEXT_PUBLIC_FACILITATOR_URL,
    NETWORK: process.env.NETWORK,
    PAYMENT_TOKEN_ADDRESS: process.env.PAYMENT_TOKEN_ADDRESS,
    PAYMENT_TOKEN_NAME: process.env.PAYMENT_TOKEN_NAME,
    PAYMENT_TOKEN_VERSION: process.env.PAYMENT_TOKEN_VERSION,
    PAYMENT_TOKEN_DECIMALS: process.env.PAYMENT_TOKEN_DECIMALS,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
