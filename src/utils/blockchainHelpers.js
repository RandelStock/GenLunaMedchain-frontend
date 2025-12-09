// Enhanced blockchain transaction handler with retry logic and better error handling

/**
 * Stores a medicine hash on blockchain with automatic retry and better error handling
 * @param {Object} contract - The smart contract instance
 * @param {number} medicineId - Medicine ID
 * @param {string} dataHash - SHA-256 hash of medicine data
 * @param {string} walletAddress - User's wallet address
 * @returns {Promise<string>} Transaction hash
 */
export async function storeMedicineHash(contract, medicineId, dataHash, walletAddress) {
  console.log('🔍 Pre-flight checks:');
  console.log('  Medicine ID:', medicineId);
  console.log('  Data Hash:', dataHash);
  console.log('  Wallet Address:', walletAddress);
  
  try {
    // Check existing hash on blockchain
    const existingHashData = await contract.call("getMedicineHash", [medicineId]);
    console.log('  Existing hash check:', existingHashData);
    
    // If hash already exists and matches, skip
    if (existingHashData[3] && existingHashData[0].toLowerCase() === dataHash.toLowerCase()) {
      console.log('⚠️ Hash already exists on blockchain, skipping...');
      return null; // Already stored
    }
    
    // Prepare transaction with retry logic
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Attempt ${attempt}/${maxRetries}: Sending transaction...`);
        
        // Add a small delay between retries to allow network to settle
        if (attempt > 1) {
          console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Send transaction with explicit gas settings
        const tx = await contract.call(
          "storeMedicineHash",
          [medicineId, dataHash],
          {
            gasLimit: 200000, // Explicit gas limit (increased buffer)
          }
        );
        
        console.log('⏳ Transaction sent:', tx.receipt?.transactionHash || 'pending');
        console.log('✅ Transaction confirmed:', tx.receipt?.transactionHash);
        
        return tx.receipt?.transactionHash;
        
      } catch (error) {
        lastError = error;
        console.warn(`❌ Attempt ${attempt} failed:`, error.message);
        
        // Check if it's a user rejection (don't retry)
        if (error.message?.includes('user rejected') || 
            error.message?.includes('User denied')) {
          throw new Error('Transaction cancelled by user');
        }
        
        // Check if it's a known transient error
        const isTransientError = 
          error.message?.includes('Internal JSON-RPC error') ||
          error.message?.includes('timeout') ||
          error.message?.includes('network') ||
          error.message?.includes('nonce');
        
        if (!isTransientError && attempt === 1) {
          // If it's not a transient error, don't retry
          throw error;
        }
        
        // Continue to next retry if available
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }
    
    throw lastError || new Error('Transaction failed after retries');
    
  } catch (error) {
    console.error('❌ storeMedicineHash failed:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Blockchain transaction failed';
    
    if (error.message?.includes('user rejected') || error.message?.includes('User denied')) {
      errorMessage = 'Transaction cancelled by user';
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient MATIC for gas fees';
    } else if (error.message?.includes('nonce')) {
      errorMessage = 'Network sync issue - please try again';
    } else if (error.message?.includes('Internal JSON-RPC error')) {
      errorMessage = 'Network congestion - please try again in a moment';
    } else if (error.reason) {
      errorMessage = error.reason;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Store stock hash with retry logic
 */
export async function storeStockHash(contract, stockId, dataHash, walletAddress) {
  console.log('🔍 Storing stock hash:');
  console.log('  Stock ID:', stockId);
  console.log('  Data Hash:', dataHash);
  
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Attempt ${attempt}/${maxRetries}: Sending transaction...`);
      
      if (attempt > 1) {
        console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const tx = await contract.call(
        "storeStockHash",
        [stockId, dataHash],
        {
          gasLimit: 200000,
        }
      );
      
      console.log('✅ Transaction confirmed:', tx.receipt?.transactionHash);
      return tx.receipt?.transactionHash;
      
    } catch (error) {
      lastError = error;
      console.warn(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (error.message?.includes('user rejected') || 
          error.message?.includes('User denied')) {
        throw new Error('Transaction cancelled by user');
      }
      
      const isTransientError = 
        error.message?.includes('Internal JSON-RPC error') ||
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.message?.includes('nonce');
      
      if (!isTransientError && attempt === 1) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error('Transaction failed after retries');
}

/**
 * Store receipt hash with retry logic
 */
export async function storeReceiptHash(contract, receiptId, dataHash, walletAddress) {
  console.log('🔍 Storing receipt hash:');
  console.log('  Receipt ID:', receiptId);
  console.log('  Data Hash:', dataHash);
  
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Attempt ${attempt}/${maxRetries}: Sending transaction...`);
      
      if (attempt > 1) {
        console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const tx = await contract.call(
        "storeReceiptHash",
        [receiptId, dataHash],
        {
          gasLimit: 200000,
        }
      );
      
      console.log('✅ Transaction confirmed:', tx.receipt?.transactionHash);
      return tx.receipt?.transactionHash;
      
    } catch (error) {
      lastError = error;
      console.warn(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (error.message?.includes('user rejected') || 
          error.message?.includes('User denied')) {
        throw new Error('Transaction cancelled by user');
      }
      
      const isTransientError = 
        error.message?.includes('Internal JSON-RPC error') ||
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.message?.includes('nonce');
      
      if (!isTransientError && attempt === 1) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error('Transaction failed after retries');
}

/**
 * Store removal hash with retry logic
 */
export async function storeRemovalHash(contract, removalId, dataHash, walletAddress) {
  console.log('🔍 Storing removal hash:');
  console.log('  Removal ID:', removalId);
  console.log('  Data Hash:', dataHash);
  
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Attempt ${attempt}/${maxRetries}: Sending transaction...`);
      
      if (attempt > 1) {
        console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const tx = await contract.call(
        "storeRemovalHash",
        [removalId, dataHash],
        {
          gasLimit: 200000,
        }
      );
      
      console.log('✅ Transaction confirmed:', tx.receipt?.transactionHash);
      return tx.receipt?.transactionHash;
      
    } catch (error) {
      lastError = error;
      console.warn(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (error.message?.includes('user rejected') || 
          error.message?.includes('User denied')) {
        throw new Error('Transaction cancelled by user');
      }
      
      const isTransientError = 
        error.message?.includes('Internal JSON-RPC error') ||
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.message?.includes('nonce');
      
      if (!isTransientError && attempt === 1) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error('Transaction failed after retries');
}