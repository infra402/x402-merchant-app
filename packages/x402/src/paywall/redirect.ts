import { PaymentRequirements } from "../types/verify";

export interface PaywallRedirectData {
  amount: number;
  paymentRequirements: PaymentRequirements[];
  currentUrl: string;
  testnet: boolean;
  x402Version: number;
  cdpClientKey?: string;
  appName?: string;
  appLogo?: string;
  paywallTitle?: string;
  paywallMessage?: string;
  networksEnv?: string;
  amountsEnv?: string;
  sessionTokenEndpoint?: string;
  facilitatorUrl?: string;
  timestamp: number;
}

// Browser-compatible base64url encode
export function encodePaywallData(data: PaywallRedirectData): string {
  const json = JSON.stringify(data);
  // Use btoa for browser compatibility, handle UTF-8 properly
  const base64 = btoa(unescape(encodeURIComponent(json)));
  // Convert to URL-safe base64: + -> -, / -> _, remove padding
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Browser-compatible base64url decode
export function decodePaywallData(encoded: string): PaywallRedirectData {
  // Convert from URL-safe base64 back to standard base64
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  while (base64.length % 4) {
    base64 += "=";
  }
  // Decode using atob and handle UTF-8 properly
  const json = decodeURIComponent(escape(atob(base64)));
  return JSON.parse(json);
}
