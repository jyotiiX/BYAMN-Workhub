import { 
  validateWalletData,
  validateCampaignData,
  validateTransactionData,
  validateCampaignTitle,
  validateCampaignDescription,
  validateCampaignInstructions,
  validateCampaignCategory,
  validateNumberOfWorkers,
  validateRewardPerWorker,
  validateAmount,
  validateUserAuthorization,
  validateWalletBalance,
  validateWorkData,
  validateMoneyRequestData,
  validateCampaignCreation
} from './validation';

describe('Validation Functions', () => {
  describe('validateWalletData', () => {
    it('should return true for valid wallet data', () => {
      const validWallet = {
        earnedBalance: 100,
        addedBalance: 200,
        pendingAddMoney: 50,
        totalWithdrawn: 25
      };
      
      expect(validateWalletData(validWallet)).toBe(true);
    });

    it('should return false for wallet with negative values', () => {
      const invalidWallet = {
        earnedBalance: -100,
        addedBalance: 200,
        pendingAddMoney: 50,
        totalWithdrawn: 25
      };
      
      expect(validateWalletData(invalidWallet)).toBe(false);
    });

    it('should return false for wallet with non-number values', () => {
      const invalidWallet = {
        earnedBalance: '100',
        addedBalance: 200,
        pendingAddMoney: 50,
        totalWithdrawn: 25
      };
      
      expect(validateWalletData(invalidWallet)).toBe(false);
    });

    it('should return false for missing wallet properties', () => {
      const invalidWallet = {
        earnedBalance: 100,
        addedBalance: 200,
        pendingAddMoney: 50
        // missing totalWithdrawn
      };
      
      expect(validateWalletData(invalidWallet)).toBe(false);
    });

    it('should return false for null or undefined data', () => {
      expect(validateWalletData(null)).toBe(false);
      expect(validateWalletData(undefined)).toBe(false);
    });
  });

  describe('validateCampaignData', () => {
    it('should return true for valid campaign data', () => {
      const validCampaign = {
        title: 'Test Campaign',
        description: 'Test description',
        creatorId: 'user123',
        totalBudget: 1000,
        remainingBudget: 500,
        totalWorkers: 10,
        rewardPerWorker: 10,
        createdAt: Date.now()
      };
      
      expect(validateCampaignData(validCampaign)).toBe(true);
    });

    it('should return false for campaign with invalid title', () => {
      const invalidCampaign = {
        title: '', // Empty title
        description: 'Test description',
        creatorId: 'user123',
        totalBudget: 1000,
        remainingBudget: 500,
        totalWorkers: 10,
        rewardPerWorker: 10,
        createdAt: Date.now()
      };
      
      expect(validateCampaignData(invalidCampaign)).toBe(false);
    });

    it('should return false for campaign with invalid creatorId', () => {
      const invalidCampaign = {
        title: 'Test Campaign',
        description: 'Test description',
        creatorId: 'user@invalid', // Invalid characters
        totalBudget: 1000,
        remainingBudget: 500,
        totalWorkers: 10,
        rewardPerWorker: 10,
        createdAt: Date.now()
      };
      
      expect(validateCampaignData(invalidCampaign)).toBe(false);
    });

    it('should return false for campaign with negative budget', () => {
      const invalidCampaign = {
        title: 'Test Campaign',
        description: 'Test description',
        creatorId: 'user123',
        totalBudget: -100, // Negative
        remainingBudget: 500,
        totalWorkers: 10,
        rewardPerWorker: 10,
        createdAt: Date.now()
      };
      
      expect(validateCampaignData(invalidCampaign)).toBe(false);
    });

    it('should return false for campaign with invalid rewardPerWorker', () => {
      const invalidCampaign = {
        title: 'Test Campaign',
        description: 'Test description',
        creatorId: 'user123',
        totalBudget: 1000,
        remainingBudget: 500,
        totalWorkers: 10,
        rewardPerWorker: 0.1, // Below minimum
        createdAt: Date.now()
      };
      
      expect(validateCampaignData(invalidCampaign)).toBe(false);
    });
  });

  describe('validateTransactionData', () => {
    it('should return true for valid transaction data', () => {
      const validTransaction = {
        type: 'add_money',
        amount: 100,
        status: 'pending',
        createdAt: Date.now()
      };
      
      expect(validateTransactionData(validTransaction)).toBe(true);
    });

    it('should return false for transaction with invalid type', () => {
      const invalidTransaction = {
        type: 'invalid_type',
        amount: 100,
        status: 'pending',
        createdAt: Date.now()
      };
      
      expect(validateTransactionData(invalidTransaction)).toBe(false);
    });

    it('should return false for transaction with invalid status', () => {
      const invalidTransaction = {
        type: 'add_money',
        amount: 100,
        status: 'invalid_status',
        createdAt: Date.now()
      };
      
      expect(validateTransactionData(invalidTransaction)).toBe(false);
    });

    it('should return false for transaction with invalid amount', () => {
      const invalidTransaction = {
        type: 'add_money',
        amount: -100, // Negative
        status: 'pending',
        createdAt: Date.now()
      };
      
      expect(validateTransactionData(invalidTransaction)).toBe(false);
    });

    it('should return false for transaction with amount exceeding max', () => {
      const invalidTransaction = {
        type: 'add_money',
        amount: 200000, // Above maximum
        status: 'pending',
        createdAt: Date.now()
      };
      
      expect(validateTransactionData(invalidTransaction)).toBe(false);
    });
  });

  describe('validateCampaignTitle', () => {
    it('should return true for valid campaign title', () => {
      expect(validateCampaignTitle('Valid Title')).toBe(true);
    });

    it('should return false for title with less than 3 characters', () => {
      expect(validateCampaignTitle('Hi')).toBe(false);
    });

    it('should return false for title with more than 100 characters', () => {
      const longTitle = 'a'.repeat(101);
      expect(validateCampaignTitle(longTitle)).toBe(false);
    });

    it('should return false for title with malicious content', () => {
      expect(validateCampaignTitle('<script>alert("xss")</script>')).toBe(false);
    });
  });

  describe('validateCampaignDescription', () => {
    it('should return true for valid campaign description', () => {
      const validDesc = 'A'.repeat(100);
      expect(validateCampaignDescription(validDesc)).toBe(true);
    });

    it('should return false for description with less than 10 characters', () => {
      expect(validateCampaignDescription('Short')).toBe(false);
    });

    it('should return false for description with more than 2000 characters', () => {
      const longDesc = 'a'.repeat(2001);
      expect(validateCampaignDescription(longDesc)).toBe(false);
    });

    it('should return false for description with malicious content', () => {
      expect(validateCampaignDescription('<script>alert("xss")</script>')).toBe(false);
    });
  });

  describe('validateCampaignInstructions', () => {
    it('should return true for valid campaign instructions', () => {
      const validInst = 'A'.repeat(100);
      expect(validateCampaignInstructions(validInst)).toBe(true);
    });

    it('should return false for instructions with less than 10 characters', () => {
      expect(validateCampaignInstructions('Short')).toBe(false);
    });

    it('should return false for instructions with more than 5000 characters', () => {
      const longInst = 'a'.repeat(5001);
      expect(validateCampaignInstructions(longInst)).toBe(false);
    });

    it('should return false for instructions with malicious content', () => {
      expect(validateCampaignInstructions('<script>alert("xss")</script>')).toBe(false);
    });
  });

  describe('validateCampaignCategory', () => {
    it('should return true for valid category', () => {
      expect(validateCampaignCategory('Social Media')).toBe(true);
      expect(validateCampaignCategory('Survey')).toBe(true);
      expect(validateCampaignCategory('Testing')).toBe(true);
      expect(validateCampaignCategory('Content')).toBe(true);
      expect(validateCampaignCategory('Other')).toBe(true);
    });

    it('should return false for invalid category', () => {
      expect(validateCampaignCategory('Invalid Category')).toBe(false);
    });
  });

  describe('validateNumberOfWorkers', () => {
    it('should return true for valid number of workers', () => {
      expect(validateNumberOfWorkers(1)).toBe(true);
      expect(validateNumberOfWorkers(100)).toBe(true);
      expect(validateNumberOfWorkers(10000)).toBe(true);
    });

    it('should return false for non-integer values', () => {
      expect(validateNumberOfWorkers(1.5)).toBe(false);
    });

    it('should return false for values less than 1', () => {
      expect(validateNumberOfWorkers(0)).toBe(false);
      expect(validateNumberOfWorkers(-1)).toBe(false);
    });

    it('should return false for values greater than 10000', () => {
      expect(validateNumberOfWorkers(10001)).toBe(false);
    });
  });

  describe('validateRewardPerWorker', () => {
    it('should return true for valid reward per worker', () => {
      expect(validateRewardPerWorker(0.5)).toBe(true);
      expect(validateRewardPerWorker(100)).toBe(true);
      expect(validateRewardPerWorker(10000)).toBe(true);
    });

    it('should return false for values less than 0.5', () => {
      expect(validateRewardPerWorker(0.4)).toBe(false);
      expect(validateRewardPerWorker(0)).toBe(false);
      expect(validateRewardPerWorker(-1)).toBe(false);
    });

    it('should return false for values greater than 10000', () => {
      expect(validateRewardPerWorker(10000.1)).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should return true for valid add_money amount', () => {
      expect(validateAmount(10, 'add_money')).toBe(true);
      expect(validateAmount(50000, 'add_money')).toBe(true);
      expect(validateAmount(100000, 'add_money')).toBe(true);
    });

    it('should return false for invalid add_money amount', () => {
      expect(validateAmount(5, 'add_money')).toBe(false); // Below minimum
      expect(validateAmount(100001, 'add_money')).toBe(false); // Above maximum
      expect(validateAmount(-10, 'add_money')).toBe(false); // Negative
    });

    it('should return true for valid withdrawal amount', () => {
      expect(validateAmount(500, 'withdrawal')).toBe(true);
      expect(validateAmount(25000, 'withdrawal')).toBe(true);
      expect(validateAmount(50000, 'withdrawal')).toBe(true);
    });

    it('should return false for invalid withdrawal amount', () => {
      expect(validateAmount(499, 'withdrawal')).toBe(false); // Below minimum
      expect(validateAmount(50001, 'withdrawal')).toBe(false); // Above maximum
      expect(validateAmount(-10, 'withdrawal')).toBe(false); // Negative
    });

    it('should return true for valid earning amount', () => {
      expect(validateAmount(100, 'earning')).toBe(true);
      expect(validateAmount(50000, 'earning')).toBe(true);
    });

    it('should return false for invalid earning amount', () => {
      expect(validateAmount(-10, 'earning')).toBe(false); // Negative
      expect(validateAmount(100001, 'earning')).toBe(false); // Above maximum
    });

    it('should return true for valid campaign_spend amount', () => {
      expect(validateAmount(100, 'campaign_spend')).toBe(true);
      expect(validateAmount(50000, 'campaign_spend')).toBe(true);
    });

    it('should return false for invalid campaign_spend amount', () => {
      expect(validateAmount(-10, 'campaign_spend')).toBe(false); // Negative
      expect(validateAmount(100001, 'campaign_spend')).toBe(false); // Above maximum
    });

    it('should return false for unknown transaction type', () => {
      // @ts-expect-error - testing invalid type
      expect(validateAmount(100, 'invalid_type')).toBe(false);
    });
  });

  describe('validateUserAuthorization', () => {
    it('should return true for valid parameters', () => {
      expect(validateUserAuthorization('user123', 'user123')).toBe(true);
      expect(validateUserAuthorization('user123', 'user456', 'admin')).toBe(true);
    });

    it('should return false for invalid currentUserId', () => {
      expect(validateUserAuthorization('', 'user456')).toBe(false);
      expect(validateUserAuthorization(null as any, 'user456')).toBe(false);
      expect(validateUserAuthorization(undefined as any, 'user456')).toBe(false);
    });

    it('should return false for invalid targetUserId', () => {
      expect(validateUserAuthorization('user123', '')).toBe(false);
      expect(validateUserAuthorization('user123', null as any)).toBe(false);
      expect(validateUserAuthorization('user123', undefined as any)).toBe(false);
    });
  });

  describe('validateWalletBalance', () => {
    it('should return true for sufficient balance', () => {
      expect(validateWalletBalance(1000, 500)).toBe(true);
    });

    it('should return false for insufficient balance', () => {
      expect(validateWalletBalance(100, 500)).toBe(false);
    });

    it('should return false for negative balance', () => {
      expect(validateWalletBalance(-100, 500)).toBe(false);
    });

    it('should return false for negative required amount', () => {
      expect(validateWalletBalance(1000, -500)).toBe(false);
    });
  });

  describe('validateWorkData', () => {
    it('should return true for valid work data', () => {
      const validWork = {
        status: 'pending',
        reward: 100,
        userId: 'user123',
        campaignId: 'camp123'
      };
      
      expect(validateWorkData(validWork)).toBe(true);
    });

    it('should return false for work with invalid status', () => {
      const invalidWork = {
        status: 'invalid_status',
        reward: 100,
        userId: 'user123',
        campaignId: 'camp123'
      };
      
      expect(validateWorkData(invalidWork)).toBe(false);
    });

    it('should return false for work with invalid reward', () => {
      const invalidWork = {
        status: 'pending',
        reward: -100, // Negative
        userId: 'user123',
        campaignId: 'camp123'
      };
      
      expect(validateWorkData(invalidWork)).toBe(false);
    });

    it('should return false for work with reward exceeding maximum', () => {
      const invalidWork = {
        status: 'pending',
        reward: 10001, // Above maximum
        userId: 'user123',
        campaignId: 'camp123'
      };
      
      expect(validateWorkData(invalidWork)).toBe(false);
    });

    it('should return false for work with missing required fields', () => {
      const invalidWork = {
        status: 'pending',
        reward: 100,
        // missing userId
        campaignId: 'camp123'
      };
      
      expect(validateWorkData(invalidWork)).toBe(false);
    });
  });

  describe('validateMoneyRequestData', () => {
    it('should return true for valid add_money request data', () => {
      const validRequest = {
        amount: 100,
        userId: 'user123'
      };
      
      expect(validateMoneyRequestData(validRequest, 'add_money')).toBe(true);
    });

    it('should return false for invalid add_money request data', () => {
      const invalidRequest = {
        amount: 5, // Below minimum
        userId: 'user123'
      };
      
      expect(validateMoneyRequestData(invalidRequest, 'add_money')).toBe(false);
    });

    it('should return true for valid withdrawal request data', () => {
      const validRequest = {
        amount: 1000,
        userId: 'user123'
      };
      
      expect(validateMoneyRequestData(validRequest, 'withdrawal')).toBe(true);
    });

    it('should return false for invalid withdrawal request data', () => {
      const invalidRequest = {
        amount: 499, // Below minimum
        userId: 'user123'
      };
      
      expect(validateMoneyRequestData(invalidRequest, 'withdrawal')).toBe(false);
    });

    it('should return false for request with invalid amount', () => {
      const invalidRequest = {
        amount: -100, // Negative
        userId: 'user123'
      };
      
      expect(validateMoneyRequestData(invalidRequest, 'add_money')).toBe(false);
    });

    it('should return false for request with missing fields', () => {
      const invalidRequest = {
        // missing amount
        userId: 'user123'
      };
      
      expect(validateMoneyRequestData(invalidRequest as any, 'add_money')).toBe(false);
    });
  });

  describe('validateCampaignCreation', () => {
    it('should return isValid: true for valid campaign creation data', () => {
      const validData = {
        title: 'Valid Campaign',
        description: 'A valid campaign description',
        instructions: 'Valid instructions for workers',
        category: 'Social Media',
        totalWorkers: 10,
        rewardPerWorker: 100,
        totalBudget: 1000,
        walletBalance: 2000
      };
      
      const result = validateCampaignCreation(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid campaign creation data', () => {
      const invalidData = {
        title: 'Hi', // Too short
        description: 'A', // Too short
        instructions: 'A', // Too short
        category: 'Invalid Category',
        totalWorkers: -5, // Invalid
        rewardPerWorker: 0.1, // Too low
        totalBudget: 1000,
        walletBalance: 100 // Insufficient
      };
      
      const result = validateCampaignCreation(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(7); // All 7 validations should fail
    });
  });
});