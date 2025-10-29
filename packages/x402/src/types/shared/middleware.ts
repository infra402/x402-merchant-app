import { CreateHeaders } from "../../verify";
import { Money } from "./money";
import { Network } from "./network";
import { Resource } from "./resource";
import { EvmSigner } from "./evm";
import { HTTPRequestStructure } from "..";

export type FacilitatorConfig = {
  url: Resource;
  createAuthHeaders?: CreateHeaders;
};

export type PaywallConfig = {
  cdpClientKey?: string;
  appName?: string;
  appLogo?: string;
  sessionTokenEndpoint?: string;
  networksEnv?: string;
  amountsEnv?: string;
};

export type PaymentMiddlewareConfig = {
  description?: string;
  mimeType?: string;
  maxTimeoutSeconds?: number;
  inputSchema?: Omit<HTTPRequestStructure, "type" | "method">;
  outputSchema?: object;
  discoverable?: boolean;
  customPaywallHtml?: string;
  resource?: Resource;
  title?: string;
  message?: string;
  errorMessages?: {
    paymentRequired?: string;
    invalidPayment?: string;
    noMatchingRequirements?: string;
    verificationFailed?: string;
    settlementFailed?: string;
  };
};

export interface ERC20TokenAmount {
  amount: string;
  asset: {
    address: `0x${string}`;
    decimals: number;
    eip712: {
      name: string;
      version: string;
    };
  };
}

export interface SPLTokenAmount {
  amount: string;
  asset: {
    address: string;
    decimals: number;
  };
}

export type Price = Money | ERC20TokenAmount | SPLTokenAmount;

export interface NetworkConfig {
  price: Price;
  network: Network;
}

export interface RouteConfig {
  price: Price;
  network: Network;
  config?: PaymentMiddlewareConfig;
  // Support multiple networks for the same route
  networks?: NetworkConfig[];
}

export type RoutesConfig = Record<string, Price | RouteConfig>;

export interface RoutePattern {
  verb: string;
  pattern: RegExp;
  config: RouteConfig;
}

export type Wallet = EvmSigner;
