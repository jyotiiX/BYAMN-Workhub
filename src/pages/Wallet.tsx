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
  amount: z.number().min(10, 'Minimum amount is ₹10'),
  upiTransactionId: z.string().min(10, 'Enter a valid UPI Transaction ID'),
});

const withdrawSchema = z.object({
  amount: z.number().min(500, 'Minimum withdrawal is ₹500'),
  upiId: z.string().min(5, 'Enter a valid UPI ID'),
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
    const fetchWalletData = async () => {
      if (!profile?.uid) return;

      try {
        // Fetch wallet
        const walletSnap = await get(ref(database, `wallets/${profile.uid}`));
        if (walletSnap.exists()) {
          setWallet(walletSnap.val());
        }

        // Fetch transactions
        const transSnap = await get(ref(database, `transactions/${profile.uid}`));
        if (transSnap.exists()) {
          const data = transSnap.val();
          const transArray: Transaction[] = Object.entries(data)
            .map(([id, trans]: [string, any]) => ({
              id,
              ...trans,
            }))
            .sort((a, b) => b.createdAt - a.createdAt);
          setTransactions(transArray);
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [profile?.uid]);

  const handleAddMoney = async () => {
    if (!profile?.uid) return;

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

    setSubmitting(true);
    try {
      // Create transaction
      const transRef = push(ref(database, `transactions/${profile.uid}`));
      await set(transRef, {
        type: 'add_money',
        amount,
        status: 'pending',
        description: 'Add money request',
        upiTransactionId: addMoneyForm.upiTransactionId,
        createdAt: Date.now(),
      });

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
        transactionId: transRef.key,
      });

      toast({
        title: 'Request Submitted',
        description: 'Your add money request is pending admin approval.',
      });

      setAddMoneyOpen(false);
      setAddMoneyForm({ amount: '', upiTransactionId: '' });
      
      // Refresh data
      const walletSnap = await get(ref(database, `wallets/${profile.uid}`));
      if (walletSnap.exists()) setWallet(walletSnap.val());
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!profile?.uid || !wallet) return;

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

    if (amount > wallet.earnedBalance) {
      toast({
        title: 'Insufficient Balance',
        description: 'You cannot withdraw more than your earned balance.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Create transaction
      const transRef = push(ref(database, `transactions/${profile.uid}`));
      await set(transRef, {
        type: 'withdrawal',
        amount,
        status: 'pending',
        description: 'Withdrawal request',
        upiId: withdrawForm.upiId,
        createdAt: Date.now(),
      });

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
        transactionId: transRef.key,
      });

      toast({
        title: 'Withdrawal Requested',
        description: 'Your withdrawal request is pending admin approval.',
      });

      setWithdrawOpen(false);
      setWithdrawForm({ amount: '', upiId: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
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
        return null;
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
