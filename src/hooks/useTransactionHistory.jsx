import { useState, useEffect, useCallback, useRef } from 'react';
import { useContract, useAddress } from "@thirdweb-dev/react";
import { CONTRACT_ADDRESS } from "../config";

export function useTransactionHistory() {
  const { contract } = useContract(CONTRACT_ADDRESS);
  const address = useAddress();
  
  // Add network detection
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  
  // Refs for managing listeners and intervals
  const eventListenersRef = useRef([]);
  const reconnectIntervalRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const isInitializedRef = useRef(false);

  // Configuration
  const BATCH_SIZE = 50;
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  const MAX_RECENT_BLOCKS = 500;
  const RECONNECT_INTERVAL = 5 * 60 * 1000;
  const REFRESH_INTERVAL = 2 * 60 * 1000;
  const CONNECTION_CHECK_INTERVAL = 30 * 1000;

  // =============== PERSISTENCE FUNCTIONS ===============
  
  // Get storage key based on network and address
  const getStorageKey = useCallback(() => {
    if (!address || !currentNetwork) return null;
    return `transaction_history_${address}_${currentNetwork}`;
  }, [address, currentNetwork]);

  // Save to memory storage (since localStorage is not available)
  const memoryStorage = useRef({});
  
  const saveToStorage = useCallback((data) => {
    const key = getStorageKey();
    if (key) {
      memoryStorage.current[key] = {
        data,
        timestamp: Date.now(),
        network: currentNetwork,
        address
      };
      console.log(`💾 Saved ${data.length} transactions for ${key}`);
    }
  }, [getStorageKey, currentNetwork, address]);

  const loadFromStorage = useCallback(() => {
    const key = getStorageKey();
    if (key && memoryStorage.current[key]) {
      const stored = memoryStorage.current[key];
      // Check if data is recent (within 1 hour)
      const isRecent = Date.now() - stored.timestamp < 3600000; // 1 hour
      if (isRecent && stored.network === currentNetwork && stored.address === address) {
        console.log(`📂 Loaded ${stored.data.length} transactions from storage for ${key}`);
        return stored.data;
      }
    }
    return [];
  }, [getStorageKey, currentNetwork, address]);

  // =============== NETWORK DETECTION ===============
  
  // Detect current network
  const detectNetwork = useCallback(async () => {
    try {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const networkId = parseInt(chainId, 16);
        setCurrentNetwork(networkId);
        return networkId;
      } else if (contract?.provider) {
        const network = await contract.provider.getNetwork();
        setCurrentNetwork(network.chainId);
        return network.chainId;
      }
    } catch (error) {
      console.warn('Failed to detect network:', error);
    }
    return null;
  }, [contract]);

  // Listen for network changes
  useEffect(() => {
    const handleChainChanged = (chainId) => {
      const networkId = parseInt(chainId, 16);
      console.log(`🌐 Network changed to: ${networkId}`);
      setCurrentNetwork(networkId);
      
      // Load stored data for new network
      const stored = loadFromStorage();
      if (stored.length > 0) {
        setTransactionHistory(stored);
      } else {
        // Only clear if no stored data exists
        setTransactionHistory([]);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [loadFromStorage]);

  // Initialize network detection
  useEffect(() => {
    detectNetwork();
  }, [detectNetwork]);

  // =============== MODIFIED TRANSACTION MANAGEMENT ===============

  // Save transactions whenever they change
  useEffect(() => {
    if (transactionHistory.length > 0 && currentNetwork && address) {
      saveToStorage(transactionHistory);
    }
  }, [transactionHistory, saveToStorage, currentNetwork, address]);

  // Load stored transactions when network/address changes
  useEffect(() => {
    if (currentNetwork && address && !isInitializedRef.current) {
      const stored = loadFromStorage();
      if (stored.length > 0) {
        console.log(`🔄 Restoring ${stored.length} transactions from storage`);
        setTransactionHistory(stored);
      }
      isInitializedRef.current = true;
    }
  }, [currentNetwork, address, loadFromStorage]);

  // =============== ENHANCED TRANSACTION FUNCTIONS ===============

  // Modified setTransactionHistory to include persistence
  const updateTransactionHistory = useCallback((newTransactions) => {
    setTransactionHistory(prev => {
      // Merge with existing transactions
      const combined = Array.isArray(newTransactions) 
        ? [...newTransactions, ...prev]
        : [newTransactions, ...prev];
      
      // Remove duplicates
      const unique = combined.filter((event, index, self) => 
        index === self.findIndex(e => 
          e.txHash === event.txHash && 
          e.description === event.description
        )
      );
      
      // Sort by timestamp (newest first)
      unique.sort((a, b) => {
        const timeA = parseInt(a.timestamp) || 0;
        const timeB = parseInt(b.timestamp) || 0;
        return timeB - timeA;
      });
      
      return unique;
    });
  }, []);

  // =============== EXISTING FUNCTIONS (Modified) ===============

  // Helper function to format timestamps
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Helper function to get user-friendly action types
  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATED': return '➕';
      case 'UPDATED': return '✏️';
      case 'DELETED': return '🗑️';
      case 'ADDED': return '➕';
      default: return '📝';
    }
  };

  // Add debug logging
  const addDebugInfo = useCallback((eventType, data, rawEvent = null) => {
    if (!showDebug) return;
    
    const debugEntry = {
      eventType,
      timestamp: new Date().toLocaleString(),
      network: currentNetwork,
      dataKeys: Object.keys(data || {}),
      data,
      rawEvent: rawEvent ? JSON.stringify(rawEvent, null, 2) : null
    };
    
    console.log(`🔍 Debug Event - ${eventType}:`, debugEntry);
    setDebugInfo(prev => [debugEntry, ...prev.slice(0, 9)]);
  }, [showDebug, currentNetwork]);

  // Toggle debug mode
  const toggleDebug = useCallback(() => {
    setShowDebug(prev => !prev);
  }, []);

  // Get current block number
  const getCurrentBlock = useCallback(async () => {
    try {
      if (contract?.provider?.getBlockNumber) {
        try {
          const blockNumber = await contract.provider.getBlockNumber();
          return blockNumber;
        } catch (err) {
          // Silent fallback
        }
      }

      if (contract?.provider?.send) {
        try {
          const blockNumber = await contract.provider.send("eth_blockNumber", []);
          const blockNum = parseInt(blockNumber, 16);
          return blockNum;
        } catch (err) {
          // Silent fallback
        }
      }

      if (window.ethereum) {
        try {
          const blockNumber = await window.ethereum.request({
            method: 'eth_blockNumber'
          });
          const blockNum = parseInt(blockNumber, 16);
          return blockNum;
        } catch (err) {
          // Silent fallback
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }, [contract]);

  // Test contract connection
  const testContractConnection = useCallback(async () => {
    if (!contract) return false;
    
    try {
      const medicineCount = await contract.call("getMedicineCount");
      addDebugInfo("CONTRACT_TEST", { 
        medicineCount: medicineCount.toString(),
        network: currentNetwork 
      });
      return true;
    } catch (testErr) {
      addDebugInfo("CONTRACT_TEST_FAILED", { 
        error: testErr.message,
        network: currentNetwork 
      });
      return false;
    }
  }, [contract, addDebugInfo, currentNetwork]);

  // Fetch events with network context
  const fetchEvents = useCallback(async (eventName) => {
    try {
      const approaches = [
        async () => {
          const currentBlock = await getCurrentBlock();
          if (currentBlock) {
            const fromBlock = Math.max(currentBlock - MAX_RECENT_BLOCKS, 0);
            return await contract.events.getEvents(eventName, {
              fromBlock: fromBlock,
              toBlock: currentBlock
            });
          }
          throw new Error('No current block available');
        },
        
        async () => {
          return await contract.events.getEvents(eventName, {
            fromBlock: -MAX_RECENT_BLOCKS,
            toBlock: "latest"
          });
        },
        
        async () => {
          return await contract.events.getEvents(eventName, {
            fromBlock: -100,
            toBlock: "latest"
          });
        },
        
        async () => {
          return await contract.events.getEvents(eventName, {
            fromBlock: "latest",
            toBlock: "latest"
          });
        },
        
        async () => {
          return await contract.events.getEvents(eventName);
        }
      ];

      for (let i = 0; i < approaches.length; i++) {
        try {
          const events = await approaches[i]();
          addDebugInfo(`FETCH_${eventName}_SUCCESS`, { 
            count: events.length, 
            approach: i + 1,
            network: currentNetwork
          });
          return events;
        } catch (err) {
          if (i === approaches.length - 1) {
            throw err;
          }
        }
      }
      
      return [];
    } catch (error) {
      addDebugInfo(`FETCH_${eventName}_FAILED`, { 
        error: error.message,
        network: currentNetwork 
      });
      return [];
    }
  }, [contract, getCurrentBlock, addDebugInfo, currentNetwork]);

  // Process event data (same as before)
  const processEventData = useCallback((event, eventName, eventIndex) => {
    let transaction = {
      id: `${eventName}-${event.blockNumber || Date.now()}-${event.logIndex || eventIndex}`,
      blockNumber: event.blockNumber || event.transaction?.blockNumber,
      txHash: event.transactionHash || event.transaction?.transactionHash,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      changedBy: 'Unknown',
      network: currentNetwork // Add network identifier
    };

    // [Rest of the processEventData logic remains the same...]
    // Enhanced history events
    if (eventName.includes("HistoryLog")) {
      let itemId = 'N/A';
      if (event.data.medicineId) {
        itemId = event.data.medicineId.toString ? event.data.medicineId.toString() : event.data.medicineId;
      } else if (event.data.receiptId) {
        itemId = event.data.receiptId.toString ? event.data.receiptId.toString() : event.data.receiptId;
      }

      let eventTimestamp = transaction.timestamp;
      if (event.data.timestamp) {
        eventTimestamp = event.data.timestamp.toString ? event.data.timestamp.toString() : event.data.timestamp;
      }

      transaction = {
        ...transaction,
        type: eventName.includes("Medicine") ? "Medicine" : "Receipt",
        itemId: itemId,
        action: event.data.action || 'UNKNOWN',
        fieldChanged: event.data.fieldChanged || 'N/A',
        oldValue: event.data.oldValue || '',
        newValue: event.data.newValue || '',
        changedBy: event.data.changedBy || 'Unknown',
        timestamp: eventTimestamp,
        description: event.data.description || 'Changed'
      };
    }
    // Basic events
    else {
      if (eventName.includes("Medicine")) {
        transaction.type = "Medicine";
        transaction.itemId = event.data.index?.toString() || 'N/A';
        transaction.fieldChanged = 'ALL';
        transaction.oldValue = '';
        
        if (eventName.includes("Added")) {
          transaction.action = "ADDED";
          transaction.newValue = event.data.name || 'Medicine Added';
          transaction.description = `Added medicine: ${event.data.name || 'Unknown'}`;
          if (event.data.batchNumber) {
            transaction.description += ` (Batch: ${event.data.batchNumber})`;
          }
        } else {
          transaction.action = "UPDATED";
          transaction.newValue = 'Updated Data';
          transaction.description = `Updated medicine at index ${event.data.index || 'N/A'}`;
        }
        
        if (event.data.timestamp) {
          transaction.timestamp = event.data.timestamp.toString ? event.data.timestamp.toString() : event.data.timestamp;
        }
      } else if (eventName.includes("Receipt")) {
        transaction.type = "Receipt";
        transaction.itemId = event.data.index?.toString() || 'N/A';
        transaction.fieldChanged = 'ALL';
        transaction.oldValue = '';
        
        if (eventName.includes("Added")) {
          transaction.action = "ADDED";
          transaction.newValue = `${event.data.medicineName} for ${event.data.patientName}`;
          transaction.description = `Added receipt: ${event.data.medicineName} for ${event.data.patientName} (Qty: ${event.data.quantity})`;
        } else {
          transaction.action = "UPDATED";
          transaction.newValue = `${event.data.medicineName} for ${event.data.patientName}`;
          transaction.description = `Updated receipt at index ${event.data.index}`;
        }
        
        if (event.data.timestamp) {
          transaction.timestamp = event.data.timestamp.toString ? event.data.timestamp.toString() : event.data.timestamp;
        }
      }
    }

    return transaction;
  }, [currentNetwork]);

  // Create event listener with persistence
  const createEventListener = useCallback((eventName, eventType, actionType = null) => {
    if (!contract) return null;

    try {
      const listener = (event) => {
        addDebugInfo(eventName, event.data, event);
        
        let newTransaction;

        if (eventName.includes("HistoryLog")) {
          let eventTimestamp = event.data.timestamp?.toString() || Math.floor(Date.now() / 1000).toString();
          if (event.data.timestamp && event.data.timestamp.toString) {
            eventTimestamp = event.data.timestamp.toString();
          }

          newTransaction = {
            id: `history-${eventType.toLowerCase()}-${Date.now()}-${Math.random()}`,
            type: eventType,
            itemId: event.data.medicineId?.toString() || event.data.receiptId?.toString() || 'N/A',
            action: event.data.action || 'UNKNOWN',
            fieldChanged: event.data.fieldChanged || 'N/A',
            oldValue: event.data.oldValue || '',
            newValue: event.data.newValue || '',
            changedBy: event.data.changedBy || 'Unknown',
            timestamp: eventTimestamp,
            description: event.data.description || `${eventType} changed`,
            blockNumber: event.blockNumber || event.transaction?.blockNumber,
            txHash: event.transactionHash || event.transaction?.transactionHash,
            network: currentNetwork
          };
        } else {
          let description = "";
          let newValue = "";
          
          if (eventName === "MedicineAddedFull") {
            description = `Added medicine: ${event.data.name || 'Unknown'} (Batch: ${event.data.batchNumber || 'N/A'})`;
            newValue = event.data.name || 'Medicine Added';
          } else if (eventName === "MedicineAdded") {
            description = `Added medicine: ${event.data.name || 'Unknown'}`;
            newValue = event.data.name || 'Medicine Added';
          } else if (eventName.includes("Updated")) {
            description = `Updated ${eventType.toLowerCase()} at index ${event.data.index || 'N/A'}`;
            newValue = 'Updated Data';
          } else if (eventName === "ReceiptAdded") {
            description = `Added receipt: ${event.data.medicineName} for ${event.data.patientName} (Qty: ${event.data.quantity})`;
            newValue = `${event.data.medicineName} for ${event.data.patientName}`;
          }

          let eventTimestamp = event.data.timestamp?.toString() || Math.floor(Date.now() / 1000).toString();
          if (event.data.timestamp && event.data.timestamp.toString) {
            eventTimestamp = event.data.timestamp.toString();
          }

          newTransaction = {
            id: `basic-${eventType.toLowerCase()}-${actionType?.toLowerCase()}-${Date.now()}-${Math.random()}`,
            type: eventType,
            itemId: event.data.index?.toString() || 'N/A',
            action: actionType || 'UNKNOWN',
            fieldChanged: 'ALL',
            oldValue: '',
            newValue: newValue,
            changedBy: 'Unknown',
            timestamp: eventTimestamp,
            description: description,
            blockNumber: event.blockNumber || event.transaction?.blockNumber,
            txHash: event.transactionHash || event.transaction?.transactionHash,
            network: currentNetwork
          };
        }

        // Use the new update function
        updateTransactionHistory(newTransaction);
      };

      contract.events.addEventListener(eventName, listener);
      return { event: eventName, listener };
    } catch (err) {
      addDebugInfo(`${eventName}_LISTENER_FAILED`, { error: err.message });
      return null;
    }
  }, [contract, addDebugInfo, currentNetwork, updateTransactionHistory]);

  // [Rest of the functions remain mostly the same, just using updateTransactionHistory instead of setTransactionHistory]

  // Modified fetchHistoricalEvents
  const fetchHistoricalEvents = useCallback(async () => {
    if (!contract) {
      setError("Contract not connected");
      return;
    }

    // Don't fetch if we already have recent data
    const stored = loadFromStorage();
    if (stored.length > 0) {
      console.log("📋 Using cached transaction data");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      addDebugInfo("FETCH_HISTORICAL", { 
        message: "Starting historical fetch",
        network: currentNetwork 
      });
      
      let allEvents = [];

      const eventNames = [
        "MedicineHistoryLog",
        "ReceiptHistoryLog", 
        "MedicineAddedFull",
        "MedicineUpdatedFull",
        "MedicineAdded",
        "MedicineUpdated",
        "ReceiptAdded",
        "ReceiptUpdated"
      ];

      for (const eventName of eventNames) {
        try {
          const events = await fetchEvents(eventName);
          
          if (events.length > 0) {
            const processedEvents = events.map((event, eventIndex) => 
              processEventData(event, eventName, eventIndex)
            );

            allEvents = [...allEvents, ...processedEvents];
          }

          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (err) {
          addDebugInfo(`FETCH_${eventName}_FAILED`, { error: err.message });
        }
      }

      allEvents.sort((a, b) => {
        const timeA = parseInt(a.timestamp) || 0;
        const timeB = parseInt(b.timestamp) || 0;
        return timeB - timeA;
      });

      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => 
          e.txHash === event.txHash && 
          e.description === event.description
        )
      );

      if (uniqueEvents.length > 0) {
        updateTransactionHistory(uniqueEvents);
      }
      
      addDebugInfo("FETCH_COMPLETE", { 
        total: allEvents.length, 
        unique: uniqueEvents.length,
        network: currentNetwork 
      });
      
      if (uniqueEvents.length === 0) {
        setError("No transactions found. This may be normal if no transactions have occurred recently.");
      }
      
    } catch (err) {
      addDebugInfo("FETCH_ERROR", { error: err.message, network: currentNetwork });
      
      if (err.message.includes("Log response size exceeded")) {
        setError("Too many transactions to load at once. Showing recent transactions only.");
      } else if (err.message.includes("network") || err.message.includes("provider")) {
        setError("Network connection issue. Please check your internet connection and try again.");
      } else {
        setError(`Failed to load transaction history: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [contract, fetchEvents, processEventData, addDebugInfo, currentNetwork, updateTransactionHistory, loadFromStorage]);

  // [Include all the other existing functions...]
  
  // Setup event listeners
  const setupEventListeners = useCallback(async () => {
    if (!contract) return;

    addDebugInfo("SETUP", { message: "Starting event listener setup", network: currentNetwork });

    const isConnected = await testContractConnection();
    if (!isConnected) {
      setError("Contract connection failed. Please check your connection.");
      return;
    }

    eventListenersRef.current.forEach(({ event, listener }) => {
      try {
        contract.events.removeEventListener(event, listener);
      } catch (err) {
        // Silent cleanup
      }
    });
    eventListenersRef.current = [];

    const historyEvents = [
      { name: "MedicineHistoryLog", type: "Medicine" },
      { name: "ReceiptHistoryLog", type: "Receipt" }
    ];

    for (const { name, type } of historyEvents) {
      const listener = createEventListener(name, type);
      if (listener) {
        eventListenersRef.current.push(listener);
      }
    }

    const basicEvents = [
      { name: "MedicineAddedFull", type: "Medicine", action: "ADDED" },
      { name: "MedicineUpdatedFull", type: "Medicine", action: "UPDATED" },
      { name: "MedicineAdded", type: "Medicine", action: "ADDED" },
      { name: "MedicineUpdated", type: "Medicine", action: "UPDATED" },
      { name: "ReceiptAdded", type: "Receipt", action: "ADDED" },
      { name: "ReceiptUpdated", type: "Receipt", action: "UPDATED" }
    ];

    for (const { name, type, action } of basicEvents) {
      const listener = createEventListener(name, type, action);
      if (listener) {
        eventListenersRef.current.push(listener);
      }
    }

    addDebugInfo("LISTENERS_SETUP", { 
      count: eventListenersRef.current.length, 
      events: eventListenersRef.current.map(l => l.event),
      network: currentNetwork,
      timestamp: new Date().toISOString()
    });
  }, [contract, addDebugInfo, testContractConnection, createEventListener, currentNetwork]);

  // Periodic connection check
  const checkConnectionAndRefresh = useCallback(async () => {
    if (!contract) return;

    try {
      const isConnected = await testContractConnection();
      
      if (!isConnected) {
        await setupEventListeners();
      } else {
        const now = Date.now();
        if (now - lastFetchTimeRef.current > REFRESH_INTERVAL) {
          lastFetchTimeRef.current = now;
          await fetchHistoricalEvents();
        }
      }
    } catch (err) {
      addDebugInfo("CONNECTION_CHECK_FAILED", { error: err.message });
    }
  }, [contract, testContractConnection, setupEventListeners, fetchHistoricalEvents, addDebugInfo]);

  // Real-time event listener setup
  useEffect(() => {
    if (!contract || !currentNetwork) return;

    setupEventListeners();

    const connectionCheckInterval = setInterval(checkConnectionAndRefresh, CONNECTION_CHECK_INTERVAL);

    reconnectIntervalRef.current = setInterval(async () => {
      await setupEventListeners();
    }, RECONNECT_INTERVAL);

    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
      clearInterval(connectionCheckInterval);
      
      eventListenersRef.current.forEach(({ event, listener }) => {
        try {
          contract.events.removeEventListener(event, listener);
        } catch (err) {
          // Silent cleanup
        }
      });
      eventListenersRef.current = [];
    };
  }, [contract, currentNetwork, setupEventListeners, checkConnectionAndRefresh]);

  // Clear transaction history
  const clearHistory = useCallback(() => {
    setTransactionHistory([]);
    // Also clear from storage
    const key = getStorageKey();
    if (key && memoryStorage.current[key]) {
      delete memoryStorage.current[key];
    }
    addDebugInfo("CLEAR_HISTORY", { message: "Transaction history cleared" });
  }, [addDebugInfo, getStorageKey]);

  // Filter transactions
  const filterTransactions = useCallback((filters) => {
    let filtered = [...transactionHistory];

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(tx => tx.type.toLowerCase() === filters.type.toLowerCase());
    }

    if (filters.action && filters.action !== 'all') {
      filtered = filtered.filter(tx => 
        tx.action === filters.action || 
        (filters.action === 'CREATED' && tx.action === 'ADDED')
      );
    }

    if (filters.dateFrom) {
      const fromTimestamp = new Date(filters.dateFrom).getTime() / 1000;
      filtered = filtered.filter(tx => parseInt(tx.timestamp) >= fromTimestamp);
    }

    if (filters.dateTo) {
      const toTimestamp = new Date(filters.dateTo).getTime() / 1000;
      filtered = filtered.filter(tx => parseInt(tx.timestamp) <= toTimestamp);
    }

    return filtered;
  }, [transactionHistory]);

  // Get transaction stats
  const getStats = useCallback(() => {
    const stats = {
      total: transactionHistory.length,
      medicines: transactionHistory.filter(tx => tx.type === 'Medicine').length,
      receipts: transactionHistory.filter(tx => tx.type === 'Receipt').length,
      created: transactionHistory.filter(tx => tx.action === 'CREATED' || tx.action === 'ADDED').length,
      updated: transactionHistory.filter(tx => tx.action === 'UPDATED').length,
      deleted: transactionHistory.filter(tx => tx.action === 'DELETED').length,
    };

    return stats;
  }, [transactionHistory]);

  // Modified auto-fetch - only fetch if no stored data exists
  useEffect(() => {
    if (contract && address && currentNetwork && isInitializedRef.current) {
      const stored = loadFromStorage();
      if (stored.length === 0 && transactionHistory.length === 0) {
        const timer = setTimeout(() => {
          fetchHistoricalEvents();
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [contract, address, currentNetwork, transactionHistory.length, fetchHistoricalEvents, loadFromStorage]);

  return {
    transactionHistory,
    loading,
    error,
    debugInfo,
    showDebug,
    toggleDebug,
    fetchHistoricalEvents,
    clearHistory,
    filterTransactions,
    getStats,
    formatTimestamp,
    getActionIcon,
    contractConnected: !!contract && !!address,
    currentNetwork // Expose current network info
  };
}