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
