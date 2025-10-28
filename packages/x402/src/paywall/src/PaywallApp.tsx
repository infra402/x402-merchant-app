"use client";

import { FundButton, getOnrampBuyUrl } from "@coinbase/onchainkit/fund";
import { Avatar, Name } from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Address, Chain, createPublicClient, formatUnits, http, publicActions } from "viem";
import { base, baseSepolia, bsc, bscTestnet } from "viem/chains";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";

import { selectPaymentRequirements } from "../../client";
import { exact } from "../../schemes";
import { getUSDCBalance } from "../../shared/evm";
import { usdcABI } from "../../types/shared/evm/erc20PermitABI";

import { Spinner } from "./Spinner";
import { useOnrampSessionToken } from "./useOnrampSessionToken";
import { ensureValidAmount } from "./utils";

/**
 * Main Paywall App Component
 *
 * @returns The PaywallApp component
 */
export function PaywallApp() {
  const { address, isConnected, chainId: connectedChainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { data: wagmiWalletClient } = useWalletClient();
  const { sessionToken } = useOnrampSessionToken(address);

  const [status, setStatus] = useState<string>("");
  const [isCorrectChain, setIsCorrectChain] = useState<boolean | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [formattedUsdcBalance, setFormattedUsdcBalance] = useState<string>("");
  const [hideBalance, setHideBalance] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const x402 = window.x402;
  const amount = x402.amount || 0;
  const testnet = x402.testnet ?? true;

  // First, get all payment requirements without filtering by network
  const allPaymentRequirements = x402 ? [x402.paymentRequirements].flat()[0] : null;

  // Get the network from the first payment requirement
  const network = allPaymentRequirements?.network || (testnet ? "base-sepolia" : "base");

  // Map network ID to viem chain
  const getChainFromNetwork = (networkId: string): Chain => {
    const chainMap: Record<string, Chain> = {
      "base-sepolia": baseSepolia,
      "base": base,
      "bsc-testnet": bscTestnet,
      "bsc": bsc,
      // Add more chains as needed
    };
    return chainMap[networkId] || baseSepolia; // Default to baseSepolia if unknown
  };

  const paymentChain = getChainFromNetwork(network);
  const showOnramp = Boolean(!testnet && isConnected && x402.sessionTokenEndpoint);

  // Get network and token information from payment requirements
  const paymentRequirements = x402
    ? selectPaymentRequirements([x402.paymentRequirements].flat(), network, "exact")
    : null;

  // Helper function to get human-readable network name
  const getNetworkDisplayName = (networkId: string): string => {
    const networkNames: Record<string, string> = {
      "base-sepolia": "Base Sepolia",
      "base": "Base",
      "bsc-testnet": "BSC Testnet",
      "bsc": "BSC",
      "avalanche-fuji": "Avalanche Fuji",
      "avalanche": "Avalanche",
      "iotex": "IoTeX",
      "solana-devnet": "Solana Devnet",
      "solana": "Solana",
      "sei": "Sei",
      "sei-testnet": "Sei Testnet",
      "polygon": "Polygon",
      "polygon-amoy": "Polygon Amoy",
      "peaq": "Peaq",
    };
    return networkNames[networkId] || networkId;
  };

  // Get token name from payment requirements
  const getTokenName = (): string => {
    // Check if extra field has EIP712 metadata with token name
    const extra = paymentRequirements?.extra;
    if (extra && typeof extra === "object" && "name" in extra) {
      return (extra as { name?: string }).name || "USDC";
    }

    return "USDC";
  };

  const networkDisplayName = getNetworkDisplayName(network);
  const tokenName = getTokenName();

  // Get token decimals from payment requirements extra field
  const getTokenDecimals = (): number => {
    const extra = paymentRequirements?.extra;
    if (extra && typeof extra === "object" && "decimals" in extra) {
      return (extra as { decimals?: number }).decimals || 6;
    }
    return 6; // Default to 6 decimals (USDC standard)
  };

  const tokenDecimals = getTokenDecimals();

  // Get token address from payment requirements
  const tokenAddress = paymentRequirements?.asset as Address | undefined;

  useEffect(() => {
    if (address) {
      handleSwitchChain();
      checkUSDCBalance();
    }
  }, [address]);

  const publicClient = createPublicClient({
    chain: paymentChain,
    transport: http(),
  }).extend(publicActions);

  useEffect(() => {
    if (isConnected && paymentChain.id === connectedChainId) {
      setIsCorrectChain(true);
      setStatus("");
    } else if (isConnected && paymentChain.id !== connectedChainId) {
      setIsCorrectChain(false);
      setStatus(`On the wrong network. Please switch to ${networkDisplayName}.`);
    } else {
      setIsCorrectChain(null);
      setStatus("");
    }
  }, [paymentChain.id, connectedChainId, isConnected]);

  const checkUSDCBalance = useCallback(async () => {
    if (!address || !tokenAddress) {
      return;
    }

    try {
      // Get token balance using the correct token address from payment requirements
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: usdcABI,
        functionName: "balanceOf",
        args: [address],
      });

      // Get decimals from the contract
      const decimals = await publicClient.readContract({
        address: tokenAddress,
        abi: usdcABI,
        functionName: "decimals",
      });

      const formattedBalance = formatUnits(balance as bigint, decimals as number);
      setFormattedUsdcBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching token balance:", error);
      setFormattedUsdcBalance("0");
    }
  }, [address, publicClient, tokenAddress]);

  const onrampBuyUrl = useMemo(() => {
    if (!sessionToken) {
      return;
    }
    return getOnrampBuyUrl({
      presetFiatAmount: 2,
      fiatCurrency: "USD",
      sessionToken,
    });
  }, [sessionToken]);

  const handleSuccessfulResponse = useCallback(async (response: Response) => {
    setPaymentSuccess(true);
    setStatus("Payment successful! Access granted.");
  }, []);

  const handleSwitchChain = useCallback(async () => {
    if (isCorrectChain) {
      return;
    }

    try {
      setStatus("");
      await switchChainAsync({ chainId: paymentChain.id });
      // Small delay to let wallet settle
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to switch network");
    }
  }, [switchChainAsync, paymentChain, isCorrectChain]);

  const handlePayment = useCallback(async () => {
    if (!address || !x402 || !paymentRequirements) {
      return;
    }

    await handleSwitchChain();

    // Use wagmi's wallet client which has the correct provider for the connected wallet
    // This avoids MetaMask conflicts when multiple wallets are installed
    if (!wagmiWalletClient) {
      setStatus("Wallet client not available. Please reconnect your wallet.");
      return;
    }
    const walletClient = wagmiWalletClient.extend(publicActions);

    setIsPaying(true);

    try {
      setStatus(`Checking ${tokenName} balance...`);

      // Get token balance using the correct token address from payment requirements
      if (!tokenAddress) {
        throw new Error("Token address not found in payment requirements");
      }

      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: usdcABI,
        functionName: "balanceOf",
        args: [address],
      });

      if ((balance as bigint) === 0n) {
        throw new Error(`Insufficient balance. Make sure you have ${tokenName} on ${networkDisplayName}`);
      }

      setStatus("Creating payment signature...");
      const validPaymentRequirements = ensureValidAmount(paymentRequirements);
      const initialPayment = await exact.evm.createPayment(
        walletClient,
        1,
        validPaymentRequirements,
      );

      const paymentHeader: string = exact.evm.encodePayment(initialPayment);

      setStatus("Requesting content with payment...");
      const response = await fetch(x402.currentUrl, {
        headers: {
          "X-PAYMENT": paymentHeader,
          "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE",
        },
      });

      if (response.ok) {
        await handleSuccessfulResponse(response);
      } else if (response.status === 402) {
        // Try to parse error data, fallback to empty object if parsing fails
        const errorData = await response.json().catch(() => ({}));
        if (errorData && typeof errorData.x402Version === "number") {
          // Retry with server's x402Version
          const retryPayment = await exact.evm.createPayment(
            walletClient,
            errorData.x402Version,
            validPaymentRequirements,
          );

          retryPayment.x402Version = errorData.x402Version;
          const retryHeader = exact.evm.encodePayment(retryPayment);
          const retryResponse = await fetch(x402.currentUrl, {
            headers: {
              "X-PAYMENT": retryHeader,
              "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE",
            },
          });
          if (retryResponse.ok) {
            await handleSuccessfulResponse(retryResponse);
            return;
          } else {
            throw new Error(`Payment retry failed: ${retryResponse.statusText}`);
          }
        } else {
          throw new Error(`Payment failed: ${response.statusText}`);
        }
      } else {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsPaying(false);
    }
  }, [address, x402, paymentRequirements, publicClient, paymentChain, handleSwitchChain]);

  if (!x402 || !paymentRequirements) {
    return (
      <div className="container">
        <div className="header">
          <h1 className="title">Payment Required</h1>
          <p className="subtitle">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container gap-8">
      <div className="header">
        <h1 className="title">{paymentSuccess ? "Payment Successful" : "Payment Required"}</h1>
        {paymentSuccess ? (
          <div className="success-message">
            <p className="text-green-600 font-semibold">✓ Payment confirmed!</p>
            <p>Your payment has been processed successfully. You now have access to the protected content.</p>
          </div>
        ) : (
          <>
            <p style={{ color: '#E8ECF1' }}>
              {paymentRequirements.description && `${paymentRequirements.description}.`} To access this
              content, please pay ${amount} {networkDisplayName} {tokenName}.
            </p>
            <p className="token-info" style={{ color: '#9AA4B2' }}>
              <span className="text-sm opacity-70">Token: {tokenAddress}</span>
            </p>
            {testnet && (
              <p className="instructions">
                Need {networkDisplayName} {tokenName}?{" "}
                <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer">
                  Get some <u>here</u>.
                </a>
              </p>
            )}
          </>
        )}
      </div>

      <div className="content w-full">
        {!paymentSuccess && (
          <>
            <Wallet className="w-full">
              <ConnectWallet className="w-full py-3" disconnectedLabel="Connect wallet">
                <Avatar className="h-5 w-5 opacity-80" />
                <Name className="opacity-80 text-sm" />
              </ConnectWallet>
              <WalletDropdown>
                <WalletDropdownDisconnect className="opacity-80" />
              </WalletDropdown>
            </Wallet>
            {isConnected && (
          <div id="payment-section">
            <div className="payment-details">
              <div className="payment-row">
                <span className="payment-label">Wallet:</span>
                <span className="payment-value">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Loading..."}
                </span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Available balance:</span>
                <span className="payment-value">
                  <button className="balance-button" onClick={() => setHideBalance(prev => !prev)}>
                    {formattedUsdcBalance && !hideBalance
                      ? `$${formattedUsdcBalance} ${tokenName}`
                      : `••••• ${tokenName}`}
                  </button>
                </span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Amount:</span>
                <span className="payment-value">${amount} {tokenName}</span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Network:</span>
                <span className="payment-value">{networkDisplayName}</span>
              </div>
            </div>

            {isCorrectChain ? (
              <div className="cta-container">
                {showOnramp && (
                  <FundButton
                    fundingUrl={onrampBuyUrl}
                    text="Get more USDC"
                    hideIcon
                    className="button button-positive"
                  />
                )}
                <button
                  className="button button-primary"
                  onClick={handlePayment}
                  disabled={isPaying}
                >
                  {isPaying ? <Spinner /> : "Pay now"}
                </button>
              </div>
            ) : (
              <button className="button button-primary" onClick={handleSwitchChain}>
                Switch to {networkDisplayName}
              </button>
            )}
          </div>
        )}
          </>
        )}
        {status && <div className="status">{status}</div>}
      </div>
    </div>
  );
}
