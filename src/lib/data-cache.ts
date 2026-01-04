import { ref, get, runTransaction, update, push, set } from 'firebase/database';
import { database } from './firebase';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cached items

interface WalletBalance {
  earnedBalance: number;
  addedBalance: number;
  pendingAddMoney: number;
  totalWithdrawn: number;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
}

// Interface for user profile to validate permissions
interface UserProfile {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
}

class DataCache {
  private cache: Map<string, CacheEntry>;
  private pendingRequests: Map<string, Promise<any>>;

  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  // Get data from cache if it's still valid
  get(key: string): any | null {
    try {
      const entry = this.cache.get(key);
      if (!entry) return null;

      if (Date.now() > entry.expiry) {
        this.cache.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error getting data from cache:', error);
      return null;
    }
  }

  // Set data in cache
  set(key: string, data: any): void {
    try {
      // Remove oldest entries if cache is full
      if (this.cache.size >= MAX_CACHE_SIZE) {
        let oldestKey: string | undefined;
        let oldestTime = Number.MAX_SAFE_INTEGER;
        
        // Find the least recently used item by checking timestamps
        for (const [cacheKey, cacheEntry] of this.cache.entries()) {
          if (cacheEntry.timestamp < oldestTime) {
            oldestTime = cacheEntry.timestamp;
            oldestKey = cacheKey;
          }
        }
        
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }

      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + CACHE_DURATION,
      });
    } catch (error) {
      console.error('Error setting data in cache:', error);
    }
  }

  // Clear specific cache entry
  clear(key: string): void {
    try {
      this.cache.delete(key);
    } catch (error) {
      console.error('Error clearing cache entry:', error);
    }
  }

  // Clear all cache
  clearAll(): void {
    try {
      this.cache.clear();
      this.pendingRequests.clear();
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  // Check if data is being fetched
  isFetching(key: string): boolean {
    try {
      return this.pendingRequests.has(key);
    } catch (error) {
      console.error('Error checking if data is being fetched:', error);
      return false;
    }
  }

  // Get pending request
  getPending(key: string): Promise<any> | undefined {
    try {
      return this.pendingRequests.get(key);
    } catch (error) {
      console.error('Error getting pending request:', error);
      return undefined;
    }
  }

  // Set pending request
  setPending(key: string, promise: Promise<any>): void {
    try {
      this.pendingRequests.set(key, promise);
    } catch (error) {
      console.error('Error setting pending request:', error);
    }
  }

  // Clear pending request
  clearPending(key: string): void {
    try {
      this.pendingRequests.delete(key);
    } catch (error) {
      console.error('Error clearing pending request:', error);
    }
  }
  
  // Check if cache has expired entry
  isExpired(key: string): boolean {
    try {
      const entry = this.cache.get(key);
      if (!entry) return true;
      
      return Date.now() > entry.expiry;
    } catch (error) {
      console.error('Error checking if cache is expired:', error);
      return true; // Default to expired if there's an error
    }
  }
  
  // Get or create pending request to prevent duplicate requests
  getOrCreatePendingRequest<T>(key: string, createPromise: () => Promise<T>): Promise<T> {
    try {
      // Check if there's already a pending request for this key
      const existingPromise = this.pendingRequests.get(key);
      if (existingPromise) {
        return existingPromise as Promise<T>;
      }
      
      // Create a new promise
      const newPromise = createPromise();
      
      // Store the promise to prevent duplicate requests
      this.setPending(key, newPromise);
      
      // Clean up the pending request when it resolves or rejects
      newPromise.finally(() => {
        this.clearPending(key);
      });
      
      return newPromise;
    } catch (error) {
      console.error('Error in getOrCreatePendingRequest:', error);
      // Return a rejected promise to maintain the expected return type
      return Promise.reject(error) as Promise<T>;
    }
  }
  
  // Get all cache keys
  getCacheKeys(): string[] {
    try {
      return Array.from(this.cache.keys());
    } catch (error) {
      console.error('Error getting cache keys:', error);
      return [];
    }
  }
}

// Global cache instance
export const dataCache = new DataCache();

// Verify user authorization
const verifyUserAuthorization = async (currentUserId: string, targetUserId: string, requiredRole?: 'admin'): Promise<boolean> => {
  try {
    // Validate input parameters
    if (!currentUserId || typeof currentUserId !== 'string') {
      console.error('Invalid currentUserId provided for authorization check');
      return false;
    }
    
    if (!targetUserId || typeof targetUserId !== 'string') {
      console.error('Invalid targetUserId provided for authorization check');
      return false;
    }
    
    if (requiredRole === 'admin') {
      // Check if current user is an admin
      const userRef = ref(database, `users/${currentUserId}`);
      const userSnap = await get(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.val() as UserProfile;
        return userData && userData.role === 'admin' && !userData.isBlocked;
      }
      return false;
    }
    
    // For regular operations, user must match target or be admin
    if (currentUserId === targetUserId) return true;
    
    // Check if current user is admin
    const userRef = ref(database, `users/${currentUserId}`);
    const userSnap = await get(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.val() as UserProfile;
      return userData && userData.role === 'admin' && !userData.isBlocked;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying user authorization:', error);
    return false;
  }
};

// Atomic wallet operations using Firebase transactions
export const updateWalletBalance = async (
  uid: string, 
  updateFn: (currentBalance: WalletBalance) => Partial<WalletBalance> | null,
  currentUserId?: string
): Promise<WalletBalance | null> => {
  // Validate input parameters
  if (!uid || typeof uid !== 'string') {
    throw new Error('Invalid user ID provided');
  }
  
  if (!updateFn || typeof updateFn !== 'function') {
    throw new Error('Invalid update function provided');
  }
  
  // Verify authorization if currentUserId is provided
  if (currentUserId && !(await verifyUserAuthorization(currentUserId, uid))) {
    throw new Error('Unauthorized: You can only update your own wallet balance');
  }
  
  const walletRef = ref(database, `wallets/${uid}`);
  const cacheKey = `wallet:${uid}`;
  
  try {
    const result = await runTransaction(walletRef, (currentData) => {
      const currentBalance: WalletBalance = currentData || {
        earnedBalance: 0,
        addedBalance: 0,
        pendingAddMoney: 0,
        totalWithdrawn: 0,
      };
      
      const updateValues = updateFn(currentBalance);
      if (updateValues === null) {
        // Return undefined to abort the transaction
        return undefined;
      }
      
      // Apply the updates to the current data
      const updatedBalance = { ...currentBalance, ...updateValues };
      
      // Validate the updated balance before committing
      if (!validateWalletData(updatedBalance)) {
        console.error('Invalid wallet data after update:', updatedBalance);
        return undefined; // Abort transaction
      }
      
      return updatedBalance;
    });
    
    if (result.committed) {
      const finalData = result.snapshot.val();
      
      // Final validation after transaction
      if (!validateWalletData(finalData)) {
        console.error('Invalid wallet data returned from transaction:', finalData);
        throw new Error('Wallet validation failed after update');
      }
      
      // Update cache with new data
      dataCache.set(cacheKey, result.snapshot.val());
      
      // Invalidate related caches to ensure consistency
      invalidateUserCache(uid);
      
      return result.snapshot.val();
    } else {
      // Transaction was aborted
      console.warn(`Wallet balance update transaction was aborted for user ${uid}`);
      return null;
    }
  } catch (error: any) {
    console.error('Error updating wallet balance:', error);
    if (error.code) {
      throw new Error(`Failed to update wallet balance: ${error.message}`);
    }
    throw new Error('Failed to update wallet balance. Please try again later.');
  }
};

// Atomic transaction creation and wallet update
export const createTransactionAndAdjustWallet = async (
  uid: string,
  transaction: any,
  walletUpdate: Partial<WalletBalance>,
  currentUserId?: string
): Promise<void> => {
  // Validate input parameters
  if (!uid || typeof uid !== 'string') {
    throw new Error('Invalid user ID provided');
  }
  
  if (!transaction || typeof transaction !== 'object') {
    throw new Error('Invalid transaction data provided');
  }
  
  if (!walletUpdate || typeof walletUpdate !== 'object') {
    throw new Error('Invalid wallet update data provided');
  }
  
  // Verify authorization if currentUserId is provided
  if (currentUserId && !(await verifyUserAuthorization(currentUserId, uid))) {
    throw new Error('Unauthorized: You can only update your own wallet');
  }
  
  // Validate transaction data before creating
  if (!validateTransactionData(transaction)) {
    throw new Error('Invalid transaction data');
  }
  
  const transactionRef = ref(database, `transactions/${uid}`);
  const walletRef = ref(database, `wallets/${uid}`);
  const cacheKey = `wallet:${uid}`;
  
  try {
    // Create transaction record
    const transRef = await push(transactionRef);
    await set(transRef, transaction);
    
    // Update wallet atomically
    const result = await runTransaction(walletRef, (currentData) => {
      const currentBalance: WalletBalance = currentData || {
        earnedBalance: 0,
        addedBalance: 0,
        pendingAddMoney: 0,
        totalWithdrawn: 0,
      };
      
      // Apply the wallet updates
      const updatedBalance = { ...currentBalance };
      if (walletUpdate.earnedBalance !== undefined) {
        updatedBalance.earnedBalance = currentBalance.earnedBalance + walletUpdate.earnedBalance;
      }
      if (walletUpdate.addedBalance !== undefined) {
        updatedBalance.addedBalance = currentBalance.addedBalance + walletUpdate.addedBalance;
      }
      if (walletUpdate.pendingAddMoney !== undefined) {
        updatedBalance.pendingAddMoney = currentBalance.pendingAddMoney + walletUpdate.pendingAddMoney;
      }
      if (walletUpdate.totalWithdrawn !== undefined) {
        updatedBalance.totalWithdrawn = currentBalance.totalWithdrawn + walletUpdate.totalWithdrawn;
      }
      
      // Ensure no negative balances
      updatedBalance.earnedBalance = Math.max(0, updatedBalance.earnedBalance);
      updatedBalance.addedBalance = Math.max(0, updatedBalance.addedBalance);
      updatedBalance.pendingAddMoney = Math.max(0, updatedBalance.pendingAddMoney);
      updatedBalance.totalWithdrawn = Math.max(0, updatedBalance.totalWithdrawn);
      
      // Validate the updated balance before committing
      if (!validateWalletData(updatedBalance)) {
        console.error('Invalid wallet data after transaction:', updatedBalance);
        return undefined; // Abort transaction
      }
      
      return updatedBalance;
    });
    
    if (result.committed) {
      const finalData = result.snapshot.val();
      
      // Final validation after transaction
      if (!validateWalletData(finalData)) {
        console.error('Invalid wallet data returned from transaction:', finalData);
        throw new Error('Wallet validation failed after transaction');
      }
      
      // Update cache with new data
      dataCache.set(cacheKey, result.snapshot.val());
      
      // Invalidate related caches to ensure consistency
      invalidateUserCache(uid);
    }
  } catch (error: any) {
    console.error('Error creating transaction and updating wallet:', error);
    // Rollback transaction if it was created
    try {
      await update(ref(database, `transactions/${uid}`), { status: 'failed' });
    } catch (rollbackError) {
      console.error('Error during transaction rollback:', rollbackError);
    }
    
    if (error.code) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
    throw new Error('Failed to create transaction and update wallet. Please try again later.');
  }
};

// Utility function for safe campaign budget deduction
export const deductCampaignBudget = async (
  campaignId: string,
  amount: number,
  uid: string,
  currentUserId?: string
): Promise<boolean> => {
  // Validate input parameters
  if (!campaignId || typeof campaignId !== 'string') {
    throw new Error('Invalid campaign ID provided');
  }
  
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Invalid amount provided');
  }
  
  if (!uid || typeof uid !== 'string') {
    throw new Error('Invalid user ID provided');
  }
  
  // Verify authorization if currentUserId is provided
  if (currentUserId && !(await verifyUserAuthorization(currentUserId, uid))) {
    throw new Error('Unauthorized: You can only deduct from your own campaigns');
  }
  
  // Validate input parameters
  if (typeof amount !== 'number' || amount <= 0 || amount > 10000000) {
    throw new Error('Invalid amount for campaign budget deduction');
  }
  
  const campaignRef = ref(database, `campaigns/${campaignId}`);
  const walletRef = ref(database, `wallets/${uid}`);
  
  try {
    // Verify that the campaign belongs to the user
    const campaignSnap = await get(campaignRef);
    if (!campaignSnap.exists()) {
      throw new Error('Campaign does not exist');
    }
    
    const campaignData = campaignSnap.val();
    if (!campaignData) {
      throw new Error('Campaign data is invalid');
    }
    
    if (campaignData.creatorId !== uid) {
      throw new Error('Unauthorized: You can only deduct from your own campaigns');
    }
    
    // Validate campaign data
    if (!validateCampaignData(campaignData)) {
      throw new Error('Invalid campaign data');
    }
    
    // Update campaign budget atomically
    const campaignResult = await runTransaction(campaignRef, (currentData) => {
      if (!currentData) return undefined; // Abort if campaign doesn't exist
      
      // Validate campaign data during transaction
      if (!validateCampaignData(currentData)) {
        console.error('Invalid campaign data during transaction:', currentData);
        return undefined; // Abort transaction
      }
      
      // Check if there's enough remaining budget
      if (currentData.remainingBudget < amount) {
        return undefined; // Abort transaction
      }
      
      // Deduct from remaining budget
      const updatedCampaign = {
        ...currentData,
        remainingBudget: currentData.remainingBudget - amount
      };
      
      // Validate updated campaign data
      if (!validateCampaignData(updatedCampaign)) {
        console.error('Invalid campaign data after update:', updatedCampaign);
        return undefined; // Abort transaction
      }
      
      return updatedCampaign;
    });
    
    if (campaignResult.committed) {
      // Update user's added balance atomically
      const walletResult = await runTransaction(walletRef, (currentData) => {
        const currentBalance: WalletBalance = currentData || {
          earnedBalance: 0,
          addedBalance: 0,
          pendingAddMoney: 0,
          totalWithdrawn: 0,
        };
        
        // Check if there's enough added balance
        if (currentBalance.addedBalance < amount) {
          return undefined; // Abort transaction
        }
        
        // Deduct from added balance
        const updatedBalance = {
          ...currentBalance,
          addedBalance: currentBalance.addedBalance - amount
        };
        
        // Validate updated wallet data
        if (!validateWalletData(updatedBalance)) {
          console.error('Invalid wallet data after deduction:', updatedBalance);
          return undefined; // Abort transaction
        }
        
        return updatedBalance;
      });
      
      if (walletResult.committed) {
        // Invalidate user caches to ensure consistency
        invalidateUserCache(uid);
        dataCache.clear(`campaigns:all`);
        return true;
      } else {
        // Rollback campaign budget if wallet update failed
        await update(campaignRef, { remainingBudget: campaignResult.snapshot.val().remainingBudget + amount });
        console.warn('Campaign budget deduction: Wallet update failed, rolled back campaign budget');
        return false;
      }
    } else {
      console.warn('Campaign budget deduction: Campaign transaction failed');
      return false;
    }
  } catch (error: any) {
    console.error('Error deducting campaign budget:', error);
    if (error.code) {
      throw new Error(`Failed to deduct campaign budget: ${error.message}`);
    }
    throw new Error('Failed to deduct campaign budget. Please try again later.');
  }
};

// Utility function for safe work approval
export const approveWorkAndCredit = async (
  workId: string,
  userId: string,
  campaignId: string,
  reward: number,
  currentAdminId?: string
): Promise<boolean> => {
  // Validate input parameters
  if (!workId || typeof workId !== 'string') {
    throw new Error('Invalid work ID provided');
  }
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID provided');
  }
  
  if (!campaignId || typeof campaignId !== 'string') {
    throw new Error('Invalid campaign ID provided');
  }
  
  if (typeof reward !== 'number' || reward < 0) {
    throw new Error('Invalid reward amount provided');
  }
  
  // Verify admin authorization
  if (currentAdminId && !(await verifyUserAuthorization(currentAdminId, userId, 'admin'))) {
    throw new Error('Unauthorized: Only admins can approve work');
  }
  
  // Validate input parameters
  if (typeof reward !== 'number' || reward <= 0 || reward > 10000) {
    throw new Error('Invalid reward amount for work approval');
  }
  
  const workRef = ref(database, `works/${userId}/${workId}`);
  const walletRef = ref(database, `wallets/${userId}`);
  const userRef = ref(database, `users/${userId}`);
  
  try {
    // Verify that the work exists and is pending
    const workSnap = await get(workRef);
    if (!workSnap.exists()) {
      throw new Error('Work does not exist');
    }
    
    const workData = workSnap.val();
    if (!workData || workData.status !== 'pending') {
      throw new Error('Work is not in pending status');
    }
    
    // Validate work data
    if (typeof workData.reward !== 'number' || workData.reward <= 0 || workData.reward > 10000) {
      throw new Error('Invalid reward in work data');
    }
    
    // Update work status atomically
    const workResult = await runTransaction(workRef, (currentData) => {
      if (!currentData || currentData.status !== 'pending') {
        return undefined; // Abort if work doesn't exist or is not pending
      }
      
      // Validate work data during transaction
      if (typeof currentData.reward !== 'number' || currentData.reward <= 0 || currentData.reward > 10000) {
        console.error('Invalid reward in work data during transaction:', currentData);
        return undefined; // Abort transaction
      }
      
      return {
        ...currentData,
        status: 'approved'
      };
    });
    
    if (workResult.committed) {
      // Update user's earned balance atomically
      const walletResult = await runTransaction(walletRef, (currentData) => {
        const currentBalance: WalletBalance = currentData || {
          earnedBalance: 0,
          addedBalance: 0,
          pendingAddMoney: 0,
          totalWithdrawn: 0,
        };
        
        // Add to earned balance
        const updatedBalance = {
          ...currentBalance,
          earnedBalance: currentBalance.earnedBalance + reward
        };
        
        // Validate updated wallet data
        if (!validateWalletData(updatedBalance)) {
          console.error('Invalid wallet data after work approval:', updatedBalance);
          return undefined; // Abort transaction
        }
        
        return updatedBalance;
      });
      
      if (walletResult.committed) {
        // Update user profile's earned money
        const userSnap = await get(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.val();
          
          // Validate user data before updating
          const currentEarnedMoney = typeof userData.earnedMoney === 'number' ? userData.earnedMoney : 0;
          const currentApprovedWorks = typeof userData.approvedWorks === 'number' ? userData.approvedWorks : 0;
          
          // Validate new values
          if (currentEarnedMoney + reward < 0 || currentApprovedWorks + 1 < 0) {
            throw new Error('Invalid user data values');
          }
          
          await update(userRef, {
            earnedMoney: currentEarnedMoney + reward,
            approvedWorks: currentApprovedWorks + 1
          });
        }
        
        // Invalidate user caches to ensure consistency
        invalidateUserCache(userId);
        return true;
      } else {
        // Rollback work status if wallet update failed
        await update(workRef, { status: 'pending' });
        console.warn('Work approval: Wallet update failed, rolled back work status');
        return false;
      }
    } else {
      console.warn('Work approval: Work transaction failed');
      return false;
    }
  } catch (error: any) {
    console.error('Error approving work and crediting:', error);
    if (error.code) {
      throw new Error(`Failed to approve work: ${error.message}`);
    }
    throw new Error('Failed to approve work. Please try again later.');
  }
};

