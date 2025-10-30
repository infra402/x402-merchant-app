import { PAYWALL_TEMPLATE } from "./gen/template";
import { config } from "../types/shared/evm/config";
import { PaymentRequirements } from "../types/verify";

interface PaywallOptions {
  amount: number;
  paymentRequirements: PaymentRequirements[];
  currentUrl: string;
  testnet: boolean;
  x402Version: number;
  cdpClientKey?: string;
  appName?: string;
  appLogo?: string;
  sessionTokenEndpoint?: string;
  paywallTitle?: string;
  paywallMessage?: string;
  networksEnv?: string;
  amountsEnv?: string;
}

/**
 * Escapes a string for safe injection into JavaScript string literals
 *
 * @param str - The string to escape
 * @returns The escaped string
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Generates an HTML paywall page that allows users to pay for content access
 *
 * @param options - The options for generating the paywall
 * @param options.amount - The amount to be paid in USD
 * @param options.paymentRequirements - The payment requirements for the content
 * @param options.currentUrl - The URL of the content being accessed
 * @param options.testnet - Whether to use testnet or mainnet
 * @param options.cdpClientKey - CDP client API key for OnchainKit
 * @param options.appName - The name of the application to display in the wallet connection modal
 * @param options.appLogo - The logo of the application to display in the wallet connection modal
 * @param options.sessionTokenEndpoint - The API endpoint for generating session tokens for Onramp authentication
 * @returns An HTML string containing the paywall page
 */
export function getPaywallHtml({
  amount,
  testnet,
  paymentRequirements,
  currentUrl,
  x402Version,
  cdpClientKey,
  appName,
  appLogo,
  sessionTokenEndpoint,
  paywallTitle,
  paywallMessage,
  networksEnv,
  amountsEnv,
}: PaywallOptions): string {
  const logOnTestnet = testnet
    ? "console.log('Payment requirements initialized:', window.x402);"
    : "";

  // Create the configuration script to inject with proper escaping
  const configScript = `
  <script>
    window.x402 = {
      amount: ${amount},
      paymentRequirements: ${JSON.stringify(paymentRequirements)},
      testnet: ${testnet},
      currentUrl: "${escapeString(currentUrl)}",
      x402Version: ${x402Version},
      config: {
        chainConfig: ${JSON.stringify(config)},
      },
      cdpClientKey: "${escapeString(cdpClientKey || "")}",
      appName: "${escapeString(appName || "")}",
      appLogo: "${escapeString(appLogo || "")}",
      sessionTokenEndpoint: "${escapeString(sessionTokenEndpoint || "")}",
      paywallTitle: "${escapeString(paywallTitle || "")}",
      paywallMessage: "${escapeString(paywallMessage || "")}",
      networksEnv: "${escapeString(networksEnv || "")}",
      amountsEnv: "${escapeString(amountsEnv || "")}",
    };
    ${logOnTestnet}
  </script>`;

  // Inject the configuration script into the head
  return PAYWALL_TEMPLATE.replace("</head>", `${configScript}\n</head>`);
}
