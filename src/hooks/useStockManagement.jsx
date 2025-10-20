// hooks/useStockManagement.js
import { useState } from "react";
import { useContract, useAddress, useSigner } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "../config";
import ContractABI from "../abi/ContractABI.json";
import API_BASE_URL from '../../config.js';

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

      // THIS WAS MISSING - Actually create the stock
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

  // Store or update hash on blockchain
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

    try {
      console.log(`Storing/updating stock hash for ID ${stockId}...`);
      console.log(`Data hash: ${dataHash}`);
      
      // Check if stock hash already exists
      let hashExists = false;
      try {
        const existingHash = await contract.call("getStockHash", [stockId]);
        hashExists = existingHash[3]; // Fourth element is the 'exists' boolean
        console.log(`Stock hash exists: ${hashExists}`);
      } catch (err) {
        console.log('Error checking if hash exists, assuming it does not:', err.message);
      }
      
      // Use updateStockHash if it exists, otherwise use storeStockHash
      const methodName = hashExists ? "updateStockHash" : "storeStockHash";
      console.log(`Using method: ${methodName}`);
      
      const tx = await contract.call(methodName, [stockId, dataHash]);
      console.log("Transaction sent:", tx);
      
      const normalizedTx = {
        hash: tx.hash || tx.transactionHash || tx.receipt?.transactionHash || tx.receipt?.hash,
        receipt: tx.receipt || tx,
        transactionHash: tx.hash || tx.transactionHash || tx.receipt?.transactionHash || tx.receipt?.hash
      };

      if (!normalizedTx.hash) {
        throw new Error("No transaction hash found in response");
      }

      return normalizedTx;
      
    } catch (err) {
      console.error("Error storing stock hash:", err);
      
      if (err.message.includes("user rejected")) {
        throw new Error("Transaction was rejected in MetaMask");
      } else if (err.message.includes("insufficient funds")) {
        throw new Error("Insufficient funds for gas fees");
      } else if (err.message.includes("already exists")) {
        throw new Error("This stock has already been recorded on the blockchain. Try refreshing the page.");
      } else if (err.message.includes("caller must have staff or admin role")) {
        throw new Error("Your wallet does not have permission to add stock. Please contact an administrator.");
      }
      
      throw err;
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