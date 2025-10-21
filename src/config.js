// src/config.js
// 🚀 Environment-aware configuration for development and production

// 🔗 Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.MODE === 'production' 
    ? "https://genlunamedchain.onrender.com"  // Deployed backend URL
    : "http://localhost:4000");

// 🔗 Blockchain network configuration
export const BLOCKCHAIN_CONFIG = {
  network: import.meta.env.VITE_BLOCKCHAIN_NETWORK || "localhost",
  rpcUrl: import.meta.env.VITE_BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545",
  chainId: import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID || 31337,
  explorerUrl: import.meta.env.VITE_BLOCKCHAIN_EXPLORER_URL || "http://localhost:8545"
};

// 🔗 Smart contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || 
  "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Hardhat's default first account

export const CONTRACT_ADDRESSES = {
  ADMIN: import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  STAFF: [
    // Will be populated from environment or database
  ]
};

// 🔗 Environment info
export const ENV_INFO = {
  mode: import.meta.env.MODE,
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  apiUrl: API_BASE_URL,
  blockchainNetwork: BLOCKCHAIN_CONFIG.network
};

export default API_BASE_URL;
