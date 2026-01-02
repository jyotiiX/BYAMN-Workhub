import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ref, get, query, orderByChild, limitToLast, equalTo } from 'firebase/database';
import { database } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Briefcase, 
  Trophy, 
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  PlusCircle
} from 'lucide-react';

interface WalletData {
  earnedBalance: number;
  addedBalance: number;
  pendingAddMoney: number;
  totalWithdrawn: number;
}

interface WorkSubmission {
  id: string;
  campaignId: string;
  campaignTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reward: number;
}

const Dashboard = () => {
  const { profile } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [recentWork, setRecentWork] = useState<WorkSubmission[]>([]);
  const [stats, setStats] = useState({
    pendingWorks: 0,
    approvedWorks: 0,
    rejectedWorks: 0,
    activeCampaigns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.uid) return;

      try {
        // Fetch wallet
        const walletSnap = await get(ref(database, `wallets/${profile.uid}`));
        if (walletSnap.exists()) {
          setWallet(walletSnap.val());
        }

        // Fetch recent work submissions
        const worksSnap = await get(ref(database, `works/${profile.uid}`));
        if (worksSnap.exists()) {
          const worksData = worksSnap.val();
          const worksArray: WorkSubmission[] = Object.entries(worksData).map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }));
          
          // Sort by date and get recent 5
          worksArray.sort((a, b) => b.submittedAt - a.submittedAt);
          setRecentWork(worksArray.slice(0, 5));

          // Calculate stats
          const pending = worksArray.filter(w => w.status === 'pending').length;
          const approved = worksArray.filter(w => w.status === 'approved').length;
          const rejected = worksArray.filter(w => w.status === 'rejected').length;
          
          setStats(prev => ({
            ...prev,
            pendingWorks: pending,
            approvedWorks: approved,
            rejectedWorks: rejected,
          }));
        }

        // Count active campaigns created by user
        const campaignsSnap = await get(ref(database, 'campaigns'));
        if (campaignsSnap.exists()) {
          const campaignsData = campaignsSnap.val();
          const userCampaigns = Object.values(campaignsData).filter(
            (c: any) => c.creatorId === profile.uid && c.status === 'active'
          );
          setStats(prev => ({ ...prev, activeCampaigns: userCampaigns.length }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile?.uid]);

  const totalBalance = (wallet?.earnedBalance || 0) + (wallet?.addedBalance || 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-pending/10 text-pending border-pending/30">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.fullName?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your WorkHub activity.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                  <p className="font-display text-2xl font-bold text-foreground flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {totalBalance.toFixed(2)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Approved Works</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {profile?.approvedWorks || 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Works</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {stats.pendingWorks}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-pending/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-pending" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">My Campaigns</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {stats.activeCampaigns}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link to="/campaigns">
            <Card className="card-hover cursor-pointer h-full">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Browse Campaigns</h3>
                  <p className="text-sm text-muted-foreground">Find tasks to complete</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/campaigns/create">
            <Card className="card-hover cursor-pointer h-full">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-accent flex items-center justify-center">
                  <PlusCircle className="h-6 w-6 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Create Campaign</h3>
                  <p className="text-sm text-muted-foreground">Get work done by others</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/leaderboard">
            <Card className="card-hover cursor-pointer h-full">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-success flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-success-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Leaderboard</h3>
                  <p className="text-sm text-muted-foreground">See top earners</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Work */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Work</CardTitle>
              <Link to="/my-work">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentWork.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No work submissions yet</p>
                  <Link to="/campaigns">
                    <Button variant="outline" size="sm" className="mt-4">
                      Start Working
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentWork.map((work) => (
                    <div
                      key={work.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {work.campaignTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(work.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground flex items-center">
                          <IndianRupee className="h-3 w-3" />
                          {work.reward}
                        </span>
                        {getStatusBadge(work.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Wallet Summary</CardTitle>
              <Link to="/wallet">
                <Button variant="ghost" size="sm" className="gap-1">
                  Manage Wallet
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-success/5 border border-success/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Earned Balance</p>
                      <p className="font-semibold text-foreground">From completed tasks</p>
                    </div>
                  </div>
                  <p className="font-display text-xl font-bold text-success flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    {(wallet?.earnedBalance || 0).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Added Balance</p>
                      <p className="font-semibold text-foreground">For campaigns</p>
                    </div>
                  </div>
                  <p className="font-display text-xl font-bold text-primary flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    {(wallet?.addedBalance || 0).toFixed(2)}
                  </p>
                </div>

                {(wallet?.pendingAddMoney || 0) > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-pending/5 border border-pending/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-pending/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-pending" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Approval</p>
                        <p className="font-semibold text-foreground">Add money requests</p>
                      </div>
                    </div>
                    <p className="font-display text-xl font-bold text-pending flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {(wallet?.pendingAddMoney || 0).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
