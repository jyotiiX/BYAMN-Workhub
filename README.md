# 🚀 BYAMN WorkHub
# admin panel Credincials 
Email admin1@gmail.com
password 113114
🌐 Website: https://byamn-workhub.vercel.app/

BYAMN WorkHub is an open-source, micro-task and campaign-based platform designed to help students and early learners gain real-world experience by completing verified tasks. Organizations can create campaigns, and contributors can complete tasks to earn rewards after manual verification.

The platform focuses on **transparency, genuine work, and real skill usage**, avoiding fake surveys or misleading ads.

## ✨ Key Features
- Micro-task based campaigns
- Admin-verified submissions
- Transparent reward system
- Leaderboard and progress tracking
- Beginner-friendly contribution structure

## 🛠 Tech Stack
This project is built using:

- Vite
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Firebase
- Vercel (Deployment)

## ⚙️ Local Development Setup

Follow these steps to run the project locally:

```bash
# Clone the repository
git clone <YOUR_REPOSITORY_URL>

# Navigate to the project directory
cd Elite--BYAMN-Workhub

# Install dependencies
bun install

# Start the development server
bun run dev
```

The application will be available at `http://localhost:5173`

## Deployment

This project is deployed on Vercel. For production builds:

```bash
bun run build
```

## Architecture Documentation

### Project Structure

The project follows a modular architecture organized by feature and responsibility:

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication-related components
│   ├── layout/          # Layout components (Navbar, Footer)
│   └── ui/              # shadcn/ui components (buttons, forms, etc.)
├── contexts/            # React contexts for global state
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and configurations
├── pages/               # Route-based page components
└── types/               # TypeScript type definitions
```

#### Page Organization Rationale

Pages are organized by user roles and functionality to maintain clear separation of concerns:

- **Public Pages** (`/`, `/about`, `/privacy`, `/terms`): Marketing and informational content
- **Authentication Pages** (`/auth`): User registration and login flows
- **Protected User Pages** (`/dashboard`, `/campaigns`, `/wallet`, `/profile`, `/my-work`): Core application features requiring authentication
- **Admin Pages** (`/admin`): Administrative functions with elevated permissions

This organization ensures:
- Clear user journey flows
- Easy maintenance and feature isolation
- Scalable routing structure
- Role-based access control

### Firebase Data Schema

The application uses Firebase Realtime Database with the following data models:

#### User Profile (`users/{uid}`)
```typescript
interface UserProfile {
  uid: string;                    // Firebase Auth UID
  email: string;                  // User email
  fullName: string;               // Display name
  bio: string;                    // User biography
  socialLinks: {                  // Social media links
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    other?: string;
  };
  profileImage?: string;          // Profile picture URL
  role: 'user' | 'admin';         // User role
  isBlocked: boolean;             // Account status
  createdAt: number;              // Registration timestamp
  earnedMoney: number;            // Total earnings from approved work
  addedMoney: number;             // Money added for campaigns
  approvedWorks: number;          // Count of approved submissions
}
```

#### Campaign (`campaigns/{campaignId}`)
```typescript
interface Campaign {
  title: string;                  // Campaign title
  description: string;            // Campaign description
  instructions: string;           // Instructions for workers
  category: string;               // Campaign category
  totalWorkers: number;           // Maximum number of workers
  completedWorkers: number;       // Current completion count
  rewardPerWorker: number;        // Payment per task
  totalBudget: number;            // Total campaign budget
  remainingBudget: number;        // Remaining budget
  creatorId: string;              // Campaign creator's UID
  creatorName: string;            // Creator's display name
  status: 'active' | 'paused' | 'completed' | 'banned';
  createdAt: number;              // Creation timestamp
}
```

#### Work Submission (`works/{userId}/{workId}`)
```typescript
interface WorkSubmission {
  campaignId: string;             // Associated campaign ID
  campaignTitle: string;          // Campaign title (cached)
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;            // Submission timestamp
  reward: number;                 // Reward amount
  proofLink: string;              // Link to proof of work
  rejectionReason?: string;       // Reason for rejection (if applicable)
}
```

#### Wallet (`wallets/{userId}`)
```typescript
interface Wallet {
  earnedBalance: number;          // Balance from approved work
  addedBalance: number;           // Balance added for campaigns
  pendingAddMoney: number;        // Pending add money requests
  totalWithdrawn: number;         // Total withdrawn amount
}
```

#### Transaction (`transactions/{userId}/{transactionId}`)
```typescript
interface Transaction {
  type: 'add_money' | 'withdrawal' | 'earning' | 'campaign_spend';
  amount: number;                 // Transaction amount
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  description: string;            // Transaction description
  createdAt: number;              // Transaction timestamp
  upiTransactionId?: string;      // UPI transaction ID (for add money)
  upiId?: string;                 // UPI ID (for withdrawals)
  rejectionReason?: string;       // Rejection reason (if applicable)
}
```

#### Admin Requests (`adminRequests/{type}/{requestId}`)
```typescript
// Add Money Requests
interface AddMoneyRequest {
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  upiTransactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  transactionId: string;          // Linked transaction ID
}