// Utility function for safe money request processing
export const processMoneyRequest = async (
  requestId: string,
  type: 'add_money' | 'withdrawal',
  userId: string,
  amount: number,
  status: 'approved' | 'rejected',
  currentAdminId?: string
): Promise<boolean> => {
  // Validate input parameters
  if (!requestId || typeof requestId !== 'string') {
    throw new Error('Invalid request ID provided');
  }
  
  if (!['add_money', 'withdrawal'].includes(type)) {
    throw new Error('Invalid request type provided');
  }
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID provided');
  }
  
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Invalid amount provided');
  }
  
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Invalid status provided');
  }
  
  // Verify admin authorization
  if (currentAdminId && !(await verifyUserAuthorization(currentAdminId, userId, 'admin'))) {
    throw new Error('Unauthorized: Only admins can process money requests');
  }
  
  // Validate input parameters
  if (typeof amount !== 'number' || amount <= 0 || 
      (type === 'add_money' && (amount < 10 || amount > 100000)) ||
      (type === 'withdrawal' && (amount < 500 || amount > 50000))) {
    throw new Error('Invalid amount for money request processing');
  }
  
  const requestPath = type === 'add_money' ? 'adminRequests/addMoney' : 'adminRequests/withdrawals';
  const requestRef = ref(database, `${requestPath}/${requestId}`);
  const walletRef = ref(database, `wallets/${userId}`);
  const transactionRef = ref(database, `transactions/${userId}`);
  
  try {
    // Verify that the request exists
    const requestSnap = await get(requestRef);
    if (!requestSnap.exists()) {
      throw new Error('Request does not exist');
    }
    
    const requestData = requestSnap.val();
    if (!requestData || requestData.status !== 'pending') {
      throw new Error('Request is not in pending status');
    }
    
    // Validate request data
    if (requestData.amount !== amount || requestData.type !== type || requestData.userId !== userId) {
      throw new Error('Request data does not match provided parameters');
    }
    
    // Update request status
    await update(requestRef, { status });
    
    if (status === 'approved') {
      if (type === 'add_money') {
        // Add to addedBalance
        const result = await runTransaction(walletRef, (currentData) => {
          const currentBalance: WalletBalance = currentData || {
            earnedBalance: 0,
            addedBalance: 0,
            pendingAddMoney: 0,
            totalWithdrawn: 0,
          };
          
          // Validate current wallet data
          if (!validateWalletData(currentBalance)) {
            console.error('Invalid wallet data during add money transaction:', currentBalance);
            return undefined; // Abort transaction
          }
          
          const updatedBalance = {
            ...currentBalance,
            addedBalance: currentBalance.addedBalance + amount,
            pendingAddMoney: Math.max(0, currentBalance.pendingAddMoney - amount)
          };
          
          // Validate updated wallet data
          if (!validateWalletData(updatedBalance)) {
            console.error('Invalid wallet data after add money:', updatedBalance);
            return undefined; // Abort transaction
          }
          
          return updatedBalance;
        });
        
        if (result.committed) {
          // Invalidate user caches to ensure consistency
          invalidateUserCache(userId);
          return true;
        } else {
          // Rollback request status if wallet update failed
          await update(requestRef, { status: 'pending' });
          console.warn('Money request processing: Wallet update failed, rolled back request status');
          return false;
        }
      } else {
        // Withdrawal: Deduct from earnedBalance
        const result = await runTransaction(walletRef, (currentData) => {
          const currentBalance: WalletBalance = currentData || {
            earnedBalance: 0,
            addedBalance: 0,
            pendingAddMoney: 0,
            totalWithdrawn: 0,
          };
          
          // Validate current wallet data
          if (!validateWalletData(currentBalance)) {
            console.error('Invalid wallet data during withdrawal transaction:', currentBalance);
            return undefined; // Abort transaction
          }
          
          // Check if user has enough earned balance
          if (currentBalance.earnedBalance < amount) {
            return undefined; // Abort transaction
          }
          
          const updatedBalance = {
            ...currentBalance,
            earnedBalance: currentBalance.earnedBalance - amount,
            totalWithdrawn: currentBalance.totalWithdrawn + amount
          };
          
          // Validate updated wallet data
          if (!validateWalletData(updatedBalance)) {
            console.error('Invalid wallet data after withdrawal:', updatedBalance);
            return undefined; // Abort transaction
          }
          
          return updatedBalance;
        });
        
        if (result.committed) {
          const finalWalletData = result.snapshot.val();
          
          // Final validation after transaction
          if (!validateWalletData(finalWalletData)) {
            console.error('Invalid wallet data returned from transaction:', finalWalletData);
            // Rollback request status if wallet data is invalid
            await update(requestRef, { status: 'pending' });
            throw new Error('Wallet validation failed after withdrawal');
          }
          
          // Update user profile total withdrawn
          const userSnap = await get(ref(database, `users/${userId}`));
          if (userSnap.exists()) {
            const userData = userSnap.val();
            if (userData) {
              await update(ref(database, `users/${userId}`), {
                totalWithdrawn: (userData.totalWithdrawn || 0) + amount
              });
            }
          }
          
          // Invalidate user caches to ensure consistency
          invalidateUserCache(userId);
          return true;
        } else {
          // Rollback request status if wallet update failed
          await update(requestRef, { status: 'pending' });
          console.warn('Money request processing: Wallet update failed, rolled back request status');
          return false;
        }
      }
    } else {
      // Request was rejected - just update the status
      return true;
    }
  } catch (error: any) {
    console.error('Error processing money request:', error);
    if (error.code) {
      throw new Error(`Failed to process money request: ${error.message}`);
    }
    throw new Error('Failed to process money request. Please try again later.');
  }
};

