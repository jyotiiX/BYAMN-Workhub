import { ref, get, update } from 'firebase/database';
import { database } from './firebase';

/**
 * Migration script to add totalWithdrawn field to existing user profiles
 * This ensures all existing users have the totalWithdrawn field in their profile
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
        
        // Check if totalWithdrawn field exists
        if (user.totalWithdrawn === undefined) {
          // Add totalWithdrawn field with default value of 0
          updates[`users/${userId}/totalWithdrawn`] = 0;
          migratedCount++;
          
          console.log(`Adding totalWithdrawn field for user: ${userId}`);
        } else {
          skippedCount++;
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
        console.log(`Migration completed: ${migratedCount} profiles updated, ${skippedCount} profiles already had the field`);
      } else {
        console.log(`No profiles needed migration. All ${skippedCount} profiles already have the totalWithdrawn field.`);
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
        
        // Ensure wallet has totalWithdrawn field
        if (wallet.totalWithdrawn === undefined) {
          updates[`wallets/${userId}/totalWithdrawn`] = 0;
          migratedCount++;
          
          console.log(`Adding totalWithdrawn field for wallet: ${userId}`);
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
        console.log(`Wallet migration completed: ${migratedCount} wallets updated`);
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