// Withdrawal Requests
interface WithdrawalRequest {
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  upiId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  transactionId: string;          // Linked transaction ID
}
```

### Authentication Flow

The application implements a comprehensive authentication system using Firebase Auth:

#### Authentication Context (`AuthContext`)

The `AuthContext` provides centralized authentication state management:

```typescript
interface AuthContextType {
  user: User | null;              // Firebase Auth user object
  profile: UserProfile | null;    // Extended user profile
  loading: boolean;               // Authentication loading state
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

#### Authentication Flow Steps

1. **Registration**:
   - User provides email, password, and full name
   - Firebase Auth creates user account
   - Email verification sent automatically
   - User profile initialized in database
   - Wallet initialized with zero balances

2. **Login**:
   - User provides email and password
   - Firebase Auth validates credentials
   - User profile fetched from database
   - Authentication state updated in context

3. **Protected Routes**:
   - `ProtectedRoute` component wraps authenticated pages
   - Checks authentication status and user role
   - Redirects unauthenticated users to login
   - Blocks access for insufficient permissions

4. **Profile Management**:
   - Users can update profile information
   - Social links and bio stored in user profile
   - Profile changes sync with database

#### Security Features

- Email verification required for new accounts
- Password reset functionality
- Account blocking capability for admins
- Role-based access control (user/admin)
- Protected API endpoints

### Component Hierarchy

The application uses a hierarchical component structure for maintainability:

#### Layout Components

- **App**: Root component with routing and providers
- **Navbar**: Navigation bar with user menu and links
- **Footer**: Site footer with links and information
- **ProtectedRoute**: Route guard for authenticated content

#### Page Components

Each page component is self-contained with its own:
- State management
- Data fetching logic
- UI rendering
- Event handlers

#### UI Components (shadcn/ui)

The application uses shadcn/ui for consistent, accessible components:
- **Form Components**: Input, Textarea, Select, Checkbox
- **Feedback Components**: Button, Badge, Alert, Toast
- **Layout Components**: Card, Tabs, Dialog, Sheet
- **Data Display**: Table, Chart, Avatar, Progress

#### Component Props Pattern

Components follow TypeScript interfaces for props:

```typescript
interface ButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

### API/Database Interaction Patterns

The application follows consistent patterns for data operations, implemented using Firebase Realtime Database:

#### Data Fetching Patterns

**One-time Data Fetching:**
```typescript
// Fetch user wallet data
const walletSnap = await get(ref(database, `wallets/${userId}`));
if (walletSnap.exists()) {
  const walletData = walletSnap.val();
  setWallet(walletData);
}
```

**Bulk Data with Transformation:**
```typescript
// Fetch and transform work submissions
const worksSnap = await get(ref(database, `works/${userId}`));
if (worksSnap.exists()) {
  const worksData = worksSnap.val();
  const worksArray: WorkSubmission[] = Object.entries(worksData)
    .map(([id, data]: [string, any]) => ({
      id,
      ...data,
    }))
    .sort((a, b) => b.submittedAt - a.submittedAt);
  setWorks(worksArray);
}
```

**Filtered Data Queries:**
```typescript
// Fetch active campaigns created by user
const campaignsSnap = await get(ref(database, 'campaigns'));
if (campaignsSnap.exists()) {
  const campaignsData = campaignsSnap.val();
  const userCampaigns = Object.values(campaignsData)
    .filter((c: any) => c.creatorId === userId && c.status === 'active');
  setActiveCampaigns(userCampaigns.length);
}
```

#### Data Mutation Patterns

**Create Operations:**
```typescript
// Create new campaign
const campaignRef = push(ref(database, 'campaigns'));
await set(campaignRef, {
  title: formData.title,
  description: formData.description,
  creatorId: userId,
  status: 'active',
  createdAt: Date.now(),
  // ... other fields
});
```

**Update Operations:**
```typescript
// Update user profile
await update(ref(database, `users/${userId}`), {
  bio: newBio,
  socialLinks: updatedLinks,
  fullName: newName,
});
```

**Atomic Financial Operations:**
```typescript
// Deduct from wallet when creating campaign
await update(ref(database, `wallets/${userId}`), {
  addedBalance: currentBalance - campaignCost,
});
```

#### Error Handling & Loading States

**Complete Error Handling Pattern:**
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      // Database operations
      const result = await get(ref(database, 'path'));
      // Process data
      setData(result.val());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [dependencies]);
```

#### Data Validation Patterns

**Client-side Form Validation:**
```typescript
import { z } from 'zod';

const campaignSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  rewardPerWorker: z.number().min(0.5, 'Minimum reward is ₹0.50'),
  totalWorkers: z.number().min(1, 'At least 1 worker required'),
});

const handleSubmit = async (formData: any) => {
  const result = campaignSchema.safeParse(formData);
  if (!result.success) {
    // Handle validation errors
    setErrors(result.error.format());
    return;
  }
  // Proceed with submission
};
```

#### Real-time Data Patterns

**Authentication State Listener:**
```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setUser(user);
    if (user) {
      // Fetch user profile when auth state changes
      await fetchProfile(user.uid);
    } else {
      setProfile(null);
    }
    setLoading(false);
  });

  return unsubscribe; // Cleanup listener
}, []);
```

#### Performance Optimization Patterns

**Selective Data Fetching:**
```typescript
// Only fetch required fields
const userSnap = await get(ref(database, `users/${userId}/approvedWorks`));
// Instead of fetching entire user object
```

**Memoized Computations:**
```typescript
const totalBalance = useMemo(() => {
  return (wallet?.earnedBalance || 0) + (wallet?.addedBalance || 0);
}, [wallet?.earnedBalance, wallet?.addedBalance]);
```

**Efficient Data Structures:**
```typescript
// Cache frequently accessed data
const [campaignCache, setCampaignCache] = useState<Map<string, Campaign>>(new Map());

// Update cache when data changes
useEffect(() => {
  if (campaigns.length > 0) {
    const newCache = new Map();
    campaigns.forEach(campaign => newCache.set(campaign.id, campaign));
    setCampaignCache(newCache);
  }
}, [campaigns]);
```

#### Transaction Management

**Multi-step Operations:**
```typescript
const createCampaign = async (campaignData: CampaignData) => {
  const campaignRef = push(ref(database, 'campaigns'));
  const campaignId = campaignRef.key;

  try {
    // Step 1: Create campaign
    await set(campaignRef, {
      ...campaignData,
      id: campaignId,
      status: 'active',
    });

    // Step 2: Deduct from wallet
    await update(ref(database, `wallets/${userId}`), {
      addedBalance: walletBalance - campaignData.totalBudget,
    });

    // Step 3: Create transaction record
    await set(ref(database, `transactions/${userId}/${Date.now()}`), {
      type: 'campaign_spend',
      amount: campaignData.totalBudget,
      description: `Campaign: ${campaignData.title}`,
      status: 'paid',
    });

  } catch (error) {
    // Rollback logic if needed
    console.error('Campaign creation failed:', error);
    throw error;
  }
};
```

#### Security Patterns

**User-scoped Data Access:**
```typescript
// Always scope queries to authenticated user
const userWorksRef = ref(database, `works/${currentUser.uid}`);
// Never: ref(database, 'works') - would access all users' data
```

**Input Sanitization:**
```typescript
const sanitizeInput = (input: string) => {
  return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
};
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
