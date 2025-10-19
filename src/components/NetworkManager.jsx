// components/NetworkManager.jsx
import React, { useEffect, useState } from 'react';
import { useNetwork, useAddress } from "@thirdweb-dev/react";

const NetworkManager = () => {
  const address = useAddress();
  const [network] = useNetwork();
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const [currentChain, setCurrentChain] = useState(null);

  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum && address) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const chainIdNum = parseInt(chainId, 16);
          setCurrentChain(chainIdNum);
          
          // Show warning if not on localhost (31337)
          if (chainIdNum !== 31337) {
            setShowNetworkWarning(true);
            console.warn('Wrong network detected:', {
              current: chainIdNum,
              expected: 31337,
              networkName: getNetworkName(chainIdNum)
            });
          } else {
            setShowNetworkWarning(false);
          }
        } catch (error) {
          console.error('Failed to get network:', error);
        }
      }
    };

    // Initial check
    checkNetwork();

    // Listen for network changes
    if (window.ethereum) {
      const handleChainChanged = (chainId) => {
        const chainIdNum = parseInt(chainId, 16);
        setCurrentChain(chainIdNum);
        
        if (chainIdNum !== 31337) {
          setShowNetworkWarning(true);
        } else {
          setShowNetworkWarning(false);
        }
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [address]);

  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      3: 'Ropsten',
      4: 'Rinkeby',
      5: 'Goerli',
      137: 'Polygon',
      31337: 'Hardhat Local',
      1337: 'Ganache Local'
    };
    return networks[chainId] || `Unknown (${chainId})`;
  };

  const switchToLocalhost = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed!');
      return;
    }

    try {
      // First try to switch
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 in hex
      });
    } catch (switchError) {
      console.log('Switch failed:', switchError);
      
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7a69',
              chainName: 'Hardhat Local',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['http://127.0.0.1:8545'],
              blockExplorerUrls: null,
            }],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          alert('Failed to add localhost network. Please add it manually in MetaMask.');
        }
      } else {
        console.error('Network switch failed:', switchError);
        alert('Failed to switch network. Please switch manually in MetaMask.');
      }
    }
  };

  // Don't show anything if wallet is not connected
  if (!address) return null;

  // Show network warning banner
  if (showNetworkWarning) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 mx-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Wrong Network Detected
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  You're connected to <strong>{getNetworkName(currentChain)}</strong> but this app requires <strong>Hardhat Local</strong>.
                </p>
                <p className="mt-1">Please switch to the localhost network to use all features.</p>
              </div>
            </div>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={switchToLocalhost}
                className="bg-red-100 rounded-md p-2 inline-flex items-center text-red-500 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <span className="text-sm font-medium">Switch Network</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success message when on correct network
  return (
    <div className="bg-green-50 border-l-4 border-green-400 p-2 mx-4 rounded-lg mb-2">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-green-700">
            Connected to <strong>Hardhat Local</strong> network ✓
          </p>
        </div>
      </div>
    </div>
  );
};

export default NetworkManager;