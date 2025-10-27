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
    const dataString = JSON.stringify({
      medicine_id: releaseData.medicine_id,
      stock_id: releaseData.stock_id,
      resident_name: releaseData.resident_name,
      quantity_released: releaseData.quantity_released,
      date_released: releaseData.date_released,
      concern: releaseData.concern
    });

    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));

    console.log('Sending transaction to blockchain...', { releaseId, dataHash });
    const tx = await contract.storeReceiptHash(releaseId, dataHash);
    
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    
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
    const tx = await contract.updateReceiptHash(releaseId, dataHash);
    const receipt = await tx.wait();
    return {
      transactionHash: receipt.transactionHash,
      dataHash
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
    const tx = await contract.deleteReceiptHash(releaseId);
    const receipt = await tx.wait();
    return { transactionHash: receipt.transactionHash };
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
      
      return {
        success: true,
        release,
        message: 'Release created successfully'
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
      
      // Use the shared API client
      const response = await api.put(`/releases/${releaseId}`, updateData, {
        headers: {
          'x-wallet-address': walletAddress
        }
      });

      return response.data;
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

      // Delete the record using the shared API client
      const response = await api.delete(`/releases/${releaseId}`, {
        headers: {
          'x-wallet-address': walletAddress
        }
      });

      return {
        success: true,
        message: 'Release deleted. Original blockchain record remains immutable.',
        data: response.data
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