// Utility function for applying to a campaign
export const applyToCampaign = async (
  campaignId: string,
  userId: string,
  userName: string,
  reward: number,
  currentUserId?: string
): Promise<boolean> => {
  // Validate input parameters
  if (!campaignId || typeof campaignId !== 'string') {
    throw new Error('Invalid campaign ID provided');
  }
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID provided');
  }
  
  if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
    throw new Error('Invalid user name provided');
  }
  
  if (typeof reward !== 'number' || reward < 0) {
    throw new Error('Invalid reward amount provided');
  }
  
  // Verify user authorization
  if (currentUserId && currentUserId !== userId) {
    throw new Error('Unauthorized: You can only apply to campaigns for yourself');
  }
  
  // Validate input parameters
  if (!campaignId || !userId || !userName || typeof reward !== 'number' || reward <= 0 || reward > 10000) {
    throw new Error('Invalid parameters for campaign application');
  }

  const campaignRef = ref(database, `campaigns/${campaignId}`);
  const workRef = ref(database, `works/${userId}/${campaignId}`);

  try {
    // Check if user has already applied
    const workSnap = await get(workRef);
    if (workSnap.exists()) {
      throw new Error('You have already applied to this campaign');
    }

    // Get campaign data to check availability
    const campaignSnap = await get(campaignRef);
    if (!campaignSnap.exists()) {
      throw new Error('Campaign does not exist');
    }

    const campaignData = campaignSnap.val();
    if (!campaignData || campaignData.status !== 'active') {
      throw new Error('Campaign is not active');
    }

    if (campaignData.completedWorkers >= campaignData.totalWorkers) {
      throw new Error('Campaign is full');
    }

    // Create work entry
    const workData = {
      id: campaignId,
      userId,
      userName,
      campaignId,
      proofUrl: '',
      status: 'pending',
      submittedAt: Date.now(),
      reward,
    };
    
    // Validate work data before creating
    if (typeof workData.reward !== 'number' || workData.reward <= 0 || workData.reward > 10000) {
      throw new Error('Invalid reward in work data');
    }

    await set(workRef, workData);

    // Update campaign completed workers count
    await update(campaignRef, {
      completedWorkers: campaignData.completedWorkers + 1
    });

    // Invalidate user caches to ensure consistency
    invalidateUserCache(userId);
    dataCache.clear(`campaigns:all`);
    dataCache.clear(`campaign:${campaignId}`);

    return true;
  } catch (error: any) {
    console.error('Error applying to campaign:', error);
    if (error.code) {
      throw new Error(`Failed to apply to campaign: ${error.message}`);
    }
    throw new Error('Failed to apply to campaign. Please try again later.');
  }
};

