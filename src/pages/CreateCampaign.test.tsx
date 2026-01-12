import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateCampaign from './CreateCampaign';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ref, push, set, get, update } from 'firebase/database';
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

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, ...props }: any) => (
    <textarea value={value} onChange={onChange} {...props} />
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (value: string) => void }) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => null,
}));

describe('CreateCampaign Component Security Tests', () => {
  const mockProfile = {
    uid: 'test-user-id',
    fullName: 'Test User',
    email: 'test@example.com',
  };

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
      val: () => 5000, // Wallet balance
    });

    (push as jest.Mock).mockReturnValue({ key: 'mock-key' });
    (set as jest.Mock).mockResolvedValue(Promise.resolve());
    (update as jest.Mock).mockResolvedValue(Promise.resolve());
    (ref as jest.Mock).mockImplementation((_, path) => path);
  });

  it('should validate maximum number of workers', async () => {
    render(<CreateCampaign />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText('Create Campaign')).toBeTruthy();
    });

    // Fill in form with valid data except for workers
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'Test Campaign' } });

    const descInput = screen.getByLabelText('Description');
    fireEvent.change(descInput, { target: { value: 'Test Description' } });

    const instInput = screen.getByLabelText('Instructions for Workers');
    fireEvent.change(instInput, { target: { value: 'Test Instructions' } });

    const workersInput = screen.getByLabelText('Total Workers');
    fireEvent.change(workersInput, { target: { value: '15000' } }); // Above max of 10,000

    const rewardInput = screen.getByLabelText('Reward per Worker (₹)');
    fireEvent.change(rewardInput, { target: { value: '10' } });

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    // Should show validation error
    await waitFor(() => {
      expect((useToast().toast as jest.Mock).mock.calls[0][0]).toMatchObject({
        title: 'Invalid Number of Workers',
        description: 'Please enter a valid number of workers (1-10,000).',
        variant: 'destructive',
      });
    });
  });

  it('should validate maximum reward per worker', async () => {
    render(<CreateCampaign />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText('Create Campaign')).toBeTruthy();
    });

    // Fill in form with valid data except for reward
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'Test Campaign' } });

    const descInput = screen.getByLabelText('Description');
    fireEvent.change(descInput, { target: { value: 'Test Description' } });

    const instInput = screen.getByLabelText('Instructions for Workers');
    fireEvent.change(instInput, { target: { value: 'Test Instructions' } });

    const workersInput = screen.getByLabelText('Total Workers');
    fireEvent.change(workersInput, { target: { value: '10' } });

    const rewardInput = screen.getByLabelText('Reward per Worker (₹)');
    fireEvent.change(rewardInput, { target: { value: '15000' } }); // Above max of 10,000

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    // Should show validation error
    await waitFor(() => {
      expect((useToast().toast as jest.Mock).mock.calls[0][0]).toMatchObject({
        title: 'Invalid Reward',
        description: 'Reward per worker must be between ₹0.50 and ₹10,000.',
        variant: 'destructive',
      });
    });
  });

  it('should validate minimum reward per worker', async () => {
    render(<CreateCampaign />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText('Create Campaign')).toBeTruthy();
    });

    // Fill in form with valid data except for reward
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'Test Campaign' } });

    const descInput = screen.getByLabelText('Description');
    fireEvent.change(descInput, { target: { value: 'Test Description' } });

    const instInput = screen.getByLabelText('Instructions for Workers');
    fireEvent.change(instInput, { target: { value: 'Test Instructions' } });

    const workersInput = screen.getByLabelText('Total Workers');
    fireEvent.change(workersInput, { target: { value: '10' } });

    const rewardInput = screen.getByLabelText('Reward per Worker (₹)');
    fireEvent.change(rewardInput, { target: { value: '0.1' } }); // Below min of 0.5

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    // Should show validation error
    await waitFor(() => {
      expect((useToast().toast as jest.Mock).mock.calls[0][0]).toMatchObject({
        title: 'Invalid Reward',
        description: 'Reward per worker must be between ₹0.50 and ₹10,000.',
        variant: 'destructive',
      });
    });
  });

  it('should prevent negative values', async () => {
    render(<CreateCampaign />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText('Create Campaign')).toBeTruthy();
    });

    // Fill in form with negative values
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'Test Campaign' } });

    const descInput = screen.getByLabelText('Description');
    fireEvent.change(descInput, { target: { value: 'Test Description' } });

    const instInput = screen.getByLabelText('Instructions for Workers');
    fireEvent.change(instInput, { target: { value: 'Test Instructions' } });

    const workersInput = screen.getByLabelText('Total Workers');
    fireEvent.change(workersInput, { target: { value: '-10' } }); // Negative value

    const rewardInput = screen.getByLabelText('Reward per Worker (₹)');
    fireEvent.change(rewardInput, { target: { value: '-5' } }); // Negative value

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    // Should show validation error
    await waitFor(() => {
      expect((useToast().toast as jest.Mock).mock.calls[0][0]).toMatchObject({
        title: 'Invalid Number of Workers',
        description: 'Please enter a valid number of workers (1-10,000).',
        variant: 'destructive',
      });
    });
  });
});