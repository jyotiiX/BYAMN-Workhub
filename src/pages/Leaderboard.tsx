import { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Medal, 
  User,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchTimeBasedLeaderboard } from '@/lib/data-cache';

interface LeaderboardUser {
  uid: string;
  fullName: string;
  profileImage?: string;
  approvedWorks: number;
  rank?: number;
}

const Leaderboard = () => {
  const [dailyLeaders, setDailyLeaders] = useState<LeaderboardUser[]>([]);
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardUser[]>([]);
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Fetch all leaderboards in parallel
        const [dailyData, weeklyData, monthlyData] = await Promise.all([
          fetchTimeBasedLeaderboard('daily'),
          fetchTimeBasedLeaderboard('weekly'),
          fetchTimeBasedLeaderboard('monthly')
        ]);
        
        setDailyLeaders(dailyData);
        setWeeklyLeaders(weeklyData);
        setMonthlyLeaders(monthlyData);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBgClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 2:
        return 'bg-gray-400/10 border-gray-400/30';
      case 3:
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return 'bg-muted/50 border-transparent';
    }
  };

  const LeaderboardList = ({ leaders }: { leaders: LeaderboardUser[] }) => (
    <div className="space-y-3">
      {leaders.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No rankings yet</p>
        </div>
      ) : (
        leaders.map((user) => (
          <div
            key={user.uid}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${getRankBgClass(user.rank || 0)}`}
          >
            <div className="w-10 flex justify-center">
              {getRankIcon(user.rank || 0)}
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.fullName}
                  className="h-12 w-12 object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {user.fullName}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{user.approvedWorks} approved works</span>
              </div>
            </div>
            <Link to={`/profile/${user.uid}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                Profile
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-primary mb-4">
            <Trophy className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Top workers ranked by approved work count
          </p>
        </div>

        {/* Leaderboard Tabs */}
        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted animate-pulse">
                      <div className="w-10 h-10 bg-muted-foreground/20 rounded-full" />
                      <div className="h-12 w-12 bg-muted-foreground/20 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mb-2" />
                        <div className="h-3 bg-muted-foreground/20 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <TabsContent value="daily">
                    <LeaderboardList leaders={dailyLeaders} />
                  </TabsContent>
                  <TabsContent value="weekly">
                    <LeaderboardList leaders={weeklyLeaders} />
                  </TabsContent>
                  <TabsContent value="monthly">
                    <LeaderboardList leaders={monthlyLeaders} />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Leaderboard;