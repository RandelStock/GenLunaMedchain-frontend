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

  // Check if user has access (either admin or staff with proper role)
  useEffect(() => {
    const checkUserAccess = async () => {
      if (!address || !contract) {
        setHasAccess(false);
        setCheckingAccess(false);
        return;
      }

      try {
        setCheckingAccess(true);
        
        // Check multiple roles
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const STAFF_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("STAFF_ROLE"));
        
        let hasRole = false;
        
        // Check if user has admin role
        try {
          hasRole = await contract.call("hasRole", [DEFAULT_ADMIN_ROLE, address]);
          console.log("Admin role check:", hasRole);
        } catch (err) {
          console.log("Admin role check failed:", err);
        }
        
        // If not admin, check for STAFF_ROLE (contract's onlyStaffOrAdmin)
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

  // Fetch medicines on mount
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

  const generateMedicineHash = (medicineData) => {
    try {
      if (!medicineData || typeof medicineData !== 'object') {
        return ethers.utils.hexlify(ethers.utils.randomBytes(32));
      }

      const dataString = JSON.stringify({
        name: medicineData.name,
        batchNumber: medicineData.batchNumber,
        quantity: medicineData.quantity,
        expirationDate: medicineData.expirationDate,
        location: medicineData.location,
        timestamp: medicineData.timestamp || Date.now(),
      });

      return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
    } catch (err) {
      console.error('Error generating hash:', err);
      return ethers.utils.hexlify(ethers.utils.randomBytes(32));
    }
  };

  // 🚀 ENHANCED: storeMedicineHash with automatic retry logic
  const storeMedicineHash = async (medicineId, dataHash) => {
    if (!contract || !address) {
      throw new Error("Wallet not connected or contract not loaded");
    }

    if (!hasAccess) {
      throw new Error("Access denied. You need STAFF or ADMIN role to perform this action.");
    }

    // Validate inputs
    const parsedId = Number(medicineId);
    if (isNaN(parsedId) || parsedId < 0) {
      throw new Error(`Invalid medicineId: ${medicineId}`);
    }

    if (!dataHash || typeof dataHash !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(dataHash)) {
      throw new Error(`Invalid hash format: ${dataHash}`);
    }

    console.log('🔍 Pre-flight checks:');
    console.log('  Medicine ID:', parsedId);
    console.log('  Data Hash:', dataHash);
    console.log('  Wallet Address:', address);
    console.log('  Has Access (frontend):', hasAccess);

    if (!signer) {
      throw new Error("Signer not available. Please ensure MetaMask is connected.");
    }

    try {
      const abi = getABI();
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      
      // Verify roles on the actual contract
      console.log('🔐 Verifying on-chain roles...');
      const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const STAFF_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("STAFF_ROLE"));
      
      const hasAdminRole = await contractWithSigner.hasRole(DEFAULT_ADMIN_ROLE, address);
      const hasStaffRole = await contractWithSigner.hasRole(STAFF_ROLE, address);
      
      console.log('  Admin Role:', hasAdminRole);
      console.log('  Staff Role:', hasStaffRole);
      
      if (!hasAdminRole && !hasStaffRole) {
        throw new Error(
          `❌ NO ROLES ON CONTRACT!\n` +
          `Your wallet (${address}) does not have ADMIN or STAFF role on the deployed contract.\n` +
          `Please ask the contract owner to grant you access using:\n` +
          `contract.grantStaffRole("${address}")`
        );
      }
      
      // Check if hash already exists
      try {
        const existing = await contractWithSigner.getMedicineHash(parsedId);
        console.log('  Existing hash check:', existing);
        if (existing[3]) { // exists = true
          throw new Error(`Medicine ID ${parsedId} already exists on blockchain`);
        }
      } catch (checkErr) {
        // Ignore "does not exist" errors
        if (!checkErr.message?.includes('does not exist')) {
          console.warn('⚠️ Hash check warning:', checkErr.message);
        }
      }

      // 🚀 RETRY LOGIC - Attempt transaction up to 3 times
      const maxRetries = 3;
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`📤 Attempt ${attempt}/${maxRetries}: Sending transaction...`);
          
          // Add delay between retries
          if (attempt > 1) {
            console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          // Estimate gas
          console.log('⛽ Estimating gas...');
          const gasEstimate = await contractWithSigner.estimateGas.storeMedicineHash(parsedId, dataHash);
          console.log('  Gas estimate:', gasEstimate.toString());
          
          // Send transaction with gas buffer
          const tx = await contractWithSigner.storeMedicineHash(parsedId, dataHash, {
            gasLimit: Math.floor(gasEstimate.toNumber() * 1.3) // 30% buffer
          });
          
          console.log('⏳ Transaction sent:', tx.hash);
          const receipt = await tx.wait();
          console.log('✅ Transaction confirmed:', receipt.transactionHash);
          
          return receipt; // Success! Exit retry loop
          
        } catch (txError) {
          lastError = txError;
          console.warn(`❌ Attempt ${attempt} failed:`, txError.message);
          
          // Check if user cancelled (don't retry)
          if (txError.message?.includes('user rejected') || 
              txError.message?.includes('User denied') ||
              txError.code === 4001) { // MetaMask rejection code
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
      
    } catch (err) {
      console.error("❌ storeMedicineHash failed:", err);
      
      // Better error messages
      let errorMsg = err?.message || err;
      
      if (errorMsg.includes('already exists')) {
        throw new Error(`Medicine ID ${parsedId} already exists on blockchain. Database and blockchain are out of sync.`);
      } else if (errorMsg.includes('user rejected') || 
                 errorMsg.includes('denied') || 
                 errorMsg.includes('cancelled by user')) {
        throw new Error('Transaction was cancelled by user');
      } else if (errorMsg.includes('insufficient funds')) {
        throw new Error('Insufficient MATIC for gas fees');
      } else if (errorMsg.includes('nonce')) {
        throw new Error('Network sync issue. Please try again in a moment.');
      } else if (errorMsg.includes('Internal JSON-RPC error')) {
        throw new Error('Network congestion on Polygon Amoy. Please try again in a moment.');
      } else if (errorMsg.includes('NO ROLES ON CONTRACT')) {
        throw err; // Preserve our custom error
      }
      
      throw new Error(`Blockchain transaction failed: ${errorMsg}`);
    }
  };

  const updateMedicineHash = async (medicineId, newDataHash) => {
    if (!contract || !address) {
      throw new Error("Contract or wallet not connected");
    }

    if (!hasAccess) {
      throw new Error("Access denied. You need MEDICINE_MANAGER or ADMIN role to perform this action.");
    }

    try {
      const tx = await contract.call("updateMedicineHash", [
        medicineId,
        newDataHash
      ]);

      console.log("Hash updated:", tx);
      return tx;

    } catch (err) {
      console.error("Update failed:", err);
      
      if (signer) {
        try {
          const abi = getABI();
          const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
          const tx = await contractWithSigner.updateMedicineHash(medicineId, newDataHash);
          const receipt = await tx.wait();
          return receipt;
        } catch (ethersErr) {
          console.error("Both update methods failed:", err, ethersErr);
        }
      }
      
      throw err;
    }
  };

  const deleteMedicineHash = async (medicineId) => {
    if (!contract || !address) {
      throw new Error("Contract or wallet not connected");
    }

    if (!hasAccess) {
      throw new Error("Access denied. You need MEDICINE_MANAGER or ADMIN role to perform this action.");
    }

    try {
      const tx = await contract.call("deleteMedicineHash", [medicineId]);
      console.log("Hash deleted:", tx);
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
      const isValid = await contract.call("verifyMedicineHash", [
        medicineId,
        dataHash
      ]);
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

  const storeReceiptHash = async (receiptId, dataHash) => {
    if (!contract || !address) {
      throw new Error("Wallet not connected or contract not loaded");
    }

    try {
      const tx = await contract.call("storeReceiptHash", [
        receiptId,
        dataHash
      ]);

      console.log("Receipt hash stored:", tx);
      return tx;

    } catch (err) {
      console.error("Failed to store receipt hash:", err);
      
      if (signer) {
        try {
          const abi = getABI();
          const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
          const tx = await contractWithSigner.storeReceiptHash(receiptId, dataHash);
          const receipt = await tx.wait();
          return receipt;
        } catch (ethersErr) {
          console.error("Both methods failed:", err, ethersErr);
        }
      }
      
      throw err;
    }
  };

  const updateReceiptHash = async (receiptId, newDataHash) => {
    if (!contract) {
      throw new Error("Contract not connected");
    }

    try {
      const tx = await contract.call("updateReceiptHash", [
        receiptId,
        newDataHash
      ]);

      console.log("Receipt hash updated:", tx);
      return tx;
    } catch (err) {
      console.error("Failed to update receipt hash:", err);
      throw err;
    }
  };

  const deleteReceiptHash = async (receiptId) => {
    if (!contract) {
      throw new Error("Contract not connected");
    }

    try {
      const tx = await contract.call("deleteReceiptHash", [receiptId]);
      console.log("Receipt hash deleted:", tx);
      return tx;
    } catch (err) {
      console.error("Failed to delete receipt hash:", err);
      throw err;
    }
  };

  const verifyReceiptHash = async (receiptId, dataHash) => {
    if (!contract) {
      throw new Error("Contract not connected");
    }

    try {
      const isValid = await contract.call("verifyReceiptHash", [
        receiptId,
        dataHash
      ]);
      return isValid;
    } catch (err) {
      console.error("Verification failed:", err);
      return false;
    }
  };

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
    
    // Hash operations
    generateMedicineHash,
    storeMedicineHash,
    updateMedicineHash,
    deleteMedicineHash,
    verifyMedicineHash,
    getMedicineHash,
    
    // Receipt hash operations
    storeReceiptHash,
    updateReceiptHash,
    deleteReceiptHash,
    verifyReceiptHash,
    
    // Counts
    getMedicineCount,
    getReceiptCount,
    
    // Access control
    hasAccess,
    checkingAccess,
    
    // Status
    contractLoaded: !isLoading && !!contract,
    abiLoaded: !!getABI(),
  };
}