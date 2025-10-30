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
  const testnet = x402.testnet ?? true;

  // Parse configured networks and amounts from env
  const networksEnv = x402.networksEnv || 'base-sepolia';
  const amountsEnv = x402.amountsEnv || '0.01';
  const networks = networksEnv.split(',').map(n => n.trim());
  const amounts = amountsEnv.split(',').map(a => a.trim());

  // Map chainId to network key
  const getNetworkFromChainId = (chainId: number | undefined): string => {
    if (!chainId) return networks[0] || 'base-sepolia';

    const chainToNetworkMap: Record<number, string> = {
      84532: 'base-sepolia',
      8453: 'base',
      97: 'bsc-testnet',
      56: 'bsc',
    };

    return chainToNetworkMap[chainId] || networks[0] || 'base-sepolia';
  };

  // Determine active network from connected chain
  const network = isConnected ? getNetworkFromChainId(connectedChainId) : networks[0] || 'base-sepolia';

  // Get amount for current network
  const networkIndex = networks.indexOf(network);
  const amount = networkIndex >= 0 && amounts[networkIndex] ? parseFloat(amounts[networkIndex]) : (amounts[0] ? parseFloat(amounts[0]) : 0.01);

  // First, get all payment requirements without filtering by network
  const allPaymentRequirements = x402 ? [x402.paymentRequirements].flat()[0] : null;

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
  // IMPORTANT: Don't use selectPaymentRequirements because it returns the first requirement
  // if no match is found. We need null when there's no match so we can fall back to chainConfig.
  const allRequirements = x402 ? [x402.paymentRequirements].flat() : [];
  const paymentRequirements = allRequirements.find(req => req.network === network) || null;

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

  // Get token symbol from payment requirements or default to USDC
  const getTokenSymbol = (): string => {
    // First check payment requirements
    const extra = paymentRequirements?.extra;
    if (extra && typeof extra === "object" && "symbol" in extra) {
      const symbol = (extra as { symbol?: string }).symbol;
      if (symbol) return symbol;
    }

    // If no payment requirements for this network, return default USDC
    return "USDC";
  };

  const networkDisplayName = getNetworkDisplayName(network);
  const tokenSymbol = getTokenSymbol();

  // Get token decimals from payment requirements or default to 6
  const getTokenDecimals = (): number => {
    const extra = paymentRequirements?.extra;
    if (extra && typeof extra === "object" && "decimals" in extra) {
      return (extra as { decimals?: number }).decimals || 6;
    }
    return 6; // Default to 6 decimals (USDC standard)
  };

  const tokenDecimals = getTokenDecimals();

  // Get token address from payment requirements or from chainConfig
  const getTokenAddress = (): Address | undefined => {
    // First try payment requirements
    if (paymentRequirements?.asset) {
      return paymentRequirements.asset as Address;
    }

    // Fallback to chainConfig for default USDC address
    // IMPORTANT: chainConfig uses chain IDs as keys (e.g., "8453"), not network names (e.g., "base")!
    const chainConfig = x402?.config?.chainConfig;
    if (chainConfig && connectedChainId) {
      const chainIdKey = connectedChainId.toString();
      if (chainConfig[chainIdKey]) {
        return chainConfig[chainIdKey].usdcAddress as Address;
      }
    }

    return undefined;
  };

  const tokenAddress = getTokenAddress();

  const publicClient = createPublicClient({
    chain: paymentChain,
    transport: http(),
  }).extend(publicActions);

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

  const checkNativeBalance = useCallback(async () => {
    if (!address) {
      return;
    }

    try {
      const balance = await publicClient.getBalance({ address });
      const formattedBalance = formatUnits(balance, 18);
      setNativeBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching native balance:", error);
      setNativeBalance("0");
    }
  }, [address, publicClient]);

  useEffect(() => {
    if (address) {
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
      const validPaymentRequirements = ensureValidAmount(paymentRequirements, amount);
      // Use x402Version from server's initial 402 response instead of hardcoded 1
      const serverVersion = x402.x402Version || 1;
      const initialPayment = await exact.evm.createPayment(
        walletClient,
        serverVersion,
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
  }, [address, x402, paymentRequirements, amount, network, tokenSymbol, networkDisplayName, publicClient, paymentChain, handleSwitchChain, handleSuccessfulResponse, wagmiWalletClient, tokenAddress]);

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

  // Get explorer URL for token contract
  const getTokenExplorerUrl = (): string | null => {
    if (!tokenAddress) return null;

    const explorerMap: Record<string, string> = {
      "base": `https://basescan.org/token/${tokenAddress}`,
      "base-sepolia": `https://sepolia.basescan.org/token/${tokenAddress}`,
      "bsc": `https://bscscan.com/token/${tokenAddress}`,
      "bsc-testnet": `https://testnet.bscscan.com/token/${tokenAddress}`,
    };

    return explorerMap[network] || null;
  };

  const tokenExplorerUrl = getTokenExplorerUrl();

  // Validation for wrap/unwrap button
  const canWrap = wrapAmount && parseFloat(wrapAmount) > 0 && parseFloat(wrapAmount) <= parseFloat(nativeBalance || "0");
  const canUnwrap = wrapAmount && parseFloat(wrapAmount) > 0 && parseFloat(wrapAmount) <= parseFloat(formattedUsdcBalance || "0");
  const isWrapUnwrapValid = isWrapMode ? canWrap : canUnwrap;

  // Only check if x402 exists - paymentRequirements can be null (will fallback to chainConfig)
  if (!x402) {
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
            <p style={{ color: '#E8ECF1', marginTop: '0.75rem' }}>Your payment has been processed successfully. You now have access to the protected content.</p>
          </div>
        ) : (
          <>
            <p style={{ color: '#E8ECF1' }}>
              {(() => {
                const message = customMessage || defaultMessage;
                const formattedMessage = message
                  .replace('{amount}', String(amount))
                  .replace('{network}', networkDisplayName);

                // Split the message by {symbol} to insert the clickable link
                const parts = formattedMessage.split('{symbol}');

                if (parts.length === 2 && tokenExplorerUrl) {
                  return (
                    <>
                      {parts[0]}
                      <a
                        href={tokenExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#2DD4FF',
                          textDecoration: 'underline',
                          cursor: 'pointer'
                        }}
                      >
                        {tokenSymbol}
                      </a>
                      {parts[1]}
                    </>
                  );
                } else {
                  return formattedMessage.replace('{symbol}', tokenSymbol);
                }
              })()}
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

      <div className="content" style={{ width: '100%', minWidth: '100%' }}>
        {!paymentSuccess && (
          <>
            <div style={{ marginTop: '2rem', width: '100%' }}>
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
                  <button
                    className="button button-primary w-full"
                    onClick={isCorrectChain ? (isWrapMode ? handleWrap : handleUnwrap) : handleSwitchChain}
                    disabled={isCorrectChain && (isWrapping || !isWrapUnwrapValid)}
                    style={{
                      minHeight: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...(isCorrectChain && isWrapping ? {
                        backgroundColor: '#9AA4B2',
                        opacity: 0.5,
                        cursor: 'not-allowed'
                      } : isCorrectChain && !isWrapUnwrapValid ? {
                        opacity: 0.5,
                        cursor: 'not-allowed'
                      } : {})
                    }}
                  >
                    {isCorrectChain ? (isWrapping ? <Spinner /> : isWrapMode ? 'Wrap' : 'Unwrap') : `Switch to ${networkDisplayName}`}
                  </button>

                  {/* Status message */}
                  {wrapStatus && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      color: wrapStatus.includes('✓') ? '#22C55E' : '#E8ECF1',
                      maxWidth: '100%',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      {wrapStatus}
                    </div>
                  )}

                  {/* Error message for insufficient balance */}
                  {wrapAmount && parseFloat(wrapAmount) > 0 && !isWrapUnwrapValid && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      color: '#EF4444',
                      maxWidth: '100%',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
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

            {/* Check if balance is sufficient */}
            {(() => {
              const hasInsufficientBalance = !hideBalance &&
                formattedUsdcBalance &&
                parseFloat(formattedUsdcBalance) < amount;

              return (
                <>
                  <button
                    className="button button-primary"
                    onClick={isCorrectChain ? handlePayment : handleSwitchChain}
                    disabled={isCorrectChain && (isPaying || hasInsufficientBalance)}
                    style={{
                      minHeight: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...(isCorrectChain && isPaying ? {
                        backgroundColor: '#9AA4B2',
                        opacity: 0.5,
                        cursor: 'not-allowed'
                      } : isCorrectChain && hasInsufficientBalance ? {
                        opacity: 0.5,
                        cursor: 'not-allowed'
                      } : {})
                    }}
                  >
                    {isCorrectChain ? (isPaying ? <Spinner /> : "Pay now") : `Switch to ${networkDisplayName}`}
                  </button>
                  {isCorrectChain && hasInsufficientBalance && (
                    <div style={{
                      marginTop: '0.75rem',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      color: '#EF4444',
                      fontFamily: 'Geist Sans, sans-serif'
                    }}>
                      <div>
                        Insufficient balance. You need {amount} {tokenSymbol} but only have {formattedUsdcBalance} {tokenSymbol}.
                      </div>
                      {showWrapUnwrap && (
                        <div style={{ marginTop: '0.5rem' }}>
                          You can use the "Wrap" function above to wrap native BNB to {tokenSymbol}.
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
