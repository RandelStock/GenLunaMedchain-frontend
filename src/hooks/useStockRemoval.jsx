// hooks/useStockRemoval.jsx
import { useState } from "react";
import { useContract, useAddress, useSigner } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "../config";
import ContractABI from "../abi/ContractABI.json";
import api from "../../api";
import API_BASE_URL from '../../config.js';

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
      
      // ✅ FIX: Extract the actual removal from the response
      // Backend returns: { success: true, data: removal, message: "..." }
      const savedRemoval = json.data || json;
      
      console.log('Extracted removal:', savedRemoval);
      console.log('Removal ID:', savedRemoval.removal_id);
      
      // Validate that we have a removal_id
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
      
      // Update local state
      setRemovals((prev) =>
        prev.map((r) => (r.removal_id === removalId ? updated : r))
      );
      
      return updated;
    } catch (err) {
      console.error("Failed to update blockchain info:", err);
      // Don't throw - blockchain is already confirmed, this is just metadata
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
   ✅ BLOCKCHAIN FUNCTIONS (Ethereum Smart Contract)
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

  const storeRemovalHash = async (removalId, dataHash) => {
    if (!contract || !address) {
      throw new Error("Wallet not connected or contract not loaded");
    }

    // ✅ Validate inputs before sending to blockchain
    if (!removalId || removalId === undefined) {
      throw new Error("Invalid removal ID: cannot be undefined");
    }
    
    if (!dataHash) {
      throw new Error("Invalid data hash: cannot be empty");
    }

    try {
      console.log(`Storing removal hash for ID ${removalId}...`);
      console.log(`Data hash: ${dataHash}`);
      
      // Try using thirdweb contract.call first
      try {
        const tx = await contract.call("storeRemovalHash", [removalId, dataHash]);
        console.log("Transaction sent:", tx);
        
        // Normalize the response to handle different thirdweb return formats
        const normalizedTx = {
          hash: tx.hash || tx.transactionHash || tx.receipt?.transactionHash || tx.receipt?.hash,
          receipt: tx.receipt || tx,
          transactionHash: tx.hash || tx.transactionHash || tx.receipt?.transactionHash || tx.receipt?.hash
        };

        if (!normalizedTx.hash) {
          throw new Error("No transaction hash found in thirdweb response");
        }

        return normalizedTx;
      } catch (err) {
        console.log("Thirdweb call failed, trying direct ethers...", err.message);
        
        // Fallback to direct ethers contract
        if (signer) {
          const abi = ContractABI.abi;
          const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
          const tx = await contractWithSigner.storeRemovalHash(removalId, dataHash);
          console.log("Transaction sent:", tx.hash);
          const receipt = await tx.wait();
          console.log("Transaction confirmed:", receipt.transactionHash);
          
          return {
            hash: receipt.transactionHash,
            receipt: receipt,
            transactionHash: receipt.transactionHash
          };
        }
        throw err;
      }
    } catch (err) {
      console.error("Error storing removal hash:", err);
      
      // Provide user-friendly error messages
      if (err.message.includes("user rejected")) {
        throw new Error("Transaction was rejected in MetaMask");
      } else if (err.message.includes("insufficient funds")) {
        throw new Error("Insufficient funds for gas fees");
      } else if (err.message.includes("already exists")) {
        throw new Error("This removal has already been recorded on the blockchain");
      } else if (err.message.includes("caller must have staff or admin role")) {
        throw new Error("Your wallet does not have permission to record removals. Please contact an administrator.");
      } else if (err.message.includes("Invalid removal ID")) {
        throw new Error("Invalid removal ID - database save may have failed");
      }
      
      throw err;
    }
  };

  const updateRemovalHash = async (removalId, newDataHash) => {
    if (!contract || !address) {
      throw new Error("Contract or wallet not connected");
    }
    
    try {
      const tx = await contract.call("updateRemovalHash", [removalId, newDataHash]);
      
      // Normalize response
      return {
        hash: tx.hash || tx.transactionHash || tx.receipt?.transactionHash || tx.receipt?.hash,
        receipt: tx.receipt || tx,
        transactionHash: tx.hash || tx.transactionHash || tx.receipt?.transactionHash || tx.receipt?.hash
      };
    } catch (err) {
      if (signer) {
        const abi = ContractABI.abi;
        const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        const tx = await contractWithSigner.updateRemovalHash(removalId, newDataHash);
        const receipt = await tx.wait();
        
        return {
          hash: receipt.transactionHash,
          receipt: receipt,
          transactionHash: receipt.transactionHash
        };
      }
      throw err;
    }
  };

  const deleteRemovalHash = async (removalId) => {
    if (!contract || !address) {
      throw new Error("Contract or wallet not connected");
    }
    return await contract.call("deleteRemovalHash", [removalId]);
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
   ✅ COMBINED FUNCTION: Create Removal + Store on Blockchain
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

      // Step 3: Store on blockchain
      console.log("Step 3: Storing on blockchain...");
      const tx = await storeRemovalHash(savedRemoval.removal_id, dataHash);
      console.log("Blockchain transaction successful!");

      // Step 4: Update database with blockchain info
      const txHash = tx.hash || tx.transactionHash;
      if (txHash) {
        console.log("Step 4: Updating database with blockchain info...");
        await updateRemovalBlockchainInfo(savedRemoval.removal_id, {
          blockchain_hash: dataHash,
          blockchain_tx_hash: txHash,
          removed_by_wallet: address.toLowerCase(),
        });
      }

      return {
        removal: savedRemoval,
        transaction: tx,
        dataHash,
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

    // Blockchain
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