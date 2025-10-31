import { toJsonSafe } from "../shared";
import {
  ListDiscoveryResourcesRequest,
  ListDiscoveryResourcesResponse,
  FacilitatorConfig,
  SupportedPaymentKindsResponse,
} from "../types";
import {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  VerifyResponse,
} from "../types/verify";

const DEFAULT_FACILITATOR_URL = "https://facilitator.infra402.com";

export type CreateHeaders = () => Promise<{
  verify: Record<string, string>;
  settle: Record<string, string>;
  supported: Record<string, string>;
  list?: Record<string, string>;
}>;

/**
 * Creates a facilitator client for interacting with the X402 payment facilitator service
 *
 * @param facilitator - The facilitator config to use. If not provided, the default facilitator will be used.
 * @returns An object containing verify and settle functions for interacting with the facilitator
 */
export function useFacilitator(facilitator?: FacilitatorConfig) {
  /**
   * Verifies a payment payload with the facilitator service
   *
   * @param payload - The payment payload to verify
   * @param paymentRequirements - The payment requirements to verify against
   * @returns A promise that resolves to the verification response
   */
  async function verify(
    payload: PaymentPayload,
    paymentRequirements: PaymentRequirements,
  ): Promise<VerifyResponse> {
    const url = facilitator?.url || DEFAULT_FACILITATOR_URL;

    let headers = { "Content-Type": "application/json" };
    if (facilitator?.createAuthHeaders) {
      const authHeaders = await facilitator.createAuthHeaders();
      headers = { ...headers, ...authHeaders.verify };
    }

    try {
      const res = await fetch(`${url}/verify`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          x402Version: payload.x402Version,
          paymentPayload: toJsonSafe(payload),
          paymentRequirements: toJsonSafe(paymentRequirements),
        }),
      });

      if (res.status !== 200) {
        throw new Error(`Failed to verify payment: ${res.statusText}`);
      }

      const data = await res.json();
      return data as VerifyResponse;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'fetch failed') {
        throw new Error(`Unable to connect to facilitator at ${url}. Please check your network connection or facilitator URL.`);
      }
      throw error;
    }
  }

  /**
   * Settles a payment with the facilitator service
   *
   * @param payload - The payment payload to settle
   * @param paymentRequirements - The payment requirements for the settlement
   * @returns A promise that resolves to the settlement response
   */
  async function settle(
    payload: PaymentPayload,
    paymentRequirements: PaymentRequirements,
  ): Promise<SettleResponse> {
    const url = facilitator?.url || DEFAULT_FACILITATOR_URL;

    let headers = { "Content-Type": "application/json" };
    if (facilitator?.createAuthHeaders) {
      const authHeaders = await facilitator.createAuthHeaders();
      headers = { ...headers, ...authHeaders.settle };
    }

    const requestBody = {
      x402Version: payload.x402Version,
      paymentPayload: toJsonSafe(payload),
      paymentRequirements: toJsonSafe(paymentRequirements),
    };

    const requestTime = new Date().toISOString();

    try {
      const res = await fetch(`${url}/settle`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (res.status !== 200) {
        const text = res.statusText;
        let responseBody: any;
        try {
          responseBody = await res.json();
        } catch {
          responseBody = await res.text().catch(() => 'Unable to read response body');
        }

        // Log verbose debug information
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('🔴 FACILITATOR SETTLE CALL FAILED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('⏰ Timestamp:', requestTime);
        console.error('📍 URL:', `${url}/settle`);
        console.error('📤 Request Method:', 'POST');
        console.error('📋 Request Headers:', JSON.stringify(headers, null, 2));
        console.error('📦 Request Body:', JSON.stringify(requestBody, null, 2));
        console.error('');
        console.error('📥 Response Status:', res.status, text);
        console.error('📋 Response Headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
        console.error('📦 Response Body:', typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody, null, 2));
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        throw new Error(`Failed to settle payment: ${res.status} ${text}`);
      }

      const data = await res.json();
      return data as SettleResponse;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'fetch failed') {
        throw new Error(`Unable to connect to facilitator at ${url}. Please check your network connection or facilitator URL.`);
      }
      throw error;
    }
  }

  /**
   * Gets the supported payment kinds from the facilitator service.
   *
   * @returns A promise that resolves to the supported payment kinds
   */
  async function supported(): Promise<SupportedPaymentKindsResponse> {
    const url = facilitator?.url || DEFAULT_FACILITATOR_URL;

    let headers = { "Content-Type": "application/json" };
    if (facilitator?.createAuthHeaders) {
      const authHeaders = await facilitator.createAuthHeaders();
      headers = { ...headers, ...authHeaders.supported };
    }

    try {
      const res = await fetch(`${url}/supported`, {
        method: "GET",
        headers,
      });

      if (res.status !== 200) {
        throw new Error(`Failed to get supported payment kinds: ${res.statusText}`);
      }

      const data = await res.json();
      return data as SupportedPaymentKindsResponse;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'fetch failed') {
        throw new Error(`Unable to connect to facilitator at ${url}. Please check your network connection or facilitator URL.`);
      }
      throw error;
    }
  }

  /**
   * Lists the discovery items with the facilitator service
   *
   * @param config - The configuration for the discovery list request
   * @returns A promise that resolves to the discovery list response
   */
  async function list(
    config: ListDiscoveryResourcesRequest = {},
  ): Promise<ListDiscoveryResourcesResponse> {
    const url = facilitator?.url || DEFAULT_FACILITATOR_URL;

    let headers = { "Content-Type": "application/json" };
    if (facilitator?.createAuthHeaders) {
      const authHeaders = await facilitator.createAuthHeaders();
      if (authHeaders.list) {
        headers = { ...headers, ...authHeaders.list };
      }
    }

    const urlParams = new URLSearchParams(
      Object.entries(config)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, value.toString()]),
    );

    try {
      const res = await fetch(`${url}/discovery/resources?${urlParams.toString()}`, {
        method: "GET",
        headers,
      });

      if (res.status !== 200) {
        const text = res.statusText;
        throw new Error(`Failed to list discovery: ${res.status} ${text}`);
      }

      const data = await res.json();
      return data as ListDiscoveryResourcesResponse;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'fetch failed') {
        throw new Error(`Unable to connect to facilitator at ${url}. Please check your network connection or facilitator URL.`);
      }
      throw error;
    }
  }

  return { verify, settle, supported, list };
}

export const { verify, settle, supported, list } = useFacilitator();
