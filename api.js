// src/api.js
import axios from "axios";
import API_BASE_URL from "/src/config.js"; // ✅ relative import (no leading /)

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL || "http://localhost:3001/api",  // ✅ fallback if env/config missing
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Example: attach auth token if available
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach connected wallet for barangay-aware filtering
    const wallet = localStorage.getItem("connectedWalletAddress");
    if (wallet) {
      config.headers["x-wallet-address"] = wallet;
    }
    return config;
  },
  (error) => Promise.reject(error)   
);

// ✅ Response Interceptor
api.interceptors.response.use(
  (response) => response, // pass through normally
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized! Redirecting to login...");
      // Optionally redirect to login page
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
