import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Wallet from './Wallet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ref, get, push, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';

// Mock all necessary modules
jest.mock('@/contexts/AuthContext');
jest.mock('@/hooks/use-toast');
jest.mock('firebase/database');
jest.mock('@/lib/firebase', () => ({
  database: {},
}));

// Mock window.location for navigation
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: jest.fn(),
  },
  writable: true,
});

// Mock the Navbar and Footer components
jest.mock('@/components/layout/Navbar', () => ({
  default: ({ children }: { children: React.ReactNode }) => <nav>{children}</nav>,
}));

jest.mock('@/components/layout/Footer', () => ({
  default: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span className={variant}>{children}</span>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Wallet Component Security Tests', () => {
  const mockProfile = {
    uid: 'test-user-id',
    fullName: 'Test User',
    email: 'test@example.com',
  };

  const mockWalletData = {
    earnedBalance: 1000,
    addedBalance: 500,
    pendingAddMoney: 0,
    totalWithdrawn: 0,
  };

  const mockTransactions = [
    {
      id: 'trans1',
      type: 'earning',
      amount: 100,
      status: 'approved',
      description: 'Test earning',
      createdAt: Date.now(),
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock useAuth
    (useAuth as jest.Mock).mockReturnValue({
      profile: mockProfile,
    });

    // Mock useToast
    (useToast as jest.Mock).mockReturnValue({
      toast: jest.fn(),
    });

    // Mock Firebase functions
    (get as jest.Mock).mockResolvedValue({
      exists: () => true,
      val: () => mockWalletData,
    });

    (push as jest.Mock).mockReturnValue({ key: 'mock-key' });
    (set as jest.Mock).mockResolvedValue(Promise.resolve());
    (update as jest.Mock).mockResolvedValue(Promise.resolve());
    (ref as jest.Mock).mockImplementation((_, path) => path);
  });

  it('should validate maximum add money amount', async () => {
    render(<Wallet />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText('My Wallet')).toBeTruthy();
    });

    // Open add money dialog
    const addMoneyButton = screen.getByText('Add Money');
    fireEvent.click(addMoneyButton);

    // Enter an amount higher than the maximum
    const amountInput = screen.getByLabelText('Amount (₹)');
    fireEvent.change(amountInput, { target: { value: '150000' } }); // Above max of 100,000

    const upiInput = screen.getByPlaceholderText('Enter 12-digit transaction ID');
    fireEvent.change(upiInput, { target: { value: '123456789012' } });

    const submitButton = screen.getByText('Submit for Approval');
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect((useToast().toast as jest.Mock).mock.calls[0][0]).toMatchObject({
        title: 'Validation Error',
        description: 'Maximum amount is ₹100,000',
        variant: 'destructive',
      });
    });
  });

  it('should validate maximum withdrawal amount', async () => {
    render(<Wallet />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText('My Wallet')).toBeTruthy();
    });

    // Open withdrawal dialog
    const withdrawButton = screen.getByText('Withdraw');
    fireEvent.click(withdrawButton);

    // Enter an amount higher than the maximum
    const amountInput = screen.getByLabelText('Amount (₹)');
    fireEvent.change(amountInput, { target: { value: '60000' } }); // Above max of 50,000

    const upiInput = screen.getByPlaceholderText('yourname@upi');
    fireEvent.change(upiInput, { target: { value: 'test@upi' } });

    const submitButton = screen.getByText('Request Withdrawal');
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect((useToast().toast as jest.Mock).mock.calls[0][0]).toMatchObject({
        title: 'Validation Error',
        description: 'Maximum withdrawal is ₹50,000',
        variant: 'destructive',
      });
    });
  });

  it('should validate minimum withdrawal amount', async () => {
    render(<Wallet />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText('My Wallet')).toBeTruthy();
    });

    // Mock wallet with sufficient balance
    (get as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      val: () => ({ ...mockWalletData, earnedBalance: 1000 }),
    });

    // Open withdrawal dialog
    const withdrawButton = screen.getByText('Withdraw');
    fireEvent.click(withdrawButton);

    // Enter an amount lower than the minimum
    const amountInput = screen.getByLabelText('Amount (₹)');
    fireEvent.change(amountInput, { target: { value: '100' } }); // Below min of 500

    const upiInput = screen.getByPlaceholderText('yourname@upi');
    fireEvent.change(upiInput, { target: { value: 'test@upi' } });

    const submitButton = screen.getByText('Request Withdrawal');
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect((useToast().toast as jest.Mock).mock.calls[0][0]).toMatchObject({
        title: 'Validation Error',
        description: 'Minimum withdrawal is ₹500',
        variant: 'destructive',
      });
    });
  });

  it('should prevent negative amount inputs', async () => {
    render(<Wallet />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText('My Wallet')).toBeTruthy();
    });

    // Open add money dialog
    const addMoneyButton = screen.getByText('Add Money');
    fireEvent.click(addMoneyButton);

    // Enter a negative amount
    const amountInput = screen.getByLabelText('Amount (₹)');
    fireEvent.change(amountInput, { target: { value: '-100' } });

    const upiInput = screen.getByPlaceholderText('Enter 12-digit transaction ID');
    fireEvent.change(upiInput, { target: { value: '123456789012' } });

    const submitButton = screen.getByText('Submit for Approval');
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect((useToast().toast as jest.Mock).mock.calls[0][0]).toMatchObject({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive amount.',
        variant: 'destructive',
      });
    });
  });
});