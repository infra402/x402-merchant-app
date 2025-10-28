# x402-merchant-app

This is a Next.js application that demonstrates how to use the `x402-next` middleware to implement paywall functionality in your Next.js routes.

## Prerequisites

- Node.js v20+ (install via [nvm](https://github.com/nvm-sh/nvm))
- npm v10+ (comes with Node.js)
- A valid Ethereum address for receiving payments

## Setup

1. Copy `.env-local` to `.env` and configure your environment:

```bash
cp .env-local .env
```

Required environment variables:
- `RESOURCE_WALLET_ADDRESS`: Your Ethereum address to receive payments
- `NETWORK`: The network to use (see supported networks below)
- `NEXT_PUBLIC_FACILITATOR_URL`: Facilitator service URL (default: https://x402.org/facilitator)

Optional - Custom EIP3009 Payment Token:
- `PAYMENT_TOKEN_ADDRESS`: Custom token contract address
- `PAYMENT_TOKEN_NAME`: Token name from EIP-712 (call `name()` on contract)
- `PAYMENT_TOKEN_VERSION`: Token version from EIP-712 (call `version()` on contract)
- `PAYMENT_TOKEN_DECIMALS`: Token decimals (e.g., 6 for USDC, 18 for most ERC20)

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Supported Networks

### Natively Supported Networks

The x402-next middleware natively supports the following networks:
- **Base**: `base`, `base-sepolia`
- **Avalanche**: `avalanche`, `avalanche-fuji`
- **Polygon**: `polygon`, `polygon-amoy`
- **Other EVM**: `iotex`, `sei`, `sei-testnet`, `peaq`
- **Solana**: `solana`, `solana-devnet`

### Custom Network Support

This application automatically supports **any additional network** when used with a custom facilitator. The middleware detects if a network is not natively supported and enables custom facilitator mode.

**Requirements for custom networks (all required):**
1. Set `NEXT_PUBLIC_FACILITATOR_URL` to your custom facilitator endpoint
2. Set `NETWORK` to your custom network name (e.g., `bsc-testnet`)
3. Configure **ALL 4** custom EIP3009 payment token variables:
   - `PAYMENT_TOKEN_ADDRESS` - Contract address of your EIP3009 token
   - `PAYMENT_TOKEN_NAME` - Token name from `name()` method
   - `PAYMENT_TOKEN_VERSION` - Token version from `version()` method
   - `PAYMENT_TOKEN_DECIMALS` - Token decimals (e.g., 18)

**Important**: Custom networks **require** a custom token. The middleware cannot use default USDC on unsupported networks and will throw an error if token configuration is incomplete.

**Examples of custom networks:**
- BSC Testnet: `NETWORK=bsc-testnet`
- Arbitrum: `NETWORK=arbitrum`
- Optimism: `NETWORK=optimism`
- Any EVM-compatible chain supported by your facilitator

**Note**: Custom networks bypass x402's built-in wallet integration and rely entirely on your facilitator for payment verification and settlement.

## Example Routes

The app includes protected routes that require payment to access:

### Protected Page Route
The `/protected` route requires a payment of $0.01 to access. The route is protected using the x402-next middleware:

```typescript
// middleware.ts
import { paymentMiddleware, Network, Resource } from "x402-next";

const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL as Resource;
const payTo = process.env.RESOURCE_WALLET_ADDRESS as Address;
const network = process.env.NETWORK as Network;

export const middleware = paymentMiddleware(
  payTo,
  {
    "/protected": {
      price: "$0.01",
      network,
      config: {
        description: "Access to protected content",
      },
    },
  },
  {
    url: facilitatorUrl,
  },
);

// Configure which paths the middleware should run on
export const config = {
  matcher: ["/protected/:path*"],
};
```

## Response Format

### Payment Required (402)
```json
{
  "error": "X-PAYMENT header is required",
  "paymentRequirements": {
    "scheme": "exact",
    "network": "base",
    "maxAmountRequired": "1000",
    "resource": "http://localhost:3000/protected",
    "description": "Access to protected content",
    "mimeType": "",
    "payTo": "0xYourAddress",
    "maxTimeoutSeconds": 60,
    "asset": "0x...",
    "outputSchema": null,
    "extra": null
  }
}
```

### Successful Response
```ts
// Headers
{
  "X-PAYMENT-RESPONSE": "..." // Encoded response object
}
```

## Extending the Example

To add more protected routes, update the middleware configuration:

```typescript
export const middleware = paymentMiddleware(
  payTo,
  {
    "/protected": {
      price: "$0.01",
      network,
      config: {
        description: "Access to protected content",
      },
    },
    "/api/premium": {
      price: "$0.10",
      network,
      config: {
        description: "Premium API access",
      },
    },
  }
);

export const config = {
  matcher: ["/protected/:path*", "/api/premium/:path*"],
};
```
