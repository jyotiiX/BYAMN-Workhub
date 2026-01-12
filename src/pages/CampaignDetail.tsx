import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  IndianRupee, 
  Users, 
  CheckCircle,
  ArrowLeft,
  Upload,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { applyToCampaign, submitWorkForCampaign } from '@/lib/data-cache';

/* ----------------------------- TYPES ----------------------------- */

interface Campaign {
  id: string;
  title: string;
  description: string;
  instructions: string;
  creatorId: string;
  creatorName: string;
  totalWorkers: number;
  completedWorkers: number;
  rewardPerWorker: number;
  totalBudget: number;
  remainingBudget: number;
  status: 'active' | 'paused' | 'completed' | 'banned';
  createdAt: number;
  category: string;
}

/* ----------------------------- HELPERS ----------------------------- */

const validateProofUrl = (url: string) => {
  if (!url) return 'Proof URL is required';
  if (!url.startsWith('http')) return 'URL must start with http or https';
  if (url.length < 10) return 'URL looks too short';
  return null;
};

const calculateCampaignProgress = (completed: number, total: number) => {
  if (!total) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
};

const deriveCampaignMeta = (campaign: Campaign) => {
  const spotsLeft = campaign.totalWorkers - campaign.completedWorkers;
  return {
    spotsLeft,
    isFull: spotsLeft <= 0,
    isActive: campaign.status === 'active',
    progress: calculateCampaignProgress(
      campaign.completedWorkers,
      campaign.totalWorkers
    ),
  };
};

const useCampaignAnalytics = (campaign: Campaign | null) => {
  const mounted = useRef(false);

  useEffect(() => {
    if (!campaign) return;

    if (!mounted.current) {
      console.log('📊 Campaign viewed:', {
        id: campaign.id,
        title: campaign.title,
        category: campaign.category,
      });
      mounted.current = true;
    }
  }, [campaign]);
};

const useSafeAsync = () => {
  const active = useRef(true);

  useEffect(() => {
    return () => {
      active.current = false;
    };
  }, []);

  const guard = async <T,>(promise: Promise<T>): Promise<T | null> => {
    try {
      const result = await promise;
      if (!active.current) return null;
      return result;
    } catch (e) {
      if (!active.current) return null;
      throw e;
    }
  };

  return { guard };
};

/* ----------------------------- COMPONENT ----------------------------- */

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { guard } = useSafeAsync();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplied, setIsApplied] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  /* ----------------------------- DERIVED ----------------------------- */

  const meta = useMemo(() => {
    return campaign ? deriveCampaignMeta(campaign) : null;
  }, [campaign]);

  useCampaignAnalytics(campaign);

  /* ----------------------------- FETCH ----------------------------- */

  const fetchCampaign = useCallback(async () => {
    if (!id) return;

    try {
      const campaignSnap = await guard(get(ref(database, `campaigns/${id}`)));

      if (!campaignSnap) return;

      if (campaignSnap.exists()) {
        const data = campaignSnap.val();
        setCampaign({ id, ...data });

        if (profile?.uid) {
          const workSnap = await guard(
            get(ref(database, `works/${profile.uid}/${id}`))
          );
          if (workSnap?.exists()) setIsApplied(true);
        }
      } else {
        toast({
          title: 'Campaign Not Found',
          description: 'The campaign you are looking for does not exist.',
          variant: 'destructive'
        });
        navigate('/campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign details.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [id, profile?.uid, navigate, toast, guard]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  /* ----------------------------- ACTIONS ----------------------------- */

  const handleApply = async () => {
    if (!profile || !campaign || !meta) return;

    if (meta.isFull || !meta.isActive) {
      toast({
        title: 'Campaign unavailable',
        description: 'This campaign cannot accept new workers.',
        variant: 'destructive'
      });
      return;
    }

    if (isApplied) {
      setShowSubmissionForm(true);
      return;
    }

    try {
      const success = await applyToCampaign(
        campaign.id,
        profile.uid,
        profile.fullName,
        campaign.rewardPerWorker,
        profile.uid
      );

      if (success) {
        setIsApplied(true);
        setShowSubmissionForm(true);
        toast({
          title: 'Successfully Applied',
          description: 'You are now part of this campaign.'
        });
      }
    } catch (error: any) {
      console.error('Error applying:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply.',
        variant: 'destructive'
      });
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !campaign) return;

    const validation = validateProofUrl(proofUrl);
    if (validation) {
      setLocalError(validation);
      toast({
        title: 'Invalid proof URL',
        description: validation,
        variant: 'destructive'
      });
      return;
    }

    setLocalError(null);
    setIsSubmitting(true);

    try {
      const success = await submitWorkForCampaign(
        campaign.id,
        profile.uid,
        proofUrl,
        profile.uid
      );

      if (success) {
        toast({
          title: 'Work Submitted',
          description: 'Your work has been sent for review.'
        });

        setShowSubmissionForm(false);
        setProofUrl('');
        fetchCampaign();
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Submission failed.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ----------------------------- UI STATES ----------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!campaign || !meta) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
          <Link to="/campaigns">
            <Button variant="outline">Browse Campaigns</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  /* ----------------------------- MAIN UI ----------------------------- */

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{campaign.title}</h1>
                  <p className="text-muted-foreground">
                    By {campaign.creatorName} · {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge>{campaign.status}</Badge>
              </div>
            </CardHeader>

            <CardContent>
              <p className="mb-6">{campaign.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex gap-2 items-center">
                  <IndianRupee className="h-5 w-5 text-success" />
                  ₹{campaign.rewardPerWorker}
                </div>
                <div className="flex gap-2 items-center">
                  <Users className="h-5 w-5 text-primary" />
                  {campaign.totalWorkers}
                </div>
                <div className="flex gap-2 items-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                  {campaign.completedWorkers}
                </div>
                <div className="flex gap-2 items-center">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  {meta.spotsLeft}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{meta.progress}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                    style={{ width: `${meta.progress}%` }}
                  />
                </div>
              </div>

              {!meta.isActive && (
                <div className="flex gap-2 p-3 mb-6 bg-destructive/10 border border-destructive/20 rounded">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">
                    This campaign is not active.
                  </p>
                </div>
              )}

              {profile ? (
                <div className="space-y-4">
                  {!isApplied && meta.isActive && !meta.isFull && (
                    <Button onClick={handleApply}>Apply to Campaign</Button>
                  )}

                  {isApplied && (
                    <>
                      {showSubmissionForm ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>Submit Your Work</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={handleSubmitWork} className="space-y-4">
                              <div>
                                <Label htmlFor="proof">Proof URL</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id="proof"
                                    value={proofUrl}
                                    onChange={(e) => setProofUrl(e.target.value)}
                                    placeholder="https://..."
                                  />
                                  <Button type="button" variant="outline">
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                </div>
                                {localError && (
                                  <p className="text-xs text-destructive mt-1">{localError}</p>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <Button type="submit" disabled={isSubmitting}>
                                  {isSubmitting ? 'Submitting...' : 'Submit'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowSubmissionForm(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      ) : (
                        <Button variant="outline" onClick={() => setShowSubmissionForm(true)}>
                          Submit Work
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-muted rounded text-center">
                  <p className="mb-4">Sign in to apply</p>
                  <Link to="/auth">
                    <Button>Sign In</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{campaign.instructions}</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CampaignDetail;
