"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Address, Chain, createPublicClient, formatUnits, http, publicActions } from "viem";
import { base, baseSepolia, bsc, bscTestnet } from "viem/chains";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";

import { selectPaymentRequirements } from "../../client";
import { exact } from "../../schemes";
import { CustomConnectButton } from "./CustomConnectButton";
import { getUSDCBalance } from "../../shared/evm";
import { usdcABI } from "../../types/shared/evm/erc20PermitABI";

import { Spinner } from "./Spinner";
import { ensureValidAmount } from "./utils";

// XBNB/Wrapped Native Token ABI - only the functions we need
const xbnbABI = [
  {
    name: "deposit",
    type: "function",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    name: "withdraw",
    type: "function",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

/**
 * Main Paywall App Component
 *
 * @returns The PaywallApp component
 */
export function PaywallApp() {
  const { address, isConnected, chainId: connectedChainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { data: wagmiWalletClient } = useWalletClient();

  const [status, setStatus] = useState<string>("");
  const [isCorrectChain, setIsCorrectChain] = useState<boolean | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [formattedUsdcBalance, setFormattedUsdcBalance] = useState<string>("");
  const [hideBalance, setHideBalance] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Wrap/Unwrap state
  const [isWrapMode, setIsWrapMode] = useState(true);
  const [wrapAmount, setWrapAmount] = useState("");
  const [nativeBalance, setNativeBalance] = useState<string>("");
  const [isWrapping, setIsWrapping] = useState(false);
  const [wrapStatus, setWrapStatus] = useState<string>("");

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

  // Get token symbol from payment requirements
  const getTokenSymbol = (): string => {
    // Check if extra field has EIP712 metadata with token symbol
    const extra = paymentRequirements?.extra;
    if (extra && typeof extra === "object" && "symbol" in extra) {
      const symbol = (extra as { symbol?: string }).symbol;
      return symbol || "USDC";
    }

    return "USDC";
  };

  const networkDisplayName = getNetworkDisplayName(network);
  const tokenSymbol = getTokenSymbol();

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

  const publicClient = createPublicClient({
    chain: paymentChain,
    transport: http(),
  }).extend(publicActions);

  const checkUSDCBalance = useCallback(async () => {
    if (!address || !tokenAddress) {
      console.log("checkUSDCBalance: no address or tokenAddress", { address, tokenAddress });
      return;
    }

    try {
      console.log("checkUSDCBalance: fetching for address", address, "token", tokenAddress);
      // Get token balance using the correct token address from payment requirements
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: usdcABI,
        functionName: "balanceOf",
        args: [address],
      });
      console.log("checkUSDCBalance: raw balance", balance);

      // Get decimals from the contract
      const decimals = await publicClient.readContract({
        address: tokenAddress,
        abi: usdcABI,
        functionName: "decimals",
      });
      console.log("checkUSDCBalance: decimals", decimals);

      const formattedBalance = formatUnits(balance as bigint, decimals as number);
      console.log("checkUSDCBalance: formatted balance", formattedBalance);
      setFormattedUsdcBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching token balance:", error);
      setFormattedUsdcBalance("0");
    }
  }, [address, publicClient, tokenAddress]);

  const checkNativeBalance = useCallback(async () => {
    if (!address) {
      console.log("checkNativeBalance: no address");
      return;
    }

    try {
      console.log("checkNativeBalance: fetching for address", address);
      const balance = await publicClient.getBalance({ address });
      console.log("checkNativeBalance: raw balance", balance);
      const formattedBalance = formatUnits(balance, 18);
      console.log("checkNativeBalance: formatted balance", formattedBalance);
      setNativeBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching native balance:", error);
      setNativeBalance("0");
    }
  }, [address, publicClient]);

  useEffect(() => {
    console.log("useEffect for balance check triggered, address:", address);
    if (address) {
      console.log("Calling checkUSDCBalance and checkNativeBalance");
      checkUSDCBalance();
      checkNativeBalance();
    }
  }, [address]);

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
      setStatus(`Checking ${tokenSymbol} balance...`);

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
        throw new Error(`Insufficient balance. Make sure you have ${tokenSymbol} on ${networkDisplayName}`);
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

  const handleWrap = useCallback(async () => {
    if (!address || !wagmiWalletClient || !tokenAddress || !wrapAmount) {
      return;
    }

    await handleSwitchChain();

    const walletClient = wagmiWalletClient.extend(publicActions);
    setIsWrapping(true);
    setWrapStatus("");

    try {
      const amountInWei = (BigInt(Math.round(parseFloat(wrapAmount) * 1e18))).toString();

      setWrapStatus("Wrapping native tokens...");
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: xbnbABI,
        functionName: "deposit",
        args: [],
        value: BigInt(amountInWei),
      });

      setWrapStatus("Waiting for confirmation...");
      await publicClient.waitForTransactionReceipt({ hash });

      setWrapStatus("✓ Wrap successful!");
      setWrapAmount("");

      // Refresh balances
      await Promise.all([checkNativeBalance(), checkUSDCBalance()]);

      setTimeout(() => setWrapStatus(""), 3000);
    } catch (error) {
      setWrapStatus(error instanceof Error ? error.message : "Wrap failed");
    } finally {
      setIsWrapping(false);
    }
  }, [address, wagmiWalletClient, tokenAddress, wrapAmount, handleSwitchChain, publicClient, checkNativeBalance, checkUSDCBalance]);

  const handleUnwrap = useCallback(async () => {
    if (!address || !wagmiWalletClient || !tokenAddress || !wrapAmount) {
      return;
    }

    await handleSwitchChain();

    const walletClient = wagmiWalletClient.extend(publicActions);
    setIsWrapping(true);
    setWrapStatus("");

    try {
      const amountInWei = (BigInt(Math.round(parseFloat(wrapAmount) * 1e18))).toString();

      setWrapStatus("Unwrapping tokens...");
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: xbnbABI,
        functionName: "withdraw",
        args: [BigInt(amountInWei)],
      });

      setWrapStatus("Waiting for confirmation...");
      await publicClient.waitForTransactionReceipt({ hash });

      setWrapStatus("✓ Unwrap successful!");
      setWrapAmount("");

      // Refresh balances
      await Promise.all([checkNativeBalance(), checkUSDCBalance()]);

      setTimeout(() => setWrapStatus(""), 3000);
    } catch (error) {
      setWrapStatus(error instanceof Error ? error.message : "Unwrap failed");
    } finally {
      setIsWrapping(false);
    }
  }, [address, wagmiWalletClient, tokenAddress, wrapAmount, handleSwitchChain, publicClient, checkNativeBalance, checkUSDCBalance]);

  // Determine if wrap/unwrap should be shown (only for BSC networks)
  const showWrapUnwrap = network === "bsc" || network === "bsc-testnet";

  // Get native token symbol
  const nativeTokenSymbol = network === "bsc" ? "BNB" : network === "bsc-testnet" ? "tBNB" : "";

  // Validation for wrap/unwrap button
  const canWrap = wrapAmount && parseFloat(wrapAmount) > 0 && parseFloat(wrapAmount) <= parseFloat(nativeBalance || "0");
  const canUnwrap = wrapAmount && parseFloat(wrapAmount) > 0 && parseFloat(wrapAmount) <= parseFloat(formattedUsdcBalance || "0");
  const isWrapUnwrapValid = isWrapMode ? canWrap : canUnwrap;

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

  const customTitle = x402.paywallTitle;
  const customMessage = x402.paywallMessage;
  const defaultMessage = `To access this protected content, please pay {amount} {network} {symbol}.`;

  return (
    <div className="container gap-8">
      <div className="header">
        <h1 className="title">{paymentSuccess ? "Payment Successful" : (customTitle || "Payment Required")}</h1>
        {paymentSuccess ? (
          <div className="success-message">
            <p className="font-semibold" style={{ color: '#22C55E' }}>✓ Payment confirmed!</p>
            <p style={{ color: '#E8ECF1' }}>Your payment has been processed successfully. You now have access to the protected content.</p>
          </div>
        ) : (
          <>
            <p style={{ color: '#E8ECF1' }}>
              {customMessage
                ? customMessage.replace('{amount}', String(amount)).replace('{network}', networkDisplayName).replace('{symbol}', tokenSymbol)
                : defaultMessage.replace('{amount}', String(amount)).replace('{network}', networkDisplayName).replace('{symbol}', tokenSymbol)
              }
            </p>
            <p className="token-info" style={{ color: '#9AA4B2' }}>
              <span className="text-sm opacity-70">{tokenSymbol}: {tokenAddress}</span>
            </p>
            {testnet && (
              <p className="instructions">
                Need {networkDisplayName} {tokenSymbol}?{" "}
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
            <div style={{ marginTop: '2rem' }}>
              <CustomConnectButton />
            </div>

            {/* Wrap/Unwrap Section - Only for BSC networks */}
            {showWrapUnwrap && isConnected && !paymentSuccess && (
              <div id="wrap-unwrap-section" style={{ marginTop: '1rem' }}>
                <div className="header">
                  <h1 className="title">Wrap / Unwrap</h1>
                  <p className="subtitle">{nativeTokenSymbol}:{tokenSymbol} {'<->'} 1:1</p>
                </div>
                <div className="payment-details">
                  {/* Tabs */}
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <button
                      className={`button ${isWrapMode ? 'button-secondary' : 'button'}`}
                      style={{
                        ...(!isWrapMode ? { backgroundColor: '#1A2130', color: '#9AA4B2' } : {}),
                        flex: 1,
                        width: 'auto'
                      }}
                      onClick={() => setIsWrapMode(true)}
                    >
                      Wrap
                    </button>
                    <button
                      className={`button ${!isWrapMode ? 'button-secondary' : 'button'}`}
                      style={{
                        ...(isWrapMode ? { backgroundColor: '#1A2130', color: '#9AA4B2' } : {}),
                        flex: 1,
                        width: 'auto'
                      }}
                      onClick={() => setIsWrapMode(false)}
                    >
                      Unwrap
                    </button>
                  </div>

                  {/* Balance info */}
                  <div className="payment-row">
                    <span className="payment-label">
                      {isWrapMode ? `${nativeTokenSymbol} Balance:` : `${tokenSymbol} Balance:`}
                    </span>
                    <span className="payment-value">
                      {isWrapMode ? `${nativeBalance || '0'} ${nativeTokenSymbol}` : `${formattedUsdcBalance || '0'} ${tokenSymbol}`}
                    </span>
                  </div>

                  {/* Input */}
                  <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder={isWrapMode ? `Amount of ${nativeTokenSymbol} to wrap to ${tokenSymbol}` : `Amount of ${tokenSymbol} to unwrap to ${nativeTokenSymbol}`}
                      value={wrapAmount}
                      onChange={(e) => setWrapAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#1A2130',
                        color: '#E8ECF1',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                      }}
                      disabled={isWrapping}
                    />
                  </div>

                  {/* Action button */}
                  {isCorrectChain ? (
                    <button
                      className="button button-primary w-full"
                      onClick={isWrapMode ? handleWrap : handleUnwrap}
                      disabled={isWrapping || !isWrapUnwrapValid}
                      style={!isWrapUnwrapValid ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                      {isWrapping ? <Spinner /> : isWrapMode ? 'Wrap' : 'Unwrap'}
                    </button>
                  ) : (
                    <button className="button button-primary w-full" onClick={handleSwitchChain}>
                      Switch to {networkDisplayName}
                    </button>
                  )}

                  {/* Status message */}
                  {wrapStatus && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', textAlign: 'center', color: wrapStatus.includes('✓') ? '#22C55E' : '#E8ECF1' }}>
                      {wrapStatus}
                    </div>
                  )}

                  {/* Error message for insufficient balance */}
                  {wrapAmount && parseFloat(wrapAmount) > 0 && !isWrapUnwrapValid && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', textAlign: 'center', color: '#EF4444' }}>
                      Insufficient balance
                    </div>
                  )}
                </div>
              </div>
            )}

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
                      ? `${formattedUsdcBalance} ${tokenSymbol}`
                      : `••••• ${tokenSymbol}`}
                  </button>
                </span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Amount:</span>
                <span className="payment-value">{amount} {tokenSymbol}</span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Network:</span>
                <span className="payment-value">{networkDisplayName}</span>
              </div>
            </div>

            {isCorrectChain ? (
              <button
                className="button button-primary"
                onClick={handlePayment}
                disabled={isPaying}
              >
                {isPaying ? <Spinner /> : "Pay now"}
              </button>
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
