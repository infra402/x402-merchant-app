import { PaymentRequirements } from "../../types/verify";

declare global {
  interface Window {
    x402: {
      amount?: number;
      testnet?: boolean;
      paymentRequirements: PaymentRequirements | PaymentRequirements[];
      currentUrl: string;
      cdpClientKey?: string;
      appName?: string;
      appLogo?: string;
      sessionTokenEndpoint?: string;
      paywallTitle?: string;
      paywallMessage?: string;
      networksEnv?: string;
      amountsEnv?: string;
      facilitatorUrl?: string;
      x402Version?: number;
      /** Wrap mode configuration (comma-separated: "native" or "erc20" per network) */
      wrapModesEnv?: string;
      /** Underlying ERC20 token addresses for wrap (comma-separated) */
      wrapUnderlyingAddressesEnv?: string;
      /** Underlying ERC20 token symbols for wrap (comma-separated) */
      wrapUnderlyingSymbolsEnv?: string;
      /** Underlying ERC20 token decimals for wrap (comma-separated) */
      wrapUnderlyingDecimalsEnv?: string;
      config: {
        chainConfig: Record<
          string,
          {
            usdcAddress: string;
            usdcName: string;
          }
        >;
      };
    };
    // Wallet provider declarations
    okxwallet?: any;
    bybitWallet?: any;
    phantom?: {
      ethereum?: any;
    };
    coin98?: any;
    tokenpocket?: any;
    bitkeep?: any;
  }
}
