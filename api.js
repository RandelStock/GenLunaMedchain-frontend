// src/api.js
import axios from "axios";
// Direct hardcoded URL to fix connection issues
const API_BASE_URL = "https://genlunamedchain-backend.onrender.com";

// Create axios instance with sensible defaults
const api = axios.create({
  baseURL: API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15s timeout to avoid hanging requests
  withCredentials: false, // change to true if you rely on cookies/auth
});

// Request interceptor — attach auth token + wallet if available
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const wallet = localStorage.getItem("connectedWalletAddress");
      if (wallet) {
        config.headers["x-wallet-address"] = wallet;
      }
    } catch (err) {
      // localStorage may throw in some strict environments — swallow safely
      console.warn("Request interceptor warning:", err?.message || err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle common status codes centrally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network / timeout
    if (!error.response) {
      console.error("Network or CORS error:", error.message || error);
      return Promise.reject({ message: "Network error or server unreachable", original: error });
    }

    const { status, data } = error.response;

    if (status === 401) {
      console.error("Unauthorized (401). Consider redirecting to login.");
      // Optionally clear token / redirect:
      // localStorage.removeItem("authToken");
      // window.location.href = "/login";
    }

    // Provide a normalized error object for callers
    const normalized = {
      status,
      message: (data && (data.message || data.error)) || error.message || "Request failed",
      data: data || null,
      original: error,
    };

    return Promise.reject(normalized);
  }
);

export default api;
