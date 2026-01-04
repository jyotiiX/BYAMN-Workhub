import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, get, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  History,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { z } from 'zod';
import { 
  fetchWalletData, 
  fetchTransactions,
  invalidateUserCache,
  dataCache,
  updateWalletBalance
} from '@/lib/data-cache';

interface WalletData {
  earnedBalance: number;
  addedBalance: number;
  pendingAddMoney: number;
  totalWithdrawn: number;
}

interface Transaction {
  id: string;
  type: 'add_money' | 'withdrawal' | 'earning' | 'campaign_spend';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  description: string;
  createdAt: number;
  upiTransactionId?: string;
  rejectionReason?: string;
}

const addMoneySchema = z.object({
  amount: z.number().min(10, 'Minimum amount is ₹10').max(100000, 'Maximum amount is ₹100,000'),
  upiTransactionId: z.string().min(10, 'Enter a valid UPI Transaction ID').max(50, 'UPI Transaction ID too long'),
});

const withdrawSchema = z.object({
  amount: z.number().min(500, 'Minimum withdrawal is ₹500').max(50000, 'Maximum withdrawal is ₹50,000'),
  upiId: z.string().min(5, 'Enter a valid UPI ID').max(50, 'UPI ID too long'),
});

const Wallet = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [addMoneyForm, setAddMoneyForm] = useState({
    amount: '',
    upiTransactionId: '',
  });

  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    upiId: '',
  });

  useEffect(() => {
    const fetchWalletAndTransactions = async () => {
      if (!profile?.uid) {
        setError('User not authenticated. Please log in to access your wallet.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch wallet data using the data cache
        const walletData = await fetchWalletData(profile.uid);
        if (walletData) {
          setWallet(walletData);
        } else {
          setWallet({
            earnedBalance: 0,
            addedBalance: 0,
            pendingAddMoney: 0,
            totalWithdrawn: 0
          });
        }

        // Fetch transactions using the data cache
        const transactionsData = await fetchTransactions(profile.uid);
        if (transactionsData) {
          const transArray: Transaction[] = Object.entries(transactionsData)
            .map(([id, trans]: [string, any]) => ({
              id,
              ...trans,
            }))
            .filter((trans): trans is Transaction => {
              // Filter out invalid transactions
              return trans && trans.type && trans.amount !== undefined && trans.createdAt !== undefined;
            })
            .sort((a, b) => b.createdAt - a.createdAt);
          setTransactions(transArray);
        } else {
          setTransactions([]);
        }
      } catch (error: any) {
        console.error('Error fetching wallet:', error);
        setError(error.message || 'Failed to load wallet data. Please try again later.');
        // Set default values
        setWallet({
          earnedBalance: 0,
          addedBalance: 0,
          pendingAddMoney: 0,
          totalWithdrawn: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAndTransactions();
  }, [profile?.uid, toast]);

  const handleAddMoney = async () => {
    if (!profile?.uid) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to add money.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(addMoneyForm.amount);
    const result = addMoneySchema.safeParse({
      amount,
      upiTransactionId: addMoneyForm.upiTransactionId,
    });

    if (!result.success) {
      toast({
        title: 'Validation Error',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    // Additional validation for amount
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive amount.',
        variant: 'destructive',
      });
      return;
    }
    
    // Additional validation to prevent excessive amounts
    if (amount > 100000) {
      toast({
        title: 'Amount Exceeds Limit',
        description: 'Maximum amount per request is ₹100,000.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Check for rate limiting (check recent requests)
      const recentTransSnap = await get(ref(database, `transactions/${profile.uid}`));
      if (recentTransSnap.exists()) {
        const recentTrans = recentTransSnap.val();
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds
        
        let recentAddMoneyCount = 0;
        for (const trans of Object.values(recentTrans || {})) {
          const transaction = trans as Transaction;
          if (transaction.type === 'add_money' && transaction.createdAt && transaction.createdAt > oneHourAgo) {
            recentAddMoneyCount++;
          }
        }
        
        // Limit to 3 add money requests per hour
        if (recentAddMoneyCount >= 3) {
          toast({
            title: 'Rate Limit Exceeded',
            description: 'You can only submit 3 add money requests per hour.',
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }
      }

      // Create transaction record first
      const transactionRef = push(ref(database, `transactions/${profile.uid}`));
      const transaction = {
        type: 'add_money',
        amount,
        status: 'pending',
        description: 'Add money request',
        upiTransactionId: addMoneyForm.upiTransactionId,
        createdAt: Date.now(),
      };
      await set(transactionRef, transaction);
      
      // Create admin request
      const requestRef = push(ref(database, 'adminRequests/addMoney'));
      await set(requestRef, {
        userId: profile.uid,
        userName: profile.fullName,
        userEmail: profile.email,
        amount,
        upiTransactionId: addMoneyForm.upiTransactionId,
        status: 'pending',
        createdAt: Date.now(),
        transactionId: requestRef.key, // Use the admin request ID as transactionId
      });

      // Update wallet to reflect pending add money using atomic operation
      await updateWalletBalance(profile.uid, (currentBalance) => ({
        pendingAddMoney: (currentBalance.pendingAddMoney || 0) + amount
      }), profile.uid);

      toast({
        title: 'Request Submitted',
        description: 'Your add money request is pending admin approval.',
      });

      setAddMoneyOpen(false);
      setAddMoneyForm({ amount: '', upiTransactionId: '' });
      
      // Refetch data to update UI
      const updatedWallet = await fetchWalletData(profile.uid);
      if (updatedWallet) {
        setWallet(updatedWallet);
      }
      
      const updatedTransactions = await fetchTransactions(profile.uid);
      if (updatedTransactions) {
        const transArray: Transaction[] = Object.entries(updatedTransactions)
          .map(([id, trans]: [string, any]) => ({
            id,
            ...trans,
          }))
          .filter((trans): trans is Transaction => {
            // Filter out invalid transactions
            return trans && trans.type && trans.amount !== undefined && trans.createdAt !== undefined;
          })
          .sort((a, b) => b.createdAt - a.createdAt);
        setTransactions(transArray);
      }
    } catch (error: any) {
      console.error('Error adding money:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!profile?.uid) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to withdraw money.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!wallet) {
      toast({
        title: 'Wallet Error',
        description: 'Wallet data not loaded. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(withdrawForm.amount);
    const result = withdrawSchema.safeParse({
      amount,
      upiId: withdrawForm.upiId,
    });

    if (!result.success) {
      toast({
        title: 'Validation Error',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    // Additional validation for amount
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive amount.',
        variant: 'destructive',
      });
      return;
    }

    if (amount > wallet.earnedBalance) {
      toast({
        title: 'Insufficient Balance',
        description: 'You cannot withdraw more than your earned balance.',
        variant: 'destructive',
      });
      return;
    }
    
    // Additional validation to prevent excessive withdrawals
    if (amount > 50000) {
      toast({
        title: 'Amount Exceeds Limit',
        description: 'Maximum withdrawal per request is ₹50,000.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Check for rate limiting (check recent requests)
      const recentTransSnap = await get(ref(database, `transactions/${profile.uid}`));
      if (recentTransSnap.exists()) {
        const recentTrans = recentTransSnap.val();
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds
        
        let recentWithdrawCount = 0;
        for (const trans of Object.values(recentTrans || {})) {
          const transaction = trans as Transaction;
          if (transaction.type === 'withdrawal' && transaction.createdAt && transaction.createdAt > oneHourAgo) {
            recentWithdrawCount++;
          }
        }
        
        // Limit to 2 withdrawal requests per hour
        if (recentWithdrawCount >= 2) {
          toast({
            title: 'Rate Limit Exceeded',
            description: 'You can only submit 2 withdrawal requests per hour.',
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }
      }

      // Create transaction record first
      const transactionRef = push(ref(database, `transactions/${profile.uid}`));
      const transaction = {
        type: 'withdrawal',
        amount,
        status: 'pending',
        description: 'Withdrawal request',
        upiId: withdrawForm.upiId,
        createdAt: Date.now(),
      };
      await set(transactionRef, transaction);
      
      // Create admin request
      const requestRef = push(ref(database, 'adminRequests/withdrawals'));
      await set(requestRef, {
        userId: profile.uid,
        userName: profile.fullName,
        userEmail: profile.email,
        amount,
        upiId: withdrawForm.upiId,
        status: 'pending',
        createdAt: Date.now(),
        transactionId: requestRef.key, // Use the admin request ID as transactionId
      });

      // Update wallet to reflect pending withdrawal using atomic operation
      await updateWalletBalance(profile.uid, (currentBalance) => ({
        earnedBalance: (currentBalance.earnedBalance || 0) - amount
      }), profile.uid);

      toast({
        title: 'Withdrawal Requested',
        description: 'Your withdrawal request is pending admin approval.',
      });

      setWithdrawOpen(false);
      setWithdrawForm({ amount: '', upiId: '' });
      
      // Refetch data to update UI
      const updatedWallet = await fetchWalletData(profile.uid);
      if (updatedWallet) {
        setWallet(updatedWallet);
      }
      
      const updatedTransactions = await fetchTransactions(profile.uid);
      if (updatedTransactions) {
        const transArray: Transaction[] = Object.entries(updatedTransactions)
          .map(([id, trans]: [string, any]) => ({
            id,
            ...trans,
          }))
          .filter((trans): trans is Transaction => {
            // Filter out invalid transactions
            return trans && trans.type && trans.amount !== undefined && trans.createdAt !== undefined;
          })
          .sort((a, b) => b.createdAt - a.createdAt);
        setTransactions(transArray);
      }
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-pending/10 text-pending border-pending/30">Pending</Badge>;
      case 'approved':
      case 'paid':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">{status === 'paid' ? 'Paid' : 'Approved'}</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Unknown</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'add_money':
        return <Plus className="h-4 w-4 text-primary" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case 'earning':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'campaign_spend':
        return <ArrowUpRight className="h-4 w-4 text-warning" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const totalBalance = (wallet?.earnedBalance || 0) + (wallet?.addedBalance || 0);

  const transactionStats = {
    earnings: transactions.filter(t => t.type === 'earning').reduce((sum, t) => {
      if (typeof t.amount === 'number' && t.status === 'approved') {
        return sum + t.amount;
      }
      return sum;
    }, 0),
    withdrawals: transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => {
      if (typeof t.amount === 'number' && t.status === 'approved') {
        return sum + t.amount;
      }
      return sum;
    }, 0),
    added: transactions.filter(t => t.type === 'add_money').reduce((sum, t) => {
      if (typeof t.amount === 'number' && t.status === 'approved') {
        return sum + t.amount;
      }
      return sum;
    }, 0),
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading wallet...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">
          My Wallet
        </h1>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-primary text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-primary-foreground/80 mb-1">Total Balance</p>
                  <p className="font-display text-3xl font-bold flex items-center">
                    <IndianRupee className="h-6 w-6" />
                    {totalBalance.toFixed(2)}
                  </p>
                </div>
                <WalletIcon className="h-8 w-8 text-primary-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Earned Balance</p>
                  <p className="font-display text-2xl font-bold text-success flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {(wallet?.earnedBalance || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
                </div>
                <TrendingUp className="h-6 w-6 text-success/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Added Balance</p>
                  <p className="font-display text-2xl font-bold text-primary flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {(wallet?.addedBalance || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">For creating campaigns</p>
                </div>
                <Plus className="h-6 w-6 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Dialog open={addMoneyOpen} onOpenChange={setAddMoneyOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Money
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Money</DialogTitle>
                <DialogDescription>
                  Transfer money via UPI and submit the transaction ID for verification.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Pay to this UPI ID:</p>
                  <p className="font-mono text-lg text-primary">byamn@upi</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Make payment first, then enter details below
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={addMoneyForm.amount}
                    onChange={(e) => setAddMoneyForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upiTxn">UPI Transaction ID</Label>
                  <Input
                    id="upiTxn"
                    placeholder="Enter 12-digit transaction ID"
                    value={addMoneyForm.upiTransactionId}
                    onChange={(e) => setAddMoneyForm(prev => ({ ...prev, upiTransactionId: e.target.value }))}
                  />
                </div>
                <Button onClick={handleAddMoney} className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Submit for Approval
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Money</DialogTitle>
                <DialogDescription>
                  Withdraw your earned balance to your UPI account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                  <p className="text-sm text-muted-foreground">Available for withdrawal</p>
                  <p className="font-display text-2xl font-bold text-success flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {(wallet?.earnedBalance || 0).toFixed(2)}
                  </p>
                </div>
                {(wallet?.earnedBalance || 0) < 500 && (
                  <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                    <p className="text-sm text-warning">
                      Minimum withdrawal amount is ₹500
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="withdrawAmount">Amount (₹)</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    placeholder="Minimum ₹500"
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upiId">Your UPI ID</Label>
                  <Input
                    id="upiId"
                    placeholder="yourname@upi"
                    value={withdrawForm.upiId}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, upiId: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={handleWithdraw} 
                  className="w-full" 
                  disabled={submitting || (wallet?.earnedBalance || 0) < 500}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Request Withdrawal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((trans) => (
                  <div
                    key={trans.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
                  >
                    <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                      {getTransactionIcon(trans.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{trans.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(trans.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold flex items-center justify-end ${
                        trans.type === 'earning' ? 'text-success' : 
                        trans.type === 'withdrawal' ? 'text-destructive' : 'text-foreground'
                      }`}>
                        {trans.type === 'earning' ? '+' : trans.type === 'withdrawal' ? '-' : ''}
                        <IndianRupee className="h-3 w-3" />
                        {trans.amount.toFixed(2)}
                      </p>
                      {getStatusBadge(trans.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Wallet;