// Utility function for submitting work for a campaign
export const submitWorkForCampaign = async (
  campaignId: string,
  userId: string,
  proofUrl: string,
  currentUserId?: string
): Promise<boolean> => {
  // Validate input parameters
  if (!campaignId || typeof campaignId !== 'string') {
    throw new Error('Invalid campaign ID provided');
  }
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID provided');
  }
  
  if (!proofUrl || typeof proofUrl !== 'string' || !proofUrl.startsWith('http')) {
    throw new Error('Invalid proof URL provided');
  }
  
  // Verify user authorization
  if (currentUserId && currentUserId !== userId) {
    throw new Error('Unauthorized: You can only submit work for yourself');
  }
  
  // Validate input parameters
  if (!campaignId || !userId || !proofUrl) {
    throw new Error('Invalid parameters for work submission');
  }
  
  // Validate proof URL
  if (!proofUrl.startsWith('http://') && !proofUrl.startsWith('https://')) {
    throw new Error('Invalid proof URL');
  }

  const workRef = ref(database, `works/${userId}/${campaignId}`);

  try {
    // Verify work exists
    const workSnap = await get(workRef);
    if (!workSnap.exists()) {
      throw new Error('You have not applied to this campaign');
    }

    const workData = workSnap.val();
    if (!workData || (workData.status !== 'pending' && workData.status !== 'rejected')) {
      throw new Error('Work has already been submitted and is awaiting review');
    }
    
    // Validate work data
    if (typeof workData.reward !== 'number' || workData.reward <= 0 || workData.reward > 10000) {
      throw new Error('Invalid reward in work data');
    }

    // Update work with proof
    await update(workRef, {
      proofUrl,
      status: 'pending',
      submittedAt: Date.now(),
    });

    // Invalidate user caches to ensure consistency
    invalidateUserCache(userId);

    return true;
  } catch (error: any) {
    console.error('Error submitting work:', error);
    if (error.code) {
      throw new Error(`Failed to submit work: ${error.message}`);
    }
    throw new Error('Failed to submit work. Please try again later.');
  }
};

