import { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from '../config';
import api from '../../api';

const API_URL = api.defaults.baseURL;
const CONTRACT_ABI = [
  "function storeReceiptHash(uint256 _receiptId, bytes32 _dataHash) public",
  "function updateReceiptHash(uint256 _receiptId, bytes32 _newDataHash) public",
  "function deleteReceiptHash(uint256 _receiptId) public",
  "function getReceiptHash(uint256 _receiptId) public view returns (bytes32, address, uint256, bool)",
  "event ReceiptHashStored(uint256 indexed receiptId, bytes32 dataHash, address indexed addedBy, uint256 timestamp)",
  "event ReceiptHashUpdated(uint256 indexed receiptId, bytes32 oldHash, bytes32 newHash, address indexed updatedBy, uint256 timestamp)",
  "event ReceiptHashDeleted(uint256 indexed receiptId, address indexed deletedBy, uint256 timestamp)"
];

export const useMedicineRelease = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==================== BLOCKCHAIN FUNCTIONS WITH RETRY LOGIC ====================
  
  // 🚀 ENHANCED: storeReleaseOnBlockchain with retry logic
  const storeReleaseOnBlockchain = async (releaseId, releaseData) => {
    if (releaseId === undefined || releaseId === null) {
      throw new Error('Invalid release id for blockchain sync');
    }
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Create hash of the release data
    const dataString = JSON.stringify({
      medicine_id: releaseData.medicine_id,
      stock_id: releaseData.stock_id,
      resident_name: releaseData.resident_name,
      quantity_released: releaseData.quantity_released,
      date_released: releaseData.date_released,
      concern: releaseData.concern
    });

    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));

    console.log('🔍 Storing receipt on blockchain:', { releaseId, dataHash });

    // 🚀 RETRY LOGIC
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Attempt ${attempt}/${maxRetries}: Sending receipt transaction...`);
        
        // Add delay between retries
        if (attempt > 1) {
          console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Estimate gas first
        const gasEstimate = await contract.estimateGas.storeReceiptHash(releaseId, dataHash);
        console.log('  Gas estimate:', gasEstimate.toString());

        // Send transaction with gas buffer
        const tx = await contract.storeReceiptHash(releaseId, dataHash, {
          gasLimit: Math.floor(gasEstimate.toNumber() * 1.3) // 30% buffer
        });
        
        console.log('⏳ Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed:', receipt.transactionHash);

        return {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          dataHash: dataHash
        };

      } catch (txError) {
        lastError = txError;
        console.warn(`❌ Attempt ${attempt} failed:`, txError.message);
        
        // Check if user cancelled (don't retry)
        if (txError.message?.includes('user rejected') || 
            txError.message?.includes('User denied') ||
            txError.code === 4001) {
          throw new Error('Transaction cancelled by user');
        }
        
        // Check if it's a transient error
        const isTransientError = 
          txError.message?.includes('Internal JSON-RPC error') ||
          txError.message?.includes('timeout') ||
          txError.message?.includes('network') ||
          txError.message?.includes('nonce') ||
          txError.code === -32603;
        
        // If not transient and first attempt, don't retry
        if (!isTransientError && attempt === 1) {
          throw txError;
        }
        
        // If last attempt, throw
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Continue to next retry
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  };

  // 🚀 ENHANCED: updateReleaseOnBlockchain with retry logic
  const updateReleaseOnBlockchain = async (releaseId, releaseData) => {
    if (releaseId === undefined || releaseId === null) {
      throw new Error('Invalid release id for blockchain sync');
    }
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const dataString = JSON.stringify({
      medicine_id: releaseData.medicine_id,
      stock_id: releaseData.stock_id,
      resident_name: releaseData.resident_name,
      quantity_released: releaseData.quantity_released,
      date_released: releaseData.date_released,
      concern: releaseData.concern
    });

    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
    
    // Check if receipt exists; if not, store instead of update
    let exists = false;
    try {
      const [, , , _exists] = await contract.getReceiptHash(releaseId);
      exists = _exists;
    } catch (_) {
      exists = false;
    }

    console.log(`🔍 ${exists ? 'Updating' : 'Storing'} receipt on blockchain:`, { releaseId, dataHash });

    // 🚀 RETRY LOGIC
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Attempt ${attempt}/${maxRetries}: Sending transaction...`);
        
        if (attempt > 1) {
          console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const tx = exists
          ? await contract.updateReceiptHash(releaseId, dataHash, { gasLimit: 200000 })
          : await contract.storeReceiptHash(releaseId, dataHash, { gasLimit: 200000 });

        console.log('⏳ Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed:', receipt.transactionHash);

        return {
          transactionHash: receipt.transactionHash,
          dataHash,
          operation: exists ? 'updated' : 'stored'
        };

      } catch (txError) {
        lastError = txError;
        console.warn(`❌ Attempt ${attempt} failed:`, txError.message);
        
        if (txError.message?.includes('user rejected') || 
            txError.message?.includes('User denied') ||
            txError.code === 4001) {
          throw new Error('Transaction cancelled by user');
        }
        
        const isTransientError = 
          txError.message?.includes('Internal JSON-RPC error') ||
          txError.message?.includes('timeout') ||
          txError.message?.includes('network') ||
          txError.message?.includes('nonce') ||
          txError.code === -32603;
        
        if (!isTransientError && attempt === 1) {
          throw txError;
        }
        
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  };

  // 🚀 ENHANCED: deleteReleaseOnBlockchain with retry logic
  const deleteReleaseOnBlockchain = async (releaseId) => {
    if (releaseId === undefined || releaseId === null) {
      throw new Error('Invalid release id for blockchain delete');
    }
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // Check existence to avoid revert
    let exists = false;
    try {
      const [, , , _exists] = await contract.getReceiptHash(releaseId);
      exists = _exists;
    } catch (_) {
      exists = false;
    }

    if (!exists) {
      return { skipped: true, reason: 'receipt_not_found' };
    }

    console.log('🔍 Deleting receipt from blockchain:', { releaseId });

    // 🚀 RETRY LOGIC
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Attempt ${attempt}/${maxRetries}: Deleting receipt...`);
        
        if (attempt > 1) {
          console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const tx = await contract.deleteReceiptHash(releaseId, { gasLimit: 200000 });
        console.log('⏳ Transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed:', receipt.transactionHash);
        
        return { transactionHash: receipt.transactionHash, deleted: true };

      } catch (txError) {
        lastError = txError;
        console.warn(`❌ Attempt ${attempt} failed:`, txError.message);
        
        if (txError.message?.includes('user rejected') || 
            txError.message?.includes('User denied') ||
            txError.code === 4001) {
          throw new Error('Transaction cancelled by user');
        }
        
        const isTransientError = 
          txError.message?.includes('Internal JSON-RPC error') ||
          txError.message?.includes('timeout') ||
          txError.message?.includes('network') ||
          txError.message?.includes('nonce') ||
          txError.code === -32603;
        
        if (!isTransientError && attempt === 1) {
          throw txError;
        }
        
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  };

  const verifyReleaseOnBlockchain = async (releaseId, releaseData) => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const [storedHash, addedBy, timestamp, exists] = await contract.getReceiptHash(releaseId);

    if (!exists) {
      return { verified: false, message: 'Release not found on blockchain' };
    }

    // Recreate hash from data
    const dataString = JSON.stringify({
      medicine_id: releaseData.medicine_id,
      stock_id: releaseData.stock_id,
      resident_name: releaseData.resident_name,
      quantity_released: releaseData.quantity_released,
      date_released: releaseData.date_released,
      concern: releaseData.concern
    });

    const calculatedHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));

    return {
      verified: storedHash === calculatedHash,
      storedHash,
      calculatedHash,
      addedBy,
      timestamp: new Date(Number(timestamp) * 1000).toISOString()
    };
  };

  // ==================== API FUNCTIONS ====================

  // Get all releases with filters
  const getReleases = async (filters = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_URL}/releases?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch releases');
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get single release by ID
  const getReleaseById = async (releaseId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/releases/${releaseId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch release');
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create new medicine release WITH blockchain sync
  const createRelease = async (releaseData) => {
    try {
      setLoading(true);
      setError(null);

      // Get wallet address through MetaMask confirmation
      const walletAddress = await confirmWithMetaMask();

      // Create release in database
      const response = await api.post('/releases', releaseData, {
        headers: {
          'x-wallet-address': walletAddress
        }
      });

      const release = response.data?.data || response.data;
      console.log('Release created:', release);
      
      if (!release || release.release_id === undefined || release.release_id === null) {
        throw new Error('Invalid create release response: missing release_id');
      }
      
      // Optional chain sync: only for stock with cost > 0
      let blockchainResult = null;
      try {
        const stockResp = await api.get(`/stocks/${release.stock_id}`);
        const stock = stockResp.data?.data || stockResp.data?.stock || stockResp.data;
        const unitCost = parseFloat(stock?.unit_cost || 0);
        
        if (unitCost > 0) {
          // Store on-chain with retry logic
          blockchainResult = await storeReleaseOnBlockchain(release.release_id, {
            medicine_id: release.medicine_id,
            stock_id: release.stock_id,
            resident_name: release.resident_name,
            quantity_released: release.quantity_released,
            date_released: release.date_released,
            concern: release.concern
          });

          // Patch backend with blockchain info
          await api.patch(`/releases/${release.release_id}`, {
            blockchain_hash: blockchainResult?.dataHash || null,
            blockchain_tx_hash: blockchainResult?.transactionHash || null
          }, {
            headers: { 'x-wallet-address': walletAddress }
          });
        }
      } catch (chainErr) {
        console.error('Blockchain sync failed on create:', chainErr);
        
        // Provide user-friendly error message
        let errorMsg = chainErr.message || 'Unknown blockchain error';
        if (chainErr.message?.includes('cancelled by user')) {
          errorMsg = 'Transaction cancelled by user';
        } else if (chainErr.message?.includes('Internal JSON-RPC error')) {
          errorMsg = 'Network congestion - blockchain sync failed but release was saved to database';
        }
        
        return {
          success: true,
          release,
          blockchain: null,
          blockchainError: errorMsg,
          message: 'Release created but blockchain sync failed'
        };
      }

      return {
        success: true,
        release,
        blockchain: blockchainResult,
        message: blockchainResult ? 'Release created and synced on-chain' : 'Release created (no blockchain sync required)'
      };
    } catch (err) {
      console.error('Create release error:', err);
      setError(err.message || 'Failed to create release');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to confirm with MetaMask
  const confirmWithMetaMask = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      return await signer.getAddress();
    } catch (error) {
      console.error("MetaMask confirmation failed:", error);
      throw new Error('MetaMask confirmation failed. Please try again.');
    }
  };

  // Update existing release with retry logic
  const updateRelease = async (releaseId, updateData) => {
    try {
      setLoading(true);
      setError(null);

      const walletAddress = await confirmWithMetaMask();
       
      // Update in the backend first
      const response = await api.put(`/releases/${releaseId}`, updateData, {
        headers: {
          'x-wallet-address': walletAddress
        }
      });

      const updated = response.data?.data || response.data;

      // Try sync on-chain with retry logic
      let blockchainResult = null;
      try {
        blockchainResult = await updateReleaseOnBlockchain(releaseId, updateData);
        
        // Patch blockchain info back to backend
        await api.patch(`/releases/${releaseId}`, {
          blockchain_hash: blockchainResult?.dataHash || null,
          blockchain_tx_hash: blockchainResult?.transactionHash || null
        }, {
          headers: { 'x-wallet-address': walletAddress }
        });
      } catch (chainErr) {
        console.warn('Blockchain sync failed on update:', chainErr);
      }

      return {
        success: true,
        release: updated,
        blockchain: blockchainResult,
        message: blockchainResult ? 'Updated and synced on-chain' : 'Updated in database; blockchain sync skipped or failed'
      };
    } catch (err) {
      console.error("Update release error:", err);
      setError(err.message || 'Failed to update release');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateReleaseBlockchainInfo = async (releaseId, blockchainData) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      const response = await fetch(`${API_URL}/releases/${releaseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-wallet-address': walletAddress
        },
        body: JSON.stringify(blockchainData)
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update release blockchain info');
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete release with retry logic
  const deleteRelease = async (releaseId) => {
    try {
      setLoading(true);
      setError(null);

      const walletAddress = await confirmWithMetaMask();

      // First attempt on-chain delete with retry logic
      let blockchain = null;
      try {
        blockchain = await deleteReleaseOnBlockchain(releaseId);
      } catch (chainErr) {
        console.warn('Blockchain delete failed:', chainErr);
        blockchain = { error: chainErr?.message || 'chain_delete_failed' };
      }

      // Then delete the record in backend
      const response = await api.delete(`/releases/${releaseId}`, {
        headers: {
          'x-wallet-address': walletAddress
        }
      });

      return {
        success: true,
        message: 'Release deleted successfully.',
        data: response.data,
        blockchain
      };
    } catch (err) {
      console.error("Delete release error:", err);
      setError(err.message || 'Failed to delete release');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify release on blockchain
  const verifyRelease = async (releaseId, releaseData) => {
    try {
      setLoading(true);
      const result = await verifyReleaseOnBlockchain(releaseId, releaseData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get available stock for a medicine
  const getAvailableStock = async (medicineId) => {
    try {
      const response = await fetch(`${API_URL}/stocks/available/${medicineId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to fetch available stock');
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    loading,
    error,
    getReleases,
    getReleaseById,
    createRelease,
    updateRelease,
    deleteRelease,
    verifyRelease,
    getAvailableStock,
    storeReleaseOnBlockchain,
    verifyReleaseOnBlockchain,
    updateReleaseOnBlockchain,
    deleteReleaseOnBlockchain,
    updateReleaseBlockchainInfo
  };
};