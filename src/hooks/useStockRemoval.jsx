// hooks/useStockRemoval.jsx
import { useState } from "react";
import { useContract, useAddress, useSigner } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "../config";
import ContractABI from "../abi/ContractABI.json";
import api from "../../api";
import API_BASE_URL from '../config.js';

const API_URL = API_BASE_URL;

export const useStockRemoval = () => {
  const { contract, isLoading } = useContract(CONTRACT_ADDRESS, ContractABI.abi);
  const address = useAddress();
  const signer = useSigner();

  const [removals, setRemovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ======================================================
   ✅ API FUNCTIONS (PostgreSQL)
  ====================================================== */
  const getRemovals = async () => {
    try {
      const { data } = await api.get(`/removals`);
      return data?.data || data || [];
    } catch (error) {
      console.error('Error in getRemovals:', error);
      return [];
    }
  };

  const createRemoval = async (removalData) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: json } = await api.post(`/removals`, removalData);
      console.log('Create removal response:', json);
      
      const savedRemoval = json.data || json;
      
      console.log('Extracted removal:', savedRemoval);
      console.log('Removal ID:', savedRemoval.removal_id);
      
      if (!savedRemoval.removal_id) {
        throw new Error('No removal_id returned from server');
      }
      
      setRemovals((prev) => [...prev, savedRemoval]);
      return savedRemoval;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRemovalBlockchainInfo = async (removalId, blockchainData) => {
    try {
      const { data: json } = await api.patch(`/removals/${removalId}/blockchain`, blockchainData);
      const updated = json.data || json;
      
      setRemovals((prev) =>
        prev.map((r) => (r.removal_id === removalId ? updated : r))
      );
      
      return updated;
    } catch (err) {
      console.error("Failed to update blockchain info:", err);
    }
  };

  const deleteRemoval = async (removalId) => {
    try {
      setLoading(true);
      await api.delete(`/removals/${removalId}`);
      setRemovals((prev) => prev.filter((r) => r.removal_id !== removalId));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
   ✅ BLOCKCHAIN FUNCTIONS WITH RETRY LOGIC
  ====================================================== */
  const generateRemovalHash = (removalData) => {
    const dataString = JSON.stringify({
      removal_id: removalData.removal_id,
      medicine_id: removalData.medicine_id,
      stock_id: removalData.stock_id,
      quantity_removed: removalData.quantity_removed,
      reason: removalData.reason,
      date_removed: removalData.date_removed,
      notes: removalData.notes || ''
    });

    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
  };

  // 🚀 ENHANCED: storeRemovalHash with automatic retry logic
  const storeRemovalHash = async (removalId, dataHash) => {
    if (!contract || !address) {
      throw new Error("Wallet not connected or contract not loaded");
    }

    // Validate inputs
    if (!removalId || removalId === undefined) {
      throw new Error("Invalid removal ID: cannot be undefined");
    }
    
    if (!dataHash) {
      throw new Error("Invalid data hash: cannot be empty");
    }

    console.log('🔍 Pre-flight checks:');
    console.log('  Removal ID:', removalId);
    console.log('  Data Hash:', dataHash);
    console.log('  Wallet Address:', address);

    // 🚀 RETRY LOGIC - Attempt transaction up to 3 times
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Attempt ${attempt}/${maxRetries}: Sending removal transaction...`);
        
        // Add delay between retries
        if (attempt > 1) {
          console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Try using thirdweb contract.call first
        try {
          console.log('⛽ Estimating gas with thirdweb...');
          const tx = await contract.call("storeRemovalHash", [removalId, dataHash]);
          console.log("Transaction sent:", tx);
          
          // Normalize the response
          const normalizedTx = {
            hash: tx.hash || tx.transactionHash || tx.receipt?.transactionHash || tx.receipt?.hash,
            receipt: tx.receipt || tx,
            transactionHash: tx.hash || tx.transactionHash || tx.receipt?.transactionHash || tx.receipt?.hash
          };

          if (!normalizedTx.hash) {
            throw new Error("No transaction hash found in thirdweb response");
          }

          console.log('✅ Transaction confirmed:', normalizedTx.hash);
          return normalizedTx; // Success! Exit retry loop

        } catch (thirdwebErr) {
          console.log("Thirdweb call failed, trying direct ethers...", thirdwebErr.message);
          
          // Fallback to direct ethers contract
          if (signer) {
            const abi = ContractABI.abi;
            const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
            
            // Estimate gas
            console.log('⛽ Estimating gas with ethers...');
            const gasEstimate = await contractWithSigner.estimateGas.storeRemovalHash(removalId, dataHash);
            console.log('  Gas estimate:', gasEstimate.toString());
            
            // Send transaction with gas buffer
            const tx = await contractWithSigner.storeRemovalHash(removalId, dataHash, {
              gasLimit: Math.floor(gasEstimate.toNumber() * 1.3) // 30% buffer
            });
            
            console.log("⏳ Transaction sent:", tx.hash);
            const receipt = await tx.wait();
            console.log("✅ Transaction confirmed:", receipt.transactionHash);
            
            return {
              hash: receipt.transactionHash,
              receipt: receipt,
              transactionHash: receipt.transactionHash
            };
          }
          throw thirdwebErr;
        }

      } catch (txError) {
        lastError = txError;
        console.warn(`❌ Attempt ${attempt} failed:`, txError.message);
        
        // Check if user cancelled (don't retry)
        if (txError.message?.includes('user rejected') || 
            txError.message?.includes('User denied') ||
            txError.code === 4001) {
          throw new Error('Transaction cancelled by user');
        }
        
        // Check if it's a transient error we should retry
        const isTransientError = 
          txError.message?.includes('Internal JSON-RPC error') ||
          txError.message?.includes('timeout') ||
          txError.message?.includes('network') ||
          txError.message?.includes('nonce too low') ||
          txError.message?.includes('replacement transaction underpriced') ||
          txError.code === -32603; // Internal JSON-RPC error code
        
        // If not transient and first attempt, don't retry
        if (!isTransientError && attempt === 1) {
          throw txError;
        }
        
        // If last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Continue to next retry
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  };

  // 🚀 ENHANCED: updateRemovalHash with retry logic
  const updateRemovalHash = async (removalId, newDataHash) => {
    if (!contract || !address) {
      throw new Error("Contract or wallet not connected");
    }

    console.log('🔍 Updating removal hash:', { removalId, newDataHash });

    // 🚀 RETRY LOGIC
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Attempt ${attempt}/${maxRetries}: Updating removal hash...`);
        
        if (attempt > 1) {
          console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        try {
          const tx = await contract.call("updateRemovalHash", [removalId, newDataHash]);
          
          const normalizedTx = {
            hash: tx.hash || tx.transactionHash || tx.receipt?.transactionHash || tx.receipt?.hash,
            receipt: tx.receipt || tx,
            transactionHash: tx.hash || tx.transactionHash || tx.receipt?.transactionHash || tx.receipt?.hash
          };

          console.log('✅ Transaction confirmed:', normalizedTx.hash);
          return normalizedTx;

        } catch (thirdwebErr) {
          console.log("Thirdweb failed, trying ethers...", thirdwebErr.message);
          
          if (signer) {
            const abi = ContractABI.abi;
            const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
            
            const gasEstimate = await contractWithSigner.estimateGas.updateRemovalHash(removalId, newDataHash);
            const tx = await contractWithSigner.updateRemovalHash(removalId, newDataHash, {
              gasLimit: Math.floor(gasEstimate.toNumber() * 1.3)
            });
            
            const receipt = await tx.wait();
            console.log('✅ Transaction confirmed:', receipt.transactionHash);
            
            return {
              hash: receipt.transactionHash,
              receipt: receipt,
              transactionHash: receipt.transactionHash
            };
          }
          throw thirdwebErr;
        }

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

  // 🚀 ENHANCED: deleteRemovalHash with retry logic
  const deleteRemovalHash = async (removalId) => {
    if (!contract || !address) {
      throw new Error("Contract or wallet not connected");
    }

    console.log('🔍 Deleting removal hash:', { removalId });

    // 🚀 RETRY LOGIC
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Attempt ${attempt}/${maxRetries}: Deleting removal hash...`);
        
        if (attempt > 1) {
          console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const tx = await contract.call("deleteRemovalHash", [removalId]);
        console.log('✅ Removal hash deleted successfully');
        return tx;

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

  const verifyRemovalHash = async (removalId, dataHash) => {
    if (!contract) throw new Error("Contract not connected");
    return await contract.call("verifyRemovalHash", [removalId, dataHash]);
  };

  const getRemovalHash = async (removalId) => {
    if (!contract) return null;
    try {
      const hashData = await contract.call("getRemovalHash", [removalId]);
      return {
        dataHash: hashData[0],
        removedBy: hashData[1],
        timestamp: hashData[2].toNumber(),
        exists: hashData[3],
      };
    } catch (err) {
      console.error("Error getting removal hash:", err);
      return null;
    }
  };

  const getRemovalCount = async () => {
    if (!contract) return 0;
    try {
      const count = await contract.call("getRemovalCount");
      return count?.toNumber?.() || 0;
    } catch {
      return 0;
    }
  };

  /* ======================================================
   ✅ COMBINED FUNCTION: Create Removal + Store on Blockchain WITH RETRY
  ====================================================== */
  const createRemovalWithBlockchain = async (removalData) => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Create in database
      console.log("Step 1: Creating removal in database...");
      const savedRemoval = await createRemoval(removalData);
      console.log("Removal created with ID:", savedRemoval.removal_id);

      // Step 2: Generate hash
      console.log("Step 2: Generating hash...");
      const dataHash = generateRemovalHash(savedRemoval);
      console.log("Hash generated:", dataHash);

      // Step 3: Store on blockchain with retry logic
      console.log("Step 3: Storing on blockchain with retry logic...");
      let tx = null;
      let blockchainError = null;

      try {
        tx = await storeRemovalHash(savedRemoval.removal_id, dataHash);
        console.log("✅ Blockchain transaction successful!");
      } catch (chainErr) {
        blockchainError = chainErr.message;
        console.error("❌ Blockchain transaction failed:", blockchainError);
        
        // Provide user-friendly error message
        if (chainErr.message?.includes('cancelled by user')) {
          throw new Error('Transaction cancelled by user. Removal saved to database but not on blockchain.');
        } else if (chainErr.message?.includes('Internal JSON-RPC error')) {
          throw new Error('Network congestion detected. Removal saved to database but blockchain sync failed. Please try syncing manually later.');
        }
        throw new Error(`Removal saved but blockchain sync failed: ${chainErr.message}`);
      }

      // Step 4: Update database with blockchain info
      if (tx) {
        const txHash = tx.hash || tx.transactionHash;
        if (txHash) {
          console.log("Step 4: Updating database with blockchain info...");
          await updateRemovalBlockchainInfo(savedRemoval.removal_id, {
            blockchain_hash: dataHash,
            blockchain_tx_hash: txHash,
            removed_by_wallet: address.toLowerCase(),
          });
        }
      }

      return {
        removal: savedRemoval,
        transaction: tx,
        dataHash,
        success: true,
        message: tx ? 'Removal created and synced on blockchain' : 'Removal created (blockchain sync failed)'
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
   ✅ HOOK RETURN
  ====================================================== */
  return {
    // API
    removals,
    loading,
    error,
    getRemovals,
    createRemoval,
    deleteRemoval,
    updateRemovalBlockchainInfo,

    // Blockchain with retry logic
    generateRemovalHash,
    storeRemovalHash,
    updateRemovalHash,
    deleteRemovalHash,
    verifyRemovalHash,
    getRemovalHash,
    getRemovalCount,

    // Combined
    createRemovalWithBlockchain,

    // Status
    contractLoaded: !isLoading && !!contract,
    walletConnected: !!address,
  };
};