// Utility function for rejecting work and updating campaign budget
export const rejectWorkAndRestoreCampaignBudget = async (
  workId: string,
  userId: string,
  campaignId: string,
  currentAdminId?: string
): Promise<boolean> => {
  // Validate input parameters
  if (!workId || typeof workId !== 'string') {
    throw new Error('Invalid work ID provided');
  }
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID provided');
  }
  
  if (!campaignId || typeof campaignId !== 'string') {
    throw new Error('Invalid campaign ID provided');
  }
  
  // Verify admin authorization
  if (currentAdminId && !(await verifyUserAuthorization(currentAdminId, userId, 'admin'))) {
    throw new Error('Unauthorized: Only admins can reject work');
  }
  
  // Validate input parameters
  if (!workId || !userId || !campaignId) {
    throw new Error('Invalid parameters for work rejection');
  }

  const workRef = ref(database, `works/${userId}/${workId}`);
  const campaignRef = ref(database, `campaigns/${campaignId}`);

  try {
    // Get current work data to verify status
    const workSnap = await get(workRef);
    if (!workSnap.exists()) {
      throw new Error('Work does not exist');
    }

    const workData = workSnap.val();
    if (!workData || workData.status !== 'pending') {
      throw new Error('Work is not in pending status');
    }
    
    // Validate work data
    if (typeof workData.reward !== 'number' || workData.reward <= 0 || workData.reward > 10000) {
      throw new Error('Invalid reward in work data');
    }

    // Update work status to rejected
    await update(workRef, {
      status: 'rejected'
    });

    // Update campaign completed workers count
    const campaignSnap = await get(campaignRef);
    if (campaignSnap.exists()) {
      const campaignData = campaignSnap.val();
      if (campaignData && campaignData.completedWorkers > 0) {
        await update(campaignRef, {
          completedWorkers: Math.max(0, campaignData.completedWorkers - 1)
        });
      }
    }

    // Invalidate user caches to ensure consistency
    invalidateUserCache(userId);
    dataCache.clear(`campaigns:all`);
    dataCache.clear(`campaign:${campaignId}`);

    return true;
  } catch (error: any) {
    console.error('Error rejecting work:', error);
    if (error.code) {
      throw new Error(`Failed to reject work: ${error.message}`);
    }
    throw new Error('Failed to reject work. Please try again later.');
  }
};

