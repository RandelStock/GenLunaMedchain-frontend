import React, { useEffect, useState } from 'react';
import { 
  useAddress, 
  useConnectionStatus, 
  useNetworkMismatch,
  useChainId,
  useContract
} from "@thirdweb-dev/react";
import { useRole } from "./auth/RoleProvider";
import { ethers } from 'ethers';
import contractABI from '../abi/ContractABI.json';

function WalletDebug() {
  const address = useAddress();
  const connectionStatus = useConnectionStatus();
  const isMismatch = useNetworkMismatch();
  const chainId = useChainId();
  const { userRole, isAdmin, refreshRole } = useRole();
  const [blockchainTest, setBlockchainTest] = useState(null);
  const [contractTest, setContractTest] = useState(null);

  const { contract } = useContract(
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    contractABI.abi
  );

  // Test if blockchain is accessible
  useEffect(() => {
    const testBlockchain = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        setBlockchainTest({
          success: true,
          chainId: network.chainId,
          blockNumber
        });
      } catch (err) {
        setBlockchainTest({
          success: false,
          error: err.message
        });
      }
    };
    testBlockchain();
  }, []);

  // Test contract role check
  const testContractRole = async () => {
    if (!contract || !address) {
      alert('Contract or address not available!');
      return;
    }

    try {
      const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const checksumAddr = ethers.utils.getAddress(address);
      
      console.log('🧪 Testing contract.call...');
      const result = await contract.call("hasRole", [DEFAULT_ADMIN_ROLE, checksumAddr]);
      
      setContractTest({
        success: true,
        isAdmin: result,
        method: 'contract.call'
      });
      
      alert(`Role check result: ${result ? '✅ IS ADMIN' : '❌ NOT ADMIN'}`);
    } catch (err) {
      console.error('❌ Contract test failed:', err);
      setContractTest({
        success: false,
        error: err.message
      });
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="fixed top-0 right-0 m-4 p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg shadow-xl z-50 max-w-md text-xs">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">🔍 Debug Panel</h3>
        <button 
          onClick={() => document.getElementById('debug-panel').remove()}
          className="text-red-600 hover:text-red-800 font-bold"
        >
          ✕
        </button>
      </div>

      <div id="debug-panel" className="space-y-2">
        {/* Connection Status */}
        <div className="bg-white p-2 rounded border">
          <div className="font-semibold mb-1">📡 Connection Status</div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={connectionStatus === 'connected' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {connectionStatus.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Chain ID:</span>
            <span className={chainId === 31337 ? 'text-green-600' : 'text-red-600'}>
              {chainId || '❌ None'} {chainId === 31337 && '✅'}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Network Mismatch:</span>
            <span className={isMismatch ? 'text-red-600' : 'text-green-600'}>
              {isMismatch ? '❌ YES' : '✅ NO'}
            </span>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="bg-white p-2 rounded border">
          <div className="font-semibold mb-1">👛 Wallet Info</div>
          <div className="flex justify-between">
            <span>Address:</span>
            <span className={address ? 'text-green-600' : 'text-red-600'}>
              {address ? '✅ Connected' : '❌ Not Connected'}
            </span>
          </div>
          {address && (
            <>
              <div className="text-[10px] mt-1 break-all bg-gray-50 p-1 rounded">
                {address}
              </div>
              <div className="flex justify-between mt-1">
                <span>Is Admin Address:</span>
                <span className={address.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' ? 'text-green-600' : 'text-red-600'}>
                  {address.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' ? '✅ YES' : '❌ NO'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Role Info */}
        <div className="bg-white p-2 rounded border">
          <div className="font-semibold mb-1">🎭 Role Status</div>
          <div className="flex justify-between">
            <span>Current Role:</span>
            <span className={isAdmin ? 'text-green-600 font-bold' : 'text-blue-600'}>
              {userRole}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Is Admin:</span>
            <span className={isAdmin ? 'text-green-600 font-bold' : 'text-red-600'}>
              {isAdmin ? '✅ YES' : '❌ NO'}
            </span>
          </div>
          <button
            onClick={() => refreshRole()}
            className="mt-2 w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
          >
            🔄 Refresh Role
          </button>
        </div>

        {/* Blockchain Test */}
        <div className="bg-white p-2 rounded border">
          <div className="font-semibold mb-1">⛓️ Blockchain Status</div>
          {blockchainTest === null ? (
            <span className="text-gray-500">Testing...</span>
          ) : blockchainTest.success ? (
            <>
              <div className="flex justify-between">
                <span>Hardhat Node:</span>
                <span className="text-green-600">✅ Running</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Chain ID:</span>
                <span>{blockchainTest.chainId}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Block Number:</span>
                <span>{blockchainTest.blockNumber}</span>
              </div>
            </>
          ) : (
            <div className="text-red-600">
              ❌ Cannot connect to Hardhat
              <div className="text-[10px] mt-1">{blockchainTest.error}</div>
            </div>
          )}
        </div>

        {/* Contract Test */}
        <div className="bg-white p-2 rounded border">
          <div className="font-semibold mb-1">📄 Contract Status</div>
          <div className="flex justify-between">
            <span>Contract Loaded:</span>
            <span className={contract ? 'text-green-600' : 'text-red-600'}>
              {contract ? '✅ YES' : '❌ NO'}
            </span>
          </div>
          <button
            onClick={testContractRole}
            disabled={!contract || !address}
            className={`mt-2 w-full px-2 py-1 rounded text-xs ${
              contract && address 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            🧪 Test Role Check
          </button>
          {contractTest && (
            <div className={`mt-2 p-1 rounded text-[10px] ${contractTest.success ? 'bg-green-50' : 'bg-red-50'}`}>
              {contractTest.success ? (
                <>
                  <div>✅ Contract call successful</div>
                  <div>Is Admin: {contractTest.isAdmin ? '✅ YES' : '❌ NO'}</div>
                </>
              ) : (
                <div className="text-red-600">❌ {contractTest.error}</div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-2 rounded border border-blue-300">
          <div className="font-semibold mb-1">📝 Checklist</div>
          <ul className="space-y-1 text-[10px]">
            <li className={blockchainTest?.success ? 'text-green-600' : 'text-red-600'}>
              {blockchainTest?.success ? '✅' : '❌'} Hardhat node running
            </li>
            <li className={address ? 'text-green-600' : 'text-red-600'}>
              {address ? '✅' : '❌'} Wallet connected
            </li>
            <li className={chainId === 31337 ? 'text-green-600' : 'text-red-600'}>
              {chainId === 31337 ? '✅' : '❌'} On LocalHost network (31337)
            </li>
            <li className={address?.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' ? 'text-green-600' : 'text-orange-600'}>
              {address?.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' ? '✅' : '⚠️'} Using admin account
            </li>
            <li className={contract ? 'text-green-600' : 'text-red-600'}>
              {contract ? '✅' : '❌'} Contract loaded
            </li>
            <li className={isAdmin ? 'text-green-600' : 'text-red-600'}>
              {isAdmin ? '✅' : '❌'} Admin role detected
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default WalletDebug;