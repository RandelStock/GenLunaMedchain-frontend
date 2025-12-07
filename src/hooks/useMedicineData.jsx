// hooks/useMedicineInventory.js - FIXED VERSION
import { useContract, useAddress, useSigner } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "../config";
import ContractABI from "../abi/ContractABI.json";
import api from "../../api.js";
import { useState, useEffect } from "react";

export function useMedicineInventory() {
  const { contract, isLoading } = useContract(CONTRACT_ADDRESS, ContractABI.abi);
  const address = useAddress();
  const signer = useSigner();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Check if user has access
  useEffect(() => {
    const checkUserAccess = async () => {
      if (!address || !contract) {
        setHasAccess(false);
        setCheckingAccess(false);
        return;
      }

      try {
        setCheckingAccess(true);
        
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const STAFF_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("STAFF_ROLE"));
        
        let hasRole = false;
        
        try {
          hasRole = await contract.call("hasRole", [DEFAULT_ADMIN_ROLE, address]);
          console.log("Admin role check:", hasRole);
        } catch (err) {
          console.log("Admin role check failed:", err);
        }
        
        if (!hasRole) {
          try {
            hasRole = await contract.call("hasRole", [STAFF_ROLE, address]);
            console.log("Staff role check:", hasRole);
          } catch (err) {
            console.log("Staff role check failed:", err);
          }
        }
        
        setHasAccess(hasRole);
      } catch (err) {
        console.error("Error checking access:", err);
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkUserAccess();
  }, [address, contract]);

  useEffect(() => {
    getMedicines();
  }, []);

  const getMedicines = async () => {
    setLoading(true);
    try {
      const res = await api.get("/stocks");
      setMedicines(res.data);
      setLoading(false);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
      setLoading(false);
      return [];
    }
  };

  const getABI = () => {
    return ContractABI.abi || null;
  };

  // FIXED: Generate hash with CONSISTENT timestamp
  const generateMedicineHash = (medicineData) => {
    try {
      if (medicineData && typeof medicineData === 'object') {
        // CRITICAL FIX: Use provided timestamp or create one that will be saved
        const timestamp = medicineData.timestamp || Date.now();
        
        const dataString = JSON.stringify({
          name: medicineData.name,
          batchNumber: medicineData.batchNumber,
          quantity: medicineData.quantity,
          expirationDate: medicineData.expirationDate,
          location: medicineData.location,
          timestamp: timestamp, // Use the same timestamp
        });

        const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
        
        // Return both hash and timestamp so they can be stored together
        return { hash, timestamp };
      }

      // Fallback: random 32-byte hex value
      const randomHash = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      return { hash: randomHash, timestamp: Date.now() };
    } catch (err) {
      console.error('Error generating medicine hash:', err);
      const randomHash = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      return { hash: randomHash, timestamp: Date.now() };
    }
  };

  // FIXED: Store medicine hash with better error handling
  const storeMedicineHash = async (medicineId, dataHash) => {
    if (!contract || !address) {
      throw new Error("Wallet not connected or contract not loaded");
    }

    if (!hasAccess) {
      throw new Error("Access denied. You need STAFF or ADMIN role to perform this action.");
    }

    // Validate inputs
    console.log('Blockchain payload:', { 
      medicineId, 
      dataHash, 
      typeofId: typeof medicineId, 
      hashLength: dataHash?.length,
      hashFormat: /^0x[a-fA-F0-9]{64}$/.test(dataHash)
    });

    if (!medicineId && medicineId !== 0) {
      throw new Error('Invalid blockchain payload: Missing medicineId');
    }

    const parsedId = Number(medicineId);
    if (isNaN(parsedId) || parsedId < 0) {
      throw new Error(`Invalid medicineId: ${medicineId}`);
    }

    if (!dataHash || typeof dataHash !== 'string') {
      throw new Error('Invalid blockchain payload: Missing or invalid hash');
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(dataHash)) {
      throw new Error(`Invalid hash format: ${dataHash}. Expected 0x followed by 64 hex characters.`);
    }

    try {
      // Re-check roles
      const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const STAFF_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("STAFF_ROLE"));
      
      const isAdmin = await contract.call("hasRole", [DEFAULT_ADMIN_ROLE, address]).catch(() => false);
      const isStaff = await contract.call("hasRole", [STAFF_ROLE, address]).catch(() => false);
      
      if (!isAdmin && !isStaff) {
        throw new Error('Wallet does not have STAFF or ADMIN role on-chain');
      }

      // Check if medicine hash already exists
      try {
        const existing = await contract.call("getMedicineHash", [parsedId]);
        const exists = existing?.[3];
        if (exists) {
          throw new Error(`Medicine ID ${parsedId} already has a stored hash on-chain. Use a different medicine ID or delete the existing hash first.`);
        }
      } catch (existErr) {
        // Only throw if it's a revert, not a "doesn't exist" error
        if (existErr.message && existErr.message.includes('revert') && !existErr.message.includes('does not exist')) {
          throw existErr;
        }
      }

      // NEW: Estimate gas first to catch reverts early
      if (signer) {
        try {
          const abi = getABI();
          const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
          
          // Estimate gas to catch potential reverts
          console.log('Estimating gas for storeMedicineHash...');
          const gasEstimate = await contractWithSigner.estimateGas.storeMedicineHash(parsedId, dataHash);
          console.log('Gas estimate:', gasEstimate.toString());
          
          // Send transaction with extra gas buffer
          const tx = await contractWithSigner.storeMedicineHash(parsedId, dataHash, {
            gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
          });
          
          console.log('Ethers storeMedicineHash tx sent:', tx.hash);
          const receipt = await tx.wait();
          console.log('Ethers storeMedicineHash confirmed:', receipt.transactionHash || receipt.hash);
          
          return receipt;
        } catch (ethersErr) {
          console.error("Ethers storeMedicineHash failed:", ethersErr);
          
          // Parse common error messages
          let errorMsg = ethersErr?.message || ethersErr;
          
          if (errorMsg.includes('user rejected')) {
            throw new Error('Transaction rejected by user');
          } else if (errorMsg.includes('insufficient funds')) {
            throw new Error('Insufficient funds for gas');
          } else if (errorMsg.includes('execution reverted')) {
            // Try to extract revert reason
            const match = errorMsg.match(/reason="([^"]+)"/);
            const reason = match ? match[1] : 'Contract execution reverted';
            throw new Error(`Contract error: ${reason}`);
          } else if (errorMsg.includes('nonce')) {
            throw new Error('Nonce error. Please reset your wallet or try again.');
          }
          
          throw new Error(`Blockchain transaction failed: ${errorMsg}`);
        }
      }

      // Fallback to ThirdWeb
      const tx = await contract.call("storeMedicineHash", [parsedId, dataHash]);
      console.log("Hash stored on blockchain (thirdweb fallback):", tx);
      return tx;
      
    } catch (err) {
      console.error("storeMedicineHash error:", err);
      throw err; // Re-throw the error with its original message
    }
  };

  const updateMedicineHash = async (medicineId, newDataHash) => {
    if (!contract || !address) {
      throw new Error("Contract or wallet not connected");
    }

    if (!hasAccess) {
      throw new Error("Access denied. You need STAFF or ADMIN role to perform this action.");
    }

    try {
      if (signer) {
        const abi = getABI();
        const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        const tx = await contractWithSigner.updateMedicineHash(medicineId, newDataHash);
        console.log('Ethers updateMedicineHash tx sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Ethers updateMedicineHash confirmed:', receipt.transactionHash || receipt.hash);
        return receipt;
      }

      const tx = await contract.call("updateMedicineHash", [medicineId, newDataHash]);
      console.log("Hash updated (thirdweb fallback):", tx);
      return tx;

    } catch (err) {
      throw new Error(`Update failed: ${err?.message || err}`);
    }
  };

  const deleteMedicineHash = async (medicineId) => {
    if (!contract || !address) {
      throw new Error("Contract or wallet not connected");
    }

    if (!hasAccess) {
      throw new Error("Access denied. You need STAFF or ADMIN role to perform this action.");
    }

    try {
      if (signer) {
        const abi = getABI();
        const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        const tx = await contractWithSigner.deleteMedicineHash(medicineId);
        console.log('Ethers deleteMedicineHash tx sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Ethers deleteMedicineHash confirmed:', receipt.transactionHash || receipt.hash);
        return receipt;
      }

      const tx = await contract.call("deleteMedicineHash", [medicineId]);
      console.log("Hash deleted (thirdweb fallback):", tx);
      return tx;
    } catch (err) {
      console.error("Failed to delete hash:", err);
      throw err;
    }
  };

  const verifyMedicineHash = async (medicineId, dataHash) => {
    if (!contract) {
      throw new Error("Contract not connected");
    }

    try {
      if (signer) {
        const abi = getABI();
        const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        const isValid = await contractWithSigner.verifyMedicineHash(medicineId, dataHash);
        return isValid;
      }

      const isValid = await contract.call("verifyMedicineHash", [medicineId, dataHash]);
      return isValid;
    } catch (err) {
      console.error("Verification failed:", err);
      return false;
    }
  };

  const getMedicineHash = async (medicineId) => {
    if (!contract) return null;
    
    try {
      const hashData = await contract.call("getMedicineHash", [medicineId]);
      return {
        dataHash: hashData[0],
        addedBy: hashData[1],
        timestamp: hashData[2].toNumber(),
        exists: hashData[3]
      };
    } catch (err) {
      console.error("Failed to get hash:", err);
      return null;
    }
  };

  // ... rest of receipt functions remain the same ...

  const getMedicineCount = async () => {
    if (!contract) return 0;
    try {
      const count = await contract.call("getMedicineCount");
      return count?.toNumber?.() || 0;
    } catch (err) {
      console.error("Failed to get medicine count:", err);
      return 0;
    }
  };

  const getReceiptCount = async () => {
    if (!contract) return 0;
    try {
      const count = await contract.call("getReceiptCount");
      return count?.toNumber?.() || 0;
    } catch (err) {
      console.error("Failed to get receipt count:", err);
      return 0;
    }
  };

  return {
    medicines, 
    loading,
    getMedicines,
    
    generateMedicineHash,
    storeMedicineHash,
    updateMedicineHash,
    deleteMedicineHash,
    verifyMedicineHash,
    getMedicineHash,
    
    getMedicineCount,
    getReceiptCount,
    
    hasAccess,
    checkingAccess,
    
    contractLoaded: !isLoading && !!contract,
    abiLoaded: !!getABI(),
  };
}