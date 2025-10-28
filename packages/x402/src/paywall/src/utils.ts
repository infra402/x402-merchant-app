import type { PaymentRequirements } from "../../types";

/**
 * Safely clones an object without prototype pollution
 *
 * @param obj - The object to clone
 * @returns A safe clone of the object
 */
function safeClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => safeClone(item)) as T;
  }

  const cloned: Record<string, unknown> = {};
  for (const key in obj as Record<string, unknown>) {
    // Skip __proto__ and other dangerous properties
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = safeClone((obj as Record<string, unknown>)[key]);
    }
  }
  return cloned as T;
}

/**
 * Ensures a valid amount is set in payment requirements
 *
 * @param paymentRequirements - The payment requirements to validate and update
 * @returns Updated payment requirements with valid amount
 */
export function ensureValidAmount(paymentRequirements: PaymentRequirements): PaymentRequirements {
  const updatedRequirements = safeClone(paymentRequirements);

  if (window.x402?.amount) {
    try {
      // Get decimals from payment requirements extra field, default to 6 (USDC)
      const decimals = (updatedRequirements.extra as { decimals?: number })?.decimals || 6;
      // Use BigInt to avoid precision loss with large decimal values (e.g., 18 decimals)
      const amountInBaseUnits = (
        BigInt(Math.round(window.x402.amount * 100)) *
        BigInt(10) ** BigInt(decimals)
      ) / BigInt(100);
      updatedRequirements.maxAmountRequired = amountInBaseUnits.toString();
    } catch (error) {
      console.error("Failed to parse amount:", error);
    }
  }

  if (
    !updatedRequirements.maxAmountRequired ||
    !/^\d+$/.test(updatedRequirements.maxAmountRequired)
  ) {
    updatedRequirements.maxAmountRequired = "10000";
  }

  return updatedRequirements;
}

/**
 * Generates a session token for the user
 *
 * @param address - The user's connected wallet address
 * @returns The session token
 */
export const generateOnrampSessionToken = async (address: string): Promise<string | undefined> => {
  const endpoint = window.x402?.sessionTokenEndpoint;
  if (!endpoint) {
    return undefined;
  }

  // Call the session token API with user's address
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      addresses: [
        {
          address,
          blockchains: ["base"], // Onramp only supports mainnet
        },
      ],
      assets: ["USDC"],
    }),
  });

  const data = await response.json();
  return data.token;
};