// Utility function to fetch time-based leaderboard data
export const fetchTimeBasedLeaderboard = async (
  period: 'daily' | 'weekly' | 'monthly'
): Promise<any> => {
  const cacheKey = `leaderboard:${period}`;
  
  // Check cache first
  const cached = dataCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Check if already fetching
  if (dataCache.isFetching(cacheKey)) {
    return dataCache.getPending(cacheKey);
  }

  // Fetch data
  const promise = Promise.all([
    get(ref(database, 'users')),
    get(ref(database, 'works'))
  ])
    .then(async ([usersSnap, worksSnap]) => {
      if (!usersSnap.exists() || !worksSnap.exists()) {
        return [];
      }

      const usersData = usersSnap.val();
      const worksData = worksSnap.val();
      
      // Calculate time thresholds
      const now = Date.now();
      let timeThreshold = 0;
      
      switch (period) {
        case 'daily':
          timeThreshold = now - (24 * 60 * 60 * 1000); // 24 hours ago
          break;
        case 'weekly':
          timeThreshold = now - (7 * 24 * 60 * 60 * 1000); // 7 days ago
          break;
        case 'monthly':
          timeThreshold = now - (30 * 24 * 60 * 60 * 1000); // 30 days ago
          break;
      }

      // Process works to count approved works by user and time period
      const userWorkCounts: Record<string, number> = {};
      
      for (const [userId, userWorks] of Object.entries(worksData)) {
        if (typeof userWorks === 'object' && userWorks !== null) {
          for (const [workId, workData] of Object.entries(userWorks as Record<string, any>)) {
            const work = workData as any;
            // Validate work data before processing
            if (work && work.status === 'approved' && 
                typeof work.submittedAt === 'number' && 
                work.submittedAt > timeThreshold &&
                work.submittedAt <= now + 60000) { // Allow 1 min future drift
              if (!userWorkCounts[userId]) {
                userWorkCounts[userId] = 0;
              }
              userWorkCounts[userId]++; 
            }
          }
        }
      }

      // Create leaderboard array
      const leaderboard = Object.entries(usersData)
        .map(([uid, userData]: [string, any]) => ({
          uid,
          fullName: typeof userData.fullName === 'string' ? userData.fullName : 'Unknown',
          profileImage: typeof userData.profileImage === 'string' ? userData.profileImage : null,
          approvedWorks: typeof userWorkCounts[uid] === 'number' ? userWorkCounts[uid] : 0,
        }))
        .filter((user: any) => user.approvedWorks > 0)
        .sort((a: any, b: any) => b.approvedWorks - a.approvedWorks)
        .slice(0, 50)
        .map((user: any, index: number) => ({ ...user, rank: index + 1 }));

      dataCache.set(cacheKey, leaderboard);
      return leaderboard;
    })
    .catch((error) => {
      console.error(`Error fetching ${period} leaderboard:`, error);
      throw error;
    })
    .finally(() => {
      dataCache.clearPending(cacheKey);
    });

  dataCache.setPending(cacheKey, promise);
  return promise;
};

