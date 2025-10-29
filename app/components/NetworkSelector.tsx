'use client';

import { useSwitchChain, useAccount } from 'wagmi';
import { base, baseSepolia, bsc, bscTestnet } from 'viem/chains';
import { useState, useEffect } from 'react';

const networkMap: Record<string, typeof base> = {
  'base': base,
  'base-sepolia': baseSepolia,
  'bsc': bsc,
  'bsc-testnet': bscTestnet,
};

const networkDisplayNames: Record<string, string> = {
  'base': 'Base',
  'base-sepolia': 'Base Sepolia',
  'bsc': 'BNB Smart Chain',
  'bsc-testnet': 'BSC Testnet',
};

export function NetworkSelector() {
  const { switchChainAsync } = useSwitchChain();
  const { chain: connectedChain, isConnected } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [networks, setNetworks] = useState<string[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');

  useEffect(() => {
    // Parse available networks from env
    const networksEnv = process.env.NEXT_PUBLIC_NETWORKS || 'base-sepolia';
    const networkList = networksEnv.split(',').map(n => n.trim());
    setNetworks(networkList);

    // Set initial selection from connected wallet or first network
    if (isConnected && connectedChain) {
      const connectedNetworkKey = Object.keys(networkMap).find(
        key => networkMap[key].id === connectedChain.id
      );
      if (connectedNetworkKey) {
        setSelectedNetwork(connectedNetworkKey);
      }
    } else if (networkList.length > 0) {
      setSelectedNetwork(networkList[0]);
    }
  }, [isConnected, connectedChain]);

  const handleNetworkSelect = async (networkKey: string) => {
    setSelectedNetwork(networkKey);
    setIsOpen(false);

    // If wallet is connected, switch the network
    if (isConnected && switchChainAsync) {
      const targetChain = networkMap[networkKey];
      if (targetChain) {
        try {
          await switchChainAsync({ chainId: targetChain.id });
        } catch (error) {
          console.error('Failed to switch network:', error);
        }
      }
    }
  };

  if (networks.length <= 1) {
    // Don't show selector if only one network configured
    return null;
  }

  const currentDisplayName = networkDisplayNames[selectedNetwork] || selectedNetwork;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.75rem 1rem',
          backgroundColor: '#1A2130',
          color: '#E8ECF1',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background-color 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#22303F';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#1A2130';
        }}
      >
        <span>{currentDisplayName}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            flexShrink: 0,
            marginLeft: '0.5rem',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms',
          }}
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            backgroundColor: '#1A2130',
            border: '1px solid #2D3748',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            zIndex: 10,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          }}
        >
          {networks.map((networkKey) => (
            <button
              key={networkKey}
              onClick={() => handleNetworkSelect(networkKey)}
              type="button"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: selectedNetwork === networkKey ? '#22303F' : 'transparent',
                color: '#E8ECF1',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: selectedNetwork === networkKey ? '600' : '400',
                transition: 'background-color 150ms',
              }}
              onMouseEnter={(e) => {
                if (selectedNetwork !== networkKey) {
                  e.currentTarget.style.backgroundColor = '#1E2937';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedNetwork !== networkKey) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {networkDisplayNames[networkKey] || networkKey}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
