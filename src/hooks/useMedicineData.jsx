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
    // Ensure each hash is unique by including a fresh timestamp at call time.
    // If no medicineData provided, fall back to a cryptographically-random 32-byte value.
    try {
      if (medicineData && typeof medicineData === 'object') {
        const dataString = JSON.stringify({
          name: medicineData.name,
          batchNumber: medicineData.batchNumber,
          quantity: medicineData.quantity,
          expirationDate: medicineData.expirationDate,
          location: medicineData.location,
          // Always use a fresh timestamp at call time to avoid duplicate hashes
          timestamp: Date.now(),
        });

        return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
      }

      // Fallback: generate a random 32-byte hex value (always unique)
      return ethers.utils.hexlify(ethers.utils.randomBytes(32));
    } catch (err) {
      console.error('Error generating medicine hash:', err);
      // Last-resort: random 32 bytes
      return ethers.utils.hexlify(ethers.utils.randomBytes(32));
    }
  };

  const storeMedicineHash = async (medicineId, dataHash) => {
    if (!contract || !address) {
      throw new Error("Wallet not connected or contract not loaded");
    }

    if (!hasAccess) {
      throw new Error("Access denied. You need MEDICINE_MANAGER or ADMIN role to perform this action.");
    }

    // Validate inputs to avoid malformed RPC calls
    console.log('Blockchain payload:', { medicineId, dataHash, typeofId: typeof medicineId, hashLength: dataHash?.length });

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
      throw new Error(`Invalid hash format: ${dataHash}`);
    }

    try {
      // Re-check on-chain roles before attempting the transaction
      try {
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const STAFF_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("STAFF_ROLE"));
        const isAdmin = await contract.call("hasRole", [DEFAULT_ADMIN_ROLE, address]).catch(() => false);
        const isStaff = await contract.call("hasRole", [STAFF_ROLE, address]).catch(() => false);
        if (!isAdmin && !isStaff) {
          throw new Error('Wallet does not have STAFF or ADMIN role on-chain');
        }
      } catch (roleErr) {
        console.warn('Role check failed or insufficient role:', roleErr.message || roleErr);
        throw roleErr;
      }

      // Check if the medicineId already has a stored hash to avoid re-using IDs
      try {
        const existing = await contract.call("getMedicineHash", [parsedId]);
        const exists = existing?.[3];
        if (exists) {
          throw new Error(`Medicine ID ${parsedId} already has a stored hash on-chain. Use a fresh/unused medicine ID.`);
        }
      } catch (existErr) {
        // If the call itself fails, surface the error
        if (existErr.message && existErr.message.includes('revert')) {
          throw existErr;
        }
        // Otherwise continue (some providers return errors for non-existent entries)
      }

      // Use bytes32 array for the hash when calling the contract
      const hashBytes = ethers.utils.arrayify(dataHash);
      const tx = await contract.call("storeMedicineHash", [parsedId, hashBytes]);
      console.log("Hash stored on blockchain (thirdweb):", tx);
      return tx;
    } catch (err) {
      console.error("ThirdWeb storeMedicineHash failed:", err?.message || err);
      // Fallback to ethers signer when available
      if (signer) {
        try {
          const abi = getABI();
          const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
          const tx = await contractWithSigner.storeMedicineHash(parsedId, ethers.utils.arrayify(dataHash));
          console.log('Ethers tx sent:', tx.hash);
          const receipt = await tx.wait();
          console.log('Ethers tx confirmed:', receipt.transactionHash || receipt.hash);
          return receipt;
        } catch (ethersErr) {
          console.error("Ethers fallback failed:", ethersErr?.message || ethersErr);
          throw new Error(`Blockchain transaction failed: ${ethersErr?.message || ethersErr}`);
        }
      }

      throw new Error(`Blockchain transaction failed: ${err?.message || err}`);
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
      const newHashBytes = ethers.utils.arrayify(newDataHash);
      const tx = await contract.call("updateMedicineHash", [medicineId, newHashBytes]);

      console.log("Hash updated:", tx);
      return tx;

    } catch (err) {
      console.error("Update failed:", err);
      
      if (signer) {
        try {
          const abi = getABI();
          const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
          const tx = await contractWithSigner.updateMedicineHash(medicineId, ethers.utils.arrayify(newDataHash));
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
      const isValid = await contract.call("verifyMedicineHash", [medicineId, ethers.utils.arrayify(dataHash)]);
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
      const hashBytes = ethers.utils.arrayify(dataHash);
      const tx = await contract.call("storeReceiptHash", [receiptId, hashBytes]);

      console.log("Receipt hash stored:", tx);
      return tx;

    } catch (err) {
      console.error("Failed to store receipt hash:", err);
      
      if (signer) {
        try {
          const abi = getABI();
          const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
          const tx = await contractWithSigner.storeReceiptHash(receiptId, ethers.utils.arrayify(dataHash));
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
      const hashBytes = ethers.utils.arrayify(newDataHash);
      const tx = await contract.call("updateReceiptHash", [receiptId, hashBytes]);

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
      const isValid = await contract.call("verifyReceiptHash", [receiptId, ethers.utils.arrayify(dataHash)]);
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