// Utility functions for common data fetching operations
export const fetchUserData = async (uid: string): Promise<any> => {
  // Validate input parameter
  if (!uid || typeof uid !== 'string') {
    throw new Error('Invalid user ID provided');
  }
  
  const cacheKey = `user:${uid}`;
  
  // Check cache first
  const cached = dataCache.get(cacheKey);
  if (cached && !dataCache.isExpired(cacheKey)) {
    return cached;
  }

  // Use race condition handling to prevent duplicate requests
  return dataCache.getOrCreatePendingRequest(cacheKey, () => {
    return get(ref(database, `users/${uid}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data) {
            dataCache.set(cacheKey, data);
            return data;
          }
        }
        return null;
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
        throw error;
      });
  });
};

export const fetchWalletData = async (uid: string): Promise<any> => {
  // Validate input parameter
  if (!uid || typeof uid !== 'string') {
    throw new Error('Invalid user ID provided');
  }
  
  const cacheKey = `wallet:${uid}`;
  
  // Check cache first
  const cached = dataCache.get(cacheKey);
  if (cached && !dataCache.isExpired(cacheKey)) {
    return cached;
  }

  // Use race condition handling to prevent duplicate requests
  return dataCache.getOrCreatePendingRequest(cacheKey, () => {
    return get(ref(database, `wallets/${uid}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data) {
            dataCache.set(cacheKey, data);
            return data;
          }
        }
        return null;
      })
      .catch((error) => {
        console.error('Error fetching wallet data:', error);
        throw error;
      });
  });
};

export const fetchTransactions = async (uid: string): Promise<any> => {
  // Validate input parameter
  if (!uid || typeof uid !== 'string') {
    throw new Error('Invalid user ID provided');
  }
  
  const cacheKey = `transactions:${uid}`;
  
  // Check cache first
  const cached = dataCache.get(cacheKey);
  if (cached && !dataCache.isExpired(cacheKey)) {
    return cached;
  }

  // Use race condition handling to prevent duplicate requests
  return dataCache.getOrCreatePendingRequest(cacheKey, () => {
    return get(ref(database, `transactions/${uid}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data) {
            dataCache.set(cacheKey, data);
            return data;
          }
        }
        return [];
      })
      .catch((error) => {
        console.error('Error fetching transactions:', error);
        throw error;
      });
  });
};

export const fetchCampaigns = async (): Promise<any> => {
  const cacheKey = `campaigns:all`;
  
  // Check cache first
  const cached = dataCache.get(cacheKey);
  if (cached && !dataCache.isExpired(cacheKey)) {
    return cached;
  }

  // Use race condition handling to prevent duplicate requests
  return dataCache.getOrCreatePendingRequest(cacheKey, () => {
    return get(ref(database, `campaigns`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data) {
            dataCache.set(cacheKey, data);
            return data;
          }
        }
        return {};
      })
      .catch((error) => {
        console.error('Error fetching campaigns:', error);
        throw error;
      });
  });
};

export const fetchWorks = async (uid: string): Promise<any> => {
  // Validate input parameter
  if (!uid || typeof uid !== 'string') {
    throw new Error('Invalid user ID provided');
  }
  
  const cacheKey = `works:${uid}`;
  
  // Check cache first
  const cached = dataCache.get(cacheKey);
  if (cached && !dataCache.isExpired(cacheKey)) {
    return cached;
  }

  // Use race condition handling to prevent duplicate requests
  return dataCache.getOrCreatePendingRequest(cacheKey, () => {
    return get(ref(database, `works/${uid}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data) {
            dataCache.set(cacheKey, data);
            return data;
          }
        }
        return {};
      })
      .catch((error) => {
        console.error('Error fetching works:', error);
        throw error;
      });
  });
};

