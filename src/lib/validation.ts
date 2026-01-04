import { sanitizeInput } from './utils';

// Validation functions for financial operations
export const validateWalletData = (data: any): data is any => {
  if (!data) return false;
  
  return (
    typeof data.earnedBalance === 'number' &&
    typeof data.addedBalance === 'number' &&
    typeof data.pendingAddMoney === 'number' &&
    typeof data.totalWithdrawn === 'number' &&
    data.earnedBalance >= 0 &&
    data.addedBalance >= 0 &&
    data.pendingAddMoney >= 0 &&
    data.totalWithdrawn >= 0
  );
};

export const validateCampaignData = (data: any): data is any => {
  if (!data) return false;
  
  return (
    typeof data.title === 'string' && data.title.length > 0 && data.title.length <= 100 &&
    typeof data.description === 'string' && data.description.length > 0 && data.description.length <= 1000 &&
    typeof data.creatorId === 'string' && /^[a-zA-Z0-9]+$/.test(data.creatorId) &&
    typeof data.totalBudget === 'number' && data.totalBudget >= 0 &&
    typeof data.remainingBudget === 'number' && data.remainingBudget >= 0 &&
    typeof data.totalWorkers === 'number' && data.totalWorkers > 0 && data.totalWorkers <= 10000 &&
    typeof data.rewardPerWorker === 'number' && data.rewardPerWorker >= 0.5 && data.rewardPerWorker <= 10000 &&
    typeof data.createdAt === 'number' && data.createdAt >= 0
  );
};

export const validateTransactionData = (data: any): data is any => {
  if (!data) return false;
  
  return (
    typeof data.type === 'string' &&
    ['add_money', 'withdrawal', 'earning', 'campaign_spend'].includes(data.type) &&
    typeof data.amount === 'number' && data.amount > 0 && data.amount <= 100000 &&
    typeof data.status === 'string' &&
    ['pending', 'approved', 'rejected', 'paid'].includes(data.status) &&
    typeof data.createdAt === 'number' && data.createdAt >= 0
  );
};

export const validateCampaignTitle = (title: string): boolean => {
  // Title should not be empty and should not contain malicious content
  if (!title || title.trim().length < 3 || title.trim().length > 100) {
    return false;
  }
  
  // Sanitize and check for malicious content
  const sanitized = sanitizeInput(title);
  return sanitized === title.trim(); // Ensure sanitization didn't remove anything
};

export const validateCampaignDescription = (description: string): boolean => {
  // Description should not be empty and should not contain malicious content
  if (!description || description.trim().length < 10 || description.trim().length > 2000) {
    return false;
  }
  
  // Sanitize and check for malicious content
  const sanitized = sanitizeInput(description);
  return sanitized === description.trim(); // Ensure sanitization didn't remove anything
};

export const validateCampaignInstructions = (instructions: string): boolean => {
  // Instructions should not be empty and should not contain malicious content
  if (!instructions || instructions.trim().length < 10 || instructions.trim().length > 5000) {
    return false;
  }
  
  // Sanitize and check for malicious content
  const sanitized = sanitizeInput(instructions);
  return sanitized === instructions.trim(); // Ensure sanitization didn't remove anything
};

export const validateCampaignCategory = (category: string): boolean => {
  const validCategories = ['Social Media', 'Survey', 'Testing', 'Content', 'Other'];
  return validCategories.includes(category);
};

export const validateNumberOfWorkers = (totalWorkers: number): boolean => {
  return Number.isInteger(totalWorkers) && totalWorkers > 0 && totalWorkers <= 10000;
};

export const validateRewardPerWorker = (rewardPerWorker: number): boolean => {
  return typeof rewardPerWorker === 'number' && rewardPerWorker >= 0.5 && rewardPerWorker <= 10000;
};

export const validateAmount = (amount: number, type: 'add_money' | 'withdrawal' | 'earning' | 'campaign_spend'): boolean => {
  if (typeof amount !== 'number' || amount <= 0) return false;
  
  switch (type) {
    case 'add_money':
      return amount >= 10 && amount <= 100000;
    case 'withdrawal':
      return amount >= 500 && amount <= 50000;
    case 'earning':
    case 'campaign_spend':
      return amount <= 100000; // Reasonable limit for earnings and campaign spending
    default:
      return false;
  }
};

export const validateUserAuthorization = (currentUserId: string, targetUserId: string, requiredRole?: 'admin'): boolean => {
  // Validate input parameters
  if (!currentUserId || typeof currentUserId !== 'string') {
    console.error('Invalid currentUserId provided for authorization check');
    return false;
  }
  
  if (!targetUserId || typeof targetUserId !== 'string') {
    console.error('Invalid targetUserId provided for authorization check');
    return false;
  }

  // Basic parameter validation passed
  return true;
};

export const validateWalletBalance = (balance: number, requiredAmount: number): boolean => {
  return typeof balance === 'number' && 
         typeof requiredAmount === 'number' &&
         balance >= requiredAmount && 
         balance >= 0 &&
         requiredAmount >= 0;
};

export const validateWorkData = (workData: any): boolean => {
  if (!workData) return false;
  
  return (
    typeof workData.status === 'string' &&
    ['pending', 'approved', 'rejected'].includes(workData.status) &&
    typeof workData.reward === 'number' &&
    workData.reward > 0 &&
    workData.reward <= 10000 &&
    typeof workData.userId === 'string' &&
    typeof workData.campaignId === 'string'
  );
};

export const validateMoneyRequestData = (requestData: any, type: 'add_money' | 'withdrawal'): boolean => {
  if (!requestData) return false;
  
  // Basic validation for both types
  if (typeof requestData.amount !== 'number' || typeof requestData.userId !== 'string') {
    return false;
  }
  
  // Type-specific validation
  if (type === 'add_money') {
    return requestData.amount >= 10 && requestData.amount <= 100000;
  } else if (type === 'withdrawal') {
    return requestData.amount >= 500 && requestData.amount <= 50000;
  }
  
  return false;
};

// Combined validation function for campaign creation
export const validateCampaignCreation = (campaignData: {
  title: string;
  description: string;
  instructions: string;
  category: string;
  totalWorkers: number;
  rewardPerWorker: number;
  totalBudget: number;
  walletBalance: number;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!validateCampaignTitle(campaignData.title)) {
    errors.push('Campaign title must be 3-100 characters long and not contain malicious content.');
  }
  
  if (!validateCampaignDescription(campaignData.description)) {
    errors.push('Campaign description must be 10-2000 characters long and not contain malicious content.');
  }
  
  if (!validateCampaignInstructions(campaignData.instructions)) {
    errors.push('Campaign instructions must be 10-5000 characters long and not contain malicious content.');
  }
  
  if (!validateCampaignCategory(campaignData.category)) {
    errors.push('Please select a valid campaign category.');
  }
  
  if (!validateNumberOfWorkers(campaignData.totalWorkers)) {
    errors.push('Total workers must be between 1 and 10,000.');
  }
  
  if (!validateRewardPerWorker(campaignData.rewardPerWorker)) {
    errors.push('Reward per worker must be between ₹0.50 and ₹10,000.');
  }
  
  if (!validateWalletBalance(campaignData.walletBalance, campaignData.totalBudget)) {
    errors.push('Insufficient wallet balance for campaign creation.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};