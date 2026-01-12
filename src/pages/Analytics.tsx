import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Users,
  Briefcase,
  IndianRupee,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';

interface CampaignData {
  id: string;
  title: string;
  creatorId: string;
  totalWorkers: number;
  completedWorkers: number;
  rewardPerWorker: number;
  status: string;
  createdAt: number;
  category: string;
}

interface UserData {
  uid: string;
  fullName: string;
  role: string;
  earnedMoney: number;
  addedMoney: number;
  approvedWorks: number;
  createdAt: number;
}

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: number;
}

const Analytics = () => {
  const { profile } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (!profile?.role === 'admin') return;

    const fetchAnalyticsData = async () => {
      try {
        // Fetch campaigns
        const campaignsSnap = await get(ref(database, 'campaigns'));
        if (campaignsSnap.exists()) {
          const campaignsData = campaignsSnap.val();
          const campaignsArray: CampaignData[] = Object.entries(campaignsData)
            .map(([id, data]: [string, any]) => ({
              id,
              ...data,
            }));
          setCampaigns(campaignsArray);
        }

        // Fetch users
        const usersSnap = await get(ref(database, 'users'));
        if (usersSnap.exists()) {
          const usersData = usersSnap.val();
          const usersArray: UserData[] = Object.entries(usersData)
            .map(([uid, data]: [string, any]) => ({
              uid,
              ...data,
            }));
          setUsers(usersArray);
        }

        // Fetch all transactions
        const allTransactions: TransactionData[] = [];
        for (const user of users) {
          const transSnap = await get(ref(database, `transactions/${user.uid}`));
          if (transSnap.exists()) {
            const transData = transSnap.val();
            const userTransactions: TransactionData[] = Object.entries(transData)
              .map(([id, data]: [string, any]) => ({
                id,
                ...data,
              }));
            allTransactions.push(...userTransactions);
          }
        }
        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [profile]);

  // Filter data by time range
  const getFilteredData = (data: any[], dateField: string) => {
    const now = Date.now();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = now - (days * 24 * 60 * 60 * 1000);

    return data.filter(item => item[dateField] >= cutoff);
  };

  // Campaign Performance Data
  const campaignPerformanceData = campaigns.map(campaign => ({
    name: campaign.title.length > 20 ? campaign.title.substring(0, 20) + '...' : campaign.title,
    completion: campaign.totalWorkers > 0 ? (campaign.completedWorkers / campaign.totalWorkers) * 100 : 0,
    reward: campaign.rewardPerWorker,
    workers: campaign.completedWorkers,
  }));

  // Revenue Trends Data
  const revenueData = transactions
    .filter(t => t.status === 'approved' || t.status === 'paid')
    .reduce((acc: any[], transaction) => {
      const date = new Date(transaction.createdAt).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.amount += transaction.amount;
      } else {
        acc.push({ date, amount: transaction.amount });
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // User Productivity Data
  const userProductivityData = users
    .filter(user => user.approvedWorks > 0)
    .sort((a, b) => b.approvedWorks - a.approvedWorks)
    .slice(0, 10)
    .map(user => ({
      name: user.fullName.split(' ')[0],
      works: user.approvedWorks,
      earnings: user.earnedMoney,
    }));

  // Campaign Categories Data
  const categoryData = campaigns.reduce((acc: any[], campaign) => {
    const category = campaign.category || 'General';
    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: category, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Calculate metrics
  const totalRevenue = transactions
    .filter(t => (t.status === 'approved' || t.status === 'paid') && t.type !== 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalUsers = users.length;
  const totalWorks = users.reduce((sum, user) => sum + user.approvedWorks, 0);

  const filteredCampaigns = getFilteredData(campaigns, 'createdAt');
  const filteredUsers = getFilteredData(users, 'createdAt');
  const filteredTransactions = getFilteredData(transactions, 'createdAt');

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                You don't have permission to access this page.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Analytics Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="font-display text-2xl font-bold text-foreground flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {totalRevenue.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-success/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {totalUsers}
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Campaigns</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {activeCampaigns}
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Works</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {totalWorks}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-warning/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="campaigns" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <PieChartIcon className="h-4 w-4" />
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={campaignPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completion" fill="#8884d8" name="Completion %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={userProductivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="works" fill="#82ca9d" name="Completed Works" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Analytics;
