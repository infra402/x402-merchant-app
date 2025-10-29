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
 * @param amount - Optional amount to use (overrides window.x402.amount)
 * @returns Updated payment requirements with valid amount
 */
export function ensureValidAmount(paymentRequirements: PaymentRequirements, amount?: number): PaymentRequirements {
  const updatedRequirements = safeClone(paymentRequirements);

  // Use provided amount or fall back to window.x402.amount
  const amountToUse = amount ?? window.x402?.amount;

  if (amountToUse) {
    try {
      // Get decimals from payment requirements extra field, default to 6 (USDC)
      const decimals = (updatedRequirements.extra as { decimals?: number })?.decimals || 6;

      // Convert to base units: amount * 10^decimals
      // This follows Solidity's uint256 conversion pattern
      // For example: 0.00001 tokens with 18 decimals = 0.00001 * 10^18 = 10000000000000

      // Convert the amount to a string with enough precision to avoid floating point errors
      const amountStr = amountToUse.toFixed(decimals);

      // Split into integer and decimal parts
      const [integerPart, decimalPart = ''] = amountStr.split('.');

      // Pad or trim the decimal part to match token decimals
      const paddedDecimal = (decimalPart + '0'.repeat(decimals)).slice(0, decimals);

      // Combine: integerPart concatenated with paddedDecimal gives us the base units
      const baseUnitsStr = integerPart + paddedDecimal;
      const amountInBaseUnits = BigInt(baseUnitsStr);

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
