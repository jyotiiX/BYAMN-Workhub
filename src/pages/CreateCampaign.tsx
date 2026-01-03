import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ref, push, set, get, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, IndianRupee, AlertTriangle } from 'lucide-react';
import { deductCampaignBudget, fetchWalletData } from '@/lib/data-cache';

const CreateCampaign = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    category: '',
    totalWorkers: '',
    rewardPerWorker: '',
  });

  useEffect(() => {
    const fetchBalance = async () => {
      if (profile?.uid) {
        try {
          const walletData = await fetchWalletData(profile.uid);
          if (walletData) {
            setWalletBalance(walletData.addedBalance || 0);
          }
        } catch (error) {
          console.error('Error fetching wallet balance:', error);
          toast({ 
            title: 'Error', 
            description: 'Failed to load wallet balance. Please try again.', 
            variant: 'destructive' 
          });
        }
      }
    };
    fetchBalance();
  }, [profile?.uid, toast]);

  const totalCost = (parseInt(form.totalWorkers) || 0) * (parseFloat(form.rewardPerWorker) || 0);
  const canAfford = walletBalance >= totalCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;

    // Additional validation
    const totalWorkers = parseInt(form.totalWorkers);
    const rewardPerWorker = parseFloat(form.rewardPerWorker);
    
    if (isNaN(totalWorkers) || totalWorkers <= 0 || totalWorkers > 10000) {
      toast({ 
        title: 'Invalid Number of Workers', 
        description: 'Please enter a valid number of workers (1-10,000).', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (isNaN(rewardPerWorker) || rewardPerWorker < 0.5 || rewardPerWorker > 10000) {
      toast({ 
        title: 'Invalid Reward', 
        description: 'Reward per worker must be between ₹0.50 and ₹10,000.', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (!canAfford) {
      toast({ title: 'Insufficient Balance', description: 'Add money to your wallet first.', variant: 'destructive' });
      return;
    }

    if (rewardPerWorker < 0.5) {
      toast({ title: 'Invalid Reward', description: 'Minimum reward is ₹0.50 per worker.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Check for rate limiting (check recent campaigns)
      const recentCampaignsSnap = await get(ref(database, `campaigns`));
      if (recentCampaignsSnap.exists()) {
        const recentCampaigns = recentCampaignsSnap.val();
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds
        
        let userRecentCampaignCount = 0;
        for (const [id, campaignData] of Object.entries(recentCampaigns)) {
          const campaign = campaignData as any;
          if (campaign.creatorId === profile.uid && campaign.createdAt > oneHourAgo) {
            userRecentCampaignCount++;
          }
        }
        
        // Limit to 2 campaigns per hour per user
        if (userRecentCampaignCount >= 2) {
          toast({
            title: 'Rate Limit Exceeded',
            description: 'You can only create 2 campaigns per hour.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Create campaign
      const campaignRef = push(ref(database, 'campaigns'));
      await set(campaignRef, {
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        category: form.category,
        totalWorkers: totalWorkers,
        completedWorkers: 0,
        rewardPerWorker: rewardPerWorker,
        totalBudget: totalCost,
        remainingBudget: totalCost,
        creatorId: profile.uid,
        creatorName: profile.fullName,
        status: 'active',
        createdAt: Date.now(),
      });

      // Use atomic operation to deduct from wallet and update campaign budget
      const success = await deductCampaignBudget(campaignRef.key, totalCost, profile.uid, profile.uid);
      
      if (!success) {
        // If the atomic operation failed, remove the campaign
        await update(ref(database, `campaigns/${campaignRef.key}`), { status: 'failed' });
        toast({ 
          title: 'Campaign Creation Failed', 
          description: 'Failed to update wallet balance. Please try again.', 
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }

      toast({ title: 'Campaign Created!', description: 'Your campaign is now live.' });
      navigate('/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({ title: 'Error', description: 'Failed to create campaign.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Create Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={3} required />
                </div>
                <div className="space-y-2">
                  <Label>Instructions for Workers</Label>
                  <Textarea value={form.instructions} onChange={(e) => setForm(p => ({ ...p, instructions: e.target.value }))} rows={4} required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Survey">Survey</SelectItem>
                      <SelectItem value="Testing">Testing</SelectItem>
                      <SelectItem value="Content">Content</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Workers</Label>
                    <Input type="number" min="1" value={form.totalWorkers} onChange={(e) => setForm(p => ({ ...p, totalWorkers: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Reward per Worker (₹)</Label>
                    <Input type="number" min="0.5" step="0.1" value={form.rewardPerWorker} onChange={(e) => setForm(p => ({ ...p, rewardPerWorker: e.target.value }))} required />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex justify-between mb-2">
                    <span>Total Cost:</span>
                    <span className="font-bold flex items-center"><IndianRupee className="h-4 w-4" />{totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your Balance:</span>
                    <span className={`font-bold ${canAfford ? 'text-success' : 'text-destructive'}`}>₹{walletBalance.toFixed(2)}</span>
                  </div>
                </div>

                {!canAfford && totalCost > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">Insufficient balance. Add money to continue.</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading || !canAfford}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Campaign
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateCampaign;