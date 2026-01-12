import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Briefcase, 
  Clock,
  CheckCircle2,
  ArrowUpDown
} from 'lucide-react';
import { 
  fetchWalletData, 
  fetchWorks, 
  fetchCampaigns,
} from '@/lib/data-cache';

// --- 1. DEFINING INTERFACES (Fixes all "any" red lines) ---
interface Campaign {
  id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completedWorkers: number;
  totalWorkers: number;
  rewardPerWorker: number;
  creatorId: string;
  status: string;
}

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
  
  // --- 2. STATES WITH PROPER TYPES ---
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [recentWork, setRecentWork] = useState<WorkSubmission[]>([]);
  const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);
  const [isSorted, setIsSorted] = useState(false);
  const [stats, setStats] = useState({
    pendingWorks: 0,
    approvedWorks: 0,
    rejectedWorks: 0,
    activeCampaigns: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.uid) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch Wallet
        const walletData = await fetchWalletData(profile.uid);
        if (walletData) setWallet(walletData);

        // Fetch Works
        const worksData = await fetchWorks(profile.uid);
        if (worksData) {
          const worksArray: WorkSubmission[] = Object.entries(worksData).map(([id, data]: [string, any]) => ({
            id,
            campaignId: data.campaignId || '',
            campaignTitle: data.campaignTitle || '',
            status: data.status || 'pending',
            submittedAt: data.submittedAt || Date.now(),
            reward: data.reward || 0,
          }));
          
          worksArray.sort((a, b) => b.submittedAt - a.submittedAt);
          setRecentWork(worksArray.slice(0, 5));
          
          setStats(prev => ({
            ...prev,
            pendingWorks: worksArray.filter(w => w.status === 'pending').length,
            approvedWorks: worksArray.filter(w => w.status === 'approved').length,
            rejectedWorks: worksArray.filter(w => w.status === 'rejected').length,
          }));
        }

        // Fetch Campaigns
        const campaignsData = await fetchCampaigns();
        if (campaignsData) {
          const allCampaigns = Object.values(campaignsData) as Campaign[];
          const filtered = allCampaigns.filter(
            (c: Campaign) => c.creatorId === profile.uid && c.status === 'active'
          );
          setUserCampaigns(filtered);
          setStats(prev => ({ ...prev, activeCampaigns: filtered.length }));
        }

      } catch (err) {
        console.error("Dashboard Error:", err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile?.uid]);

  // --- 3. SORTING LOGIC ---
  const handleSortByPriority = () => {
    const priorityOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
    const sorted = [...userCampaigns].sort((a, b) => {
      const pA = a.priority || 'low';
      const pB = b.priority || 'low';
      return isSorted ? 0 : priorityOrder[pA] - priorityOrder[pB];
    });
    setUserCampaigns(sorted);
    setIsSorted(!isSorted);
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'high') return <Badge className="bg-destructive text-white border-none text-[10px]">High</Badge>;
    if (priority === 'medium') return <Badge className="bg-amber-500 text-white border-none text-[10px]">Medium</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Low</Badge>;
  };

  const totalBalance = (wallet?.earnedBalance || 0) + (wallet?.addedBalance || 0);

  if (loading && !profile) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {error && <p className="text-destructive mt-2">{error}</p>}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <Card><CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div><p className="text-sm text-muted-foreground">Balance</p><p className="text-2xl font-bold">₹{totalBalance.toFixed(2)}</p></div>
              <Wallet className="text-primary h-8 w-8 opacity-20" />
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold">{stats.approvedWorks}</p></div>
              <CheckCircle2 className="text-success h-8 w-8 opacity-20" />
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold">{stats.pendingWorks}</p></div>
              <Clock className="text-amber-500 h-8 w-8 opacity-20" />
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div><p className="text-sm text-muted-foreground">Active Campaigns</p><p className="text-2xl font-bold">{stats.activeCampaigns}</p></div>
              <Briefcase className="text-blue-500 h-8 w-8 opacity-20" />
            </div>
          </CardContent></Card>
        </div>

        {/* Priority Visualizer Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Campaign Priority</h2>
            <Button variant="outline" size="sm" onClick={handleSortByPriority} className="gap-2">
              <ArrowUpDown className="h-4 w-4" /> {isSorted ? "Clear Sort" : "Sort by Priority"}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userCampaigns.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">No active campaigns.</p>
            ) : (
              userCampaigns.map((camp, idx) => (
                <Card key={idx} className={`border-l-4 ${camp.priority === 'high' ? 'border-l-destructive' : camp.priority === 'medium' ? 'border-l-amber-500' : 'border-l-blue-400'}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-sm truncate w-2/3">{camp.title}</h3>
                      {getPriorityBadge(camp.priority)}
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-muted-foreground">{camp.completedWorkers}/{camp.totalWorkers} Workers</span>
                      <span className="text-primary font-bold">₹{camp.rewardPerWorker}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Table */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Work Activity</CardTitle></CardHeader>
          <CardContent>
            {recentWork.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground text-sm">No activity found.</p>
            ) : (
              <div className="space-y-2">
                {recentWork.map((work) => (
                  <div key={work.id} className="flex justify-between items-center p-3 bg-muted/40 rounded-md">
                    <div>
                      <p className="text-sm font-semibold">{work.campaignTitle}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{new Date(work.submittedAt).toDateString()}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase">{work.status}</Badge>
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

export default Dashboard;