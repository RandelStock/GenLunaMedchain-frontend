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

  // ==================== BLOCKCHAIN FUNCTIONS ====================
  
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
    // include a timestamp to ensure uniqueness per-call
    const dataString = JSON.stringify({
      medicine_id: releaseData.medicine_id,
      stock_id: releaseData.stock_id,
      resident_name: releaseData.resident_name,
      quantity_released: releaseData.quantity_released,
      date_released: releaseData.date_released,
      concern: releaseData.concern,
      timestamp: Date.now()
    });

    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));

    console.log('Sending transaction to blockchain...', { releaseId, dataHash });

    if (releaseId === undefined || releaseId === null) throw new Error('Invalid releaseId');
    const parsedId = Number(releaseId);
    if (isNaN(parsedId) || parsedId < 0) throw new Error('Invalid releaseId');
    if (!/^0x[a-fA-F0-9]{64}$/.test(dataHash)) throw new Error('Invalid dataHash format');

    let tx;
    try {
      tx = await contract.storeReceiptHash(parsedId, dataHash);
      console.log('Transaction sent:', tx.hash || tx.transactionHash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        dataHash: dataHash
      };
    } catch (err) {
      console.error('storeReleaseOnBlockchain failed:', err);
      throw err;
    }
    
    console.log('Transaction confirmed:', receipt);

    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      dataHash: dataHash
    };
  };

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

    const tx = exists
      ? await contract.updateReceiptHash(releaseId, dataHash)
      : await contract.storeReceiptHash(releaseId, dataHash);

    const receipt = await tx.wait();
    return {
      transactionHash: receipt.transactionHash,
      dataHash,
      operation: exists ? 'updated' : 'stored'
    };
  };

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

    const tx = await contract.deleteReceiptHash(releaseId);
    const receipt = await tx.wait();
    return { transactionHash: receipt.transactionHash, deleted: true };
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
    // Recreate hash from data. Try both without timestamp (backwards-compatible)
    // and with timestamp information missing (current DB may not store timestamp used when generated).
    const baseDataString = JSON.stringify({
      medicine_id: releaseData.medicine_id,
      stock_id: releaseData.stock_id,
      resident_name: releaseData.resident_name,
      quantity_released: releaseData.quantity_released,
      date_released: releaseData.date_released,
      concern: releaseData.concern
    });

    const calculatedHashWithoutTs = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(baseDataString));

    // Attempt with a timestamp field if present in the passed releaseData
    const calculatedHashWithTs = (() => {
      try {
        const withTs = JSON.stringify({ ...releaseData, timestamp: releaseData.timestamp || Date.now() });
        return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(withTs));
      } catch (_) {
        return null;
      }
    })();

    const verified = storedHash === calculatedHashWithoutTs || storedHash === calculatedHashWithTs;

    return {
      verified,
      storedHash,
      calculatedHash: calculatedHashWithTs || calculatedHashWithoutTs,
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

  // Create new medicine release WITH blockchain sync (only for money ops)
  const createRelease = async (releaseData) => {
    try {
      setLoading(true);
      setError(null);

      // Get wallet address through MetaMask confirmation
      const walletAddress = await confirmWithMetaMask();

      // Create release in database using the shared API client
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
          // Store on-chain to create a receipt record
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
        console.warn('Blockchain sync failed on create:', chainErr);
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

  // Update existing release (no blockchain re-sync)
  const updateRelease = async (releaseId, updateData) => {
    try {
      setLoading(true);
      setError(null);

      // Get wallet address through MetaMask confirmation
      const walletAddress = await confirmWithMetaMask();
       
      // Update in the backend first
      const response = await api.put(`/releases/${releaseId}`, updateData, {
        headers: {
          'x-wallet-address': walletAddress
        }
      });

      const updated = response.data?.data || response.data;

      // Try sync on-chain with existence check (update or store)
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

  // Delete release - SIMPLIFIED (no duplicate blockchain store)
  const deleteRelease = async (releaseId) => {
    try {
      setLoading(true);
      setError(null);

      // Get wallet address through MetaMask confirmation
      const walletAddress = await confirmWithMetaMask();

      // First attempt on-chain delete (gracefully skip if not found)
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