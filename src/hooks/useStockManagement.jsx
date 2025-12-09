// hooks/useStockManagement.js
import { useState } from "react";
import { useContract, useAddress, useSigner } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "../config";
import ContractABI from "../abi/ContractABI.json";
import API_BASE_URL from '../config.js';

const API_URL = API_BASE_URL;

export const useStockManagement = () => {
  const { contract, isLoading } = useContract(CONTRACT_ADDRESS, ContractABI.abi);
  const address = useAddress();
  const signer = useSigner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate hash for stock data
  const generateStockHash = (stockData) => {
    const dataString = JSON.stringify({
      stock_id: stockData.stock_id,
      medicine_id: stockData.medicine_id,
      batch_number: stockData.batch_number,
      quantity: stockData.quantity,
      expiry_date: stockData.expiry_date
    });

    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
  };

  // Create stock in database
  const createStock = async (stockData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if batch already exists
      const checkResponse = await fetch(
        `${API_URL}/stocks?medicine_id=${stockData.medicine_id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (checkResponse.ok) {
        const existingStocks = await checkResponse.json();
        const stocks = existingStocks.data || existingStocks;
        const batchExists = stocks.some(s => 
          s.batch_number === stockData.batch_number && s.is_active
        );
        
        if (batchExists) {
          throw new Error(
            `Batch number "${stockData.batch_number}" already exists for this medicine. Please use a different batch number.`
          );
        }
      }

      // Create the stock
      const response = await fetch(`${API_URL}/stocks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(stockData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create stock");
      }

      const json = await response.json();
      console.log('Create stock response:', json);
      
      const savedStock = json.stock || json.data || json;
      
      console.log('Extracted stock:', savedStock);
      console.log('Stock ID:', savedStock.stock_id);
      
      if (!savedStock.stock_id) {
        throw new Error('No stock_id returned from server');
      }
      
      return savedStock;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🚀 ENHANCED: storeStockHash with automatic retry logic
  const storeStockHash = async (stockId, dataHash) => {
    if (!contract || !address) {
      throw new Error("Wallet not connected or contract not loaded");
    }

    if (!stockId || stockId === undefined) {
      throw new Error("Invalid stock ID: cannot be undefined");
    }
    
    if (!dataHash) {
      throw new Error("Invalid data hash: cannot be empty");
    }

    console.log('🔍 Pre-flight checks:');
    console.log('  Stock ID:', stockId);
    console.log('  Data Hash:', dataHash);
    console.log('  Wallet Address:', address);

    try {
      // Check if stock hash already exists
      let hashExists = false;
      try {
        const existingHash = await contract.call("getStockHash", [stockId]);
        hashExists = existingHash[3]; // Fourth element is the 'exists' boolean
        console.log(`  Stock hash exists: ${hashExists}`);
      } catch (err) {
        console.log('  Error checking if hash exists, assuming it does not:', err.message);
      }
      
      // Use updateStockHash if it exists, otherwise use storeStockHash
      const methodName = hashExists ? "updateStockHash" : "storeStockHash";
      console.log(`  Using method: ${methodName}`);

      // 🚀 RETRY LOGIC - Attempt transaction up to 3 times
      const maxRetries = 3;
      let lastError = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`📤 Attempt ${attempt}/${maxRetries}: Sending stock transaction...`);
          
          // Add delay between retries
          if (attempt > 1) {
            console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          // Try using thirdweb contract.call first
          try {
            console.log('⛽ Estimating gas with thirdweb...');
            const tx = await contract.call(methodName, [stockId, dataHash]);
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
              const gasEstimate = await contractWithSigner.estimateGas[methodName](stockId, dataHash);
              console.log('  Gas estimate:', gasEstimate.toString());
              
              // Send transaction with gas buffer
              const tx = await contractWithSigner[methodName](stockId, dataHash, {
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
      
    } catch (err) {
      console.error("❌ storeStockHash failed:", err);
      
      // Better error messages
      let errorMsg = err?.message || err;
      
      if (errorMsg.includes('user rejected') || 
          errorMsg.includes('denied') || 
          errorMsg.includes('cancelled by user')) {
        throw new Error('Transaction was cancelled by user');
      } else if (errorMsg.includes('insufficient funds')) {
        throw new Error('Insufficient MATIC for gas fees');
      } else if (errorMsg.includes('already exists')) {
        throw new Error('This stock has already been recorded on the blockchain. Try refreshing the page.');
      } else if (errorMsg.includes('caller must have staff or admin role')) {
        throw new Error('Your wallet does not have permission to add stock. Please contact an administrator.');
      } else if (errorMsg.includes('nonce')) {
        throw new Error('Network sync issue. Please try again in a moment.');
      } else if (errorMsg.includes('Internal JSON-RPC error')) {
        throw new Error('Network congestion on Polygon Amoy. Please try again in a moment.');
      }
      
      throw new Error(`Blockchain transaction failed: ${errorMsg}`);
    }
  };

  // Update stock with blockchain info
  const updateStockBlockchainInfo = async (stockId, blockchainData) => {
    try {
      const response = await fetch(`${API_URL}/stocks/${stockId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(blockchainData),
      });

      if (!response.ok) throw new Error("Failed to update blockchain info");
      
      const json = await response.json();
      return json.stock || json.data || json;
    } catch (err) {
      console.error("Failed to update blockchain info:", err);
      // Don't throw - blockchain is already confirmed
    }
  };

  // Delete stock (for rollback)
  const deleteStock = async (stockId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/stocks/${stockId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!response.ok) throw new Error("Failed to delete stock");
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createStock,
    generateStockHash,
    storeStockHash,
    updateStockBlockchainInfo,
    deleteStock,
    loading,
    error,
    contractLoaded: !isLoading && !!contract,
    walletConnected: !!address,
  };
};