export const fetchAdminData = async (): Promise<any> => {
  const cacheKey = `admin:data`;
  
  // Check cache first
  const cached = dataCache.get(cacheKey);
  if (cached && !dataCache.isExpired(cacheKey)) {
    return cached;
  }

  // Use race condition handling to prevent duplicate requests
  return dataCache.getOrCreatePendingRequest(cacheKey, () => {
    return Promise.all([
      get(ref(database, `users`)),
      get(ref(database, `campaigns`)),
      get(ref(database, `works`)),
      get(ref(database, `adminRequests/addMoney`)),
      get(ref(database, `adminRequests/withdrawals`)),
    ])
      .then(([users, campaigns, works, addMoneyRequests, withdrawalRequests]) => {
        const result = {
          users: users.exists() ? users.val() : {},
          campaigns: campaigns.exists() ? campaigns.val() : {},
          works: works.exists() ? works.val() : {},
          addMoneyRequests: addMoneyRequests.exists() ? addMoneyRequests.val() : {},
          withdrawalRequests: withdrawalRequests.exists() ? withdrawalRequests.val() : {},
        };
        
        dataCache.set(cacheKey, result);
        return result;
      })
      .catch((error) => {
        console.error('Error fetching admin data:', error);
        throw error;
      });
  });
};

// Utility to clear specific cache entries when data is updated
export const invalidateCache = (keyPattern: string): void => {
  const keys = dataCache.getCacheKeys();
  for (const key of keys) {
    if (key.includes(keyPattern)) {
      dataCache.clear(key);
    }
  }
};

// Clear user-specific cache when user data is updated
export const invalidateUserCache = (uid: string): void => {
  invalidateCache(`user:${uid}`);
  invalidateCache(`wallet:${uid}`);
  invalidateCache(`transactions:${uid}`);
  invalidateCache(`works:${uid}`);
};

// Clear all caches related to a specific user
export const clearUserCache = (uid: string): void => {
  dataCache.clear(`user:${uid}`);
  dataCache.clear(`wallet:${uid}`);
  dataCache.clear(`transactions:${uid}`);
  dataCache.clear(`works:${uid}`);
};

// Utility function to fetch time-based leaderboard data
export const fetchTimeBasedLeaderboard = async (timeframe: 'daily' | 'weekly' | 'monthly'): Promise<any[]> => {
  // Validate input parameter
  if (!timeframe || !['daily', 'weekly', 'monthly'].includes(timeframe)) {
    throw new Error('Invalid timeframe provided. Must be daily, weekly, or monthly');
  }
  
  const cacheKey = `leaderboard:${timeframe}`;
  
  // Check cache first
  const cached = dataCache.get(cacheKey);
  if (cached && !dataCache.isExpired(cacheKey)) {
    return cached;
  }

  // Use race condition handling to prevent duplicate requests
  return dataCache.getOrCreatePendingRequest(cacheKey, () => {
    return get(ref(database, 'users'))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return [];
        }
        
        const users = snapshot.val();
        if (!users) {
          return [];
        }
        
        // Calculate time thresholds based on timeframe
        const now = Date.now();
        let timeThreshold = 0;
        
        switch (timeframe) {
          case 'daily':
            timeThreshold = now - 24 * 60 * 60 * 1000; // 24 hours ago
            break;
          case 'weekly':
            timeThreshold = now - 7 * 24 * 60 * 60 * 1000; // 7 days ago
            break;
          case 'monthly':
            timeThreshold = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago
            break;
        }
        
        // Convert users object to array and filter based on timeframe
        const usersArray = Object.entries(users)
          .filter(([uid, userData]: [string, any]) => {
            // Filter based on timeframe if needed
            // For now, we include all users but in a real implementation
            // you would filter based on when they earned money or completed work
            return userData && typeof userData === 'object';
          })
          .map(([uid, userData]: [string, any]) => ({
            uid,
            fullName: userData.fullName || userData.name || `User ${uid.substring(0, 8)}`,
            profileImage: userData.profileImage || userData.avatar,
            approvedWorks: userData.approvedWorks || 0,
            earnedMoney: userData.earnedMoney || 0,
          }));
        
        // Sort users by approved works (descending) and assign ranks
        const sortedUsers = usersArray
          .sort((a, b) => {
            // Primary sort: approved works (descending)
            if (b.approvedWorks !== a.approvedWorks) {
              return b.approvedWorks - a.approvedWorks;
            }
            // Secondary sort: earned money (descending) as tiebreaker
            return (b.earnedMoney || 0) - (a.earnedMoney || 0);
          })
          .map((user, index) => ({
            ...user,
            rank: index + 1,
          }));
        
        // Cache the result
        dataCache.set(cacheKey, sortedUsers);
        return sortedUsers;
      })
      .catch((error) => {
        console.error(`Error fetching ${timeframe} leaderboard:`, error);
        throw error;
      });
  });
};
