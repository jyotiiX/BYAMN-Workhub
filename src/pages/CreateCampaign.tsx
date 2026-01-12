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
import { ArrowLeft, Loader2, IndianRupee, AlertTriangle, ShieldAlert } from 'lucide-react';
import { deductCampaignBudget, fetchWalletData } from '@/lib/data-cache';
import { sanitizeInput } from '@/lib/utils';
import { validateCampaignTitle, validateCampaignDescription, validateCampaignInstructions, validateCampaignCategory } from '@/lib/validation';

const CreateCampaign = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // --- 2. TYPED STATE ---
  const [form, setForm] = useState<CampaignForm>({
    title: '',
    description: '',
    instructions: '',
    category: '',
    priority: 'medium',
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
            description: 'Failed to load wallet balance.', 
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
    if (!profile?.uid || !profile?.fullName) return;

    // Sanitize inputs for security
    const sanitizedTitle = sanitizeInput(form.title);
    const sanitizedDescription = sanitizeInput(form.description);
    const sanitizedInstructions = sanitizeInput(form.instructions);
    
    // Validate inputs
    if (!validateCampaignTitle(sanitizedTitle)) {
      toast({ 
        title: 'Invalid Title', 
        description: 'Campaign title must be 3-100 characters long and not contain malicious content.', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (!validateCampaignDescription(sanitizedDescription)) {
      toast({ 
        title: 'Invalid Description', 
        description: 'Campaign description must be 10-2000 characters long and not contain malicious content.', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (!validateCampaignInstructions(sanitizedInstructions)) {
      toast({ 
        title: 'Invalid Instructions', 
        description: 'Campaign instructions must be 10-5000 characters long and not contain malicious content.', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (!validateCampaignCategory(form.category)) {
      toast({ 
        title: 'Invalid Category', 
        description: 'Please select a valid campaign category.', 
        variant: 'destructive' 
      });
      return;
    }
    
    const totalWorkers = parseInt(form.totalWorkers);
    const rewardPerWorker = parseFloat(form.rewardPerWorker);
    
    if (isNaN(totalWorkers) || totalWorkers <= 0 || totalWorkers > 10000) {
      toast({ title: 'Invalid Workers', description: 'Enter a number between 1-10,000.', variant: 'destructive' });
      return;
    }
    
    if (!canAfford) {
      toast({ title: 'Insufficient Balance', description: 'Please add money to your wallet.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Rate Limit Check
      const campaignsSnap = await get(ref(database, `campaigns`));
      if (campaignsSnap.exists()) {
        const campaignsData = campaignsSnap.val();
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const recentCount = Object.values(campaignsData).filter((camp: any) => 
          camp.creatorId === profile.uid && camp.createdAt > oneHourAgo
        ).length;
        
        if (recentCount >= 2) {
          toast({ title: 'Rate Limit', description: 'Max 2 campaigns per hour.', variant: 'destructive' });
          setLoading(false);
          return;
        }
      }

      const campaignRef = push(ref(database, 'campaigns'));
      const campaignId = campaignRef.key;
      if (!campaignId) throw new Error("Failed to generate ID");

      await set(campaignRef, {
        title: sanitizedTitle,
        description: sanitizedDescription,
        instructions: sanitizedInstructions,
        category: form.category,
        priority: form.priority,
        totalWorkers,
        completedWorkers: 0,
        rewardPerWorker,
        totalBudget: totalCost,
        remainingBudget: totalCost,
        creatorId: profile.uid,
        creatorName: profile.fullName,
        status: 'active',
        createdAt: Date.now(),
      });

      // Atomic Balance Deduction
      const success = await deductCampaignBudget(campaignId, totalCost, profile.uid);
      
      if (!success) {
        await update(ref(database, `campaigns/${campaignId}`), { status: 'failed' });
        toast({ title: 'Payment Failed', description: 'Could not deduct from wallet.', variant: 'destructive' });
        return;
      }

      toast({ title: 'Success!', description: 'Campaign created successfully.' });
      navigate('/campaigns');
    } catch (error) {
      console.error('Create error:', error);
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
                  <Label className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" /> Task Priority
                  </Label>
                  <Select 
                    value={form.priority} 
                    onValueChange={(v: 'low' | 'medium' | 'high') => setForm(p => ({ ...p, priority: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (General)</SelectItem>
                      <SelectItem value="medium">Medium (Standard)</SelectItem>
                      <SelectItem value="high">High (Urgent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={3} required />
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Workers Count</Label>
                    <Input type="number" value={form.totalWorkers} onChange={(e) => setForm(p => ({ ...p, totalWorkers: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Reward (₹)</Label>
                    <Input type="number" step="0.1" value={form.rewardPerWorker} onChange={(e) => setForm(p => ({ ...p, rewardPerWorker: e.target.value }))} required />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span className="font-bold">₹{totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your Balance:</span>
                    <span className={`font-bold ${canAfford ? 'text-green-600' : 'text-destructive'}`}>₹{walletBalance.toFixed(2)}</span>
                  </div>
                </div>

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