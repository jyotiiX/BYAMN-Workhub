import { ref, get, update } from 'firebase/database';
import { database } from './firebase';

/**
 * Migration script to add missing fields to existing user profiles
 * This ensures all existing users have the required fields in their profile
 */
export const migrateUserProfiles = async () => {
  try {
    console.log('Starting user profile migration...');
    
    // Get all users
    const usersSnap = await get(ref(database, 'users'));
    
    if (usersSnap.exists()) {
      const usersData = usersSnap.val();
      const updates: Record<string, any> = {};
      
      let migratedCount = 0;
      let skippedCount = 0;
      
      for (const [userId, userData] of Object.entries(usersData)) {
        const user = userData as any;
        
        // Check for missing required fields and add them with default values
        if (user.totalWithdrawn === undefined) {
          updates[`users/${userId}/totalWithdrawn`] = 0;
          migratedCount++;
          console.log(`Adding totalWithdrawn field for user: ${userId}`);
        }
        
        if (user.earnedMoney === undefined) {
          updates[`users/${userId}/earnedMoney`] = 0;
          migratedCount++;
          console.log(`Adding earnedMoney field for user: ${userId}`);
        }
        
        if (user.addedMoney === undefined) {
          updates[`users/${userId}/addedMoney`] = 0;
          migratedCount++;
          console.log(`Adding addedMoney field for user: ${userId}`);
        }
        
        if (user.approvedWorks === undefined) {
          updates[`users/${userId}/approvedWorks`] = 0;
          migratedCount++;
          console.log(`Adding approvedWorks field for user: ${userId}`);
        }
        
        if (user.role === undefined) {
          updates[`users/${userId}/role`] = 'user';
          migratedCount++;
          console.log(`Adding role field for user: ${userId}`);
        }
        
        if (user.isBlocked === undefined) {
          updates[`users/${userId}/isBlocked`] = false;
          migratedCount++;
          console.log(`Adding isBlocked field for user: ${userId}`);
        }
        
        if (user.bio === undefined) {
          updates[`users/${userId}/bio`] = '';
          migratedCount++;
          console.log(`Adding bio field for user: ${userId}`);
        }
        
        if (user.socialLinks === undefined) {
          updates[`users/${userId}/socialLinks`] = {};
          migratedCount++;
          console.log(`Adding socialLinks field for user: ${userId}`);
        }
        
        if (user.createdAt === undefined) {
          updates[`users/${userId}/createdAt`] = Date.now();
          migratedCount++;
          console.log(`Adding createdAt field for user: ${userId}`);
        }
        
        if (user.profileImage === undefined) {
          updates[`users/${userId}/profileImage`] = null;
          migratedCount++;
          console.log(`Adding profileImage field for user: ${userId}`);
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
        console.log(`Migration completed: ${migratedCount} fields updated`);
      } else {
        console.log(`No profiles needed migration.`);
      }
    } else {
      console.log('No users found in database.');
    }
    
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  }
};

// Also migrate wallet data to ensure consistency
export const migrateWalletProfiles = async () => {
  try {
    console.log('Starting wallet profile migration...');
    
    // Get all wallets
    const walletsSnap = await get(ref(database, 'wallets'));
    
    if (walletsSnap.exists()) {
      const walletsData = walletsSnap.val();
      const updates: Record<string, any> = {};
      
      let migratedCount = 0;
      
      for (const [userId, walletData] of Object.entries(walletsData)) {
        const wallet = walletData as any;
        
        // Ensure wallet has all required fields
        if (wallet.totalWithdrawn === undefined) {
          updates[`wallets/${userId}/totalWithdrawn`] = 0;
          migratedCount++;
          console.log(`Adding totalWithdrawn field for wallet: ${userId}`);
        }
        
        if (wallet.earnedBalance === undefined) {
          updates[`wallets/${userId}/earnedBalance`] = 0;
          migratedCount++;
          console.log(`Adding earnedBalance field for wallet: ${userId}`);
        }
        
        if (wallet.addedBalance === undefined) {
          updates[`wallets/${userId}/addedBalance`] = 0;
          migratedCount++;
          console.log(`Adding addedBalance field for wallet: ${userId}`);
        }
        
        if (wallet.pendingAddMoney === undefined) {
          updates[`wallets/${userId}/pendingAddMoney`] = 0;
          migratedCount++;
          console.log(`Adding pendingAddMoney field for wallet: ${userId}`);
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
        console.log(`Wallet migration completed: ${migratedCount} fields updated`);
      } else {
        console.log('No wallets needed migration.');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error during wallet migration:', error);
    return false;
  }
};

// Run both migrations
export const runMigrations = async () => {
  console.log('Starting migrations...');
  await migrateUserProfiles();
  await migrateWalletProfiles();
  console.log('All migrations completed.');
};