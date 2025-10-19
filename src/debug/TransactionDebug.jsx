// Add this debug component to your app temporarily
// components/debug/TransactionDebug.jsx
import { useAddress, useChainId, useContract, useSigner } from "@thirdweb-dev/react";
import { useState } from "react";

const TransactionDebug = () => {
  const address = useAddress();
  const chainId = useChainId();
  const signer = useSigner();
  const { contract } = useContract("YOUR_CONTRACT_ADDRESS"); // Replace with actual address
  const [debugInfo, setDebugInfo] = useState({});

  const runDebugTest = async () => {
    try {
      // Check what MetaMask thinks the network is
      const networkInfo = await window.ethereum.request({ method: 'eth_chainId' });
      const networkVersion = await window.ethereum.request({ method: 'net_version' });
      
      // Check signer network
      const signerNetwork = signer ? await signer.getChainId() : null;
      
      // Check contract connection
      const contractNetwork = contract ? await contract.getChainId() : null;
      
      setDebugInfo({
        walletChainId: chainId,
        metamaskChainId: parseInt(networkInfo, 16),
        networkVersion: networkVersion,
        signerChainId: signerNetwork,
        contractChainId: contractNetwork,
        expectedChainId: 31337,
        address: address,
        contractLoaded: !!contract,
        signerLoaded: !!signer,
      });
    } catch (error) {
      console.error('Debug failed:', error);
      setDebugInfo({ error: error.message });
    }
  };

  const testSimpleTransaction = async () => {
    try {
      // Test a simple transaction to see where it goes
      console.log('Testing transaction routing...');
      
      if (!signer) {
        alert('No signer available');
        return;
      }

      // Just get gas price to see which network we're hitting
      const gasPrice = await signer.getGasPrice();
      const balance = await signer.getBalance();
      
      console.log('Transaction test results:', {
        gasPrice: gasPrice.toString(),
        balance: balance.toString(),
        chainId: await signer.getChainId()
      });
      
      alert(`Gas price: ${gasPrice.toString()} (should be very low for local)`);
      
    } catch (error) {
      console.error('Transaction test failed:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #333',
      padding: '15px',
      borderRadius: '8px',
      maxWidth: '400px',
      fontSize: '12px',
      zIndex: 10000
    }}>
      <h3>🔍 Transaction Debug</h3>
      
      <button onClick={runDebugTest} style={{
        background: '#007bff',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        marginBottom: '10px',
        borderRadius: '3px',
        cursor: 'pointer'
      }}>
        Run Debug Check
      </button>

      <button onClick={testSimpleTransaction} style={{
        background: '#28a745',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        marginBottom: '10px',
        marginLeft: '5px',
        borderRadius: '3px',
        cursor: 'pointer'
      }}>
        Test Transaction
      </button>

      {Object.keys(debugInfo).length > 0 && (
        <div>
          <h4>Debug Results:</h4>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '8px', 
            borderRadius: '3px',
            fontSize: '11px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        <p>Expected Chain ID: 31337</p>
        <p>Current Chain ID: {chainId}</p>
        <p>Status: {chainId === 31337 ? '✅ Correct' : '❌ Wrong'}</p>
      </div>
    </div>
  );
};

export default TransactionDebug;