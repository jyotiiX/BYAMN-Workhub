import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface WorkSubmission {
  id: string;
  campaignId: string;
  campaignTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reward: number;
  proofLink: string;
  rejectionReason?: string;
}

const MyWork = () => {
  const { profile } = useAuth();
  const [works, setWorks] = useState<WorkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    const fetchWorks = async () => {
      if (!profile?.uid) return;

      try {
        const worksSnap = await get(ref(database, `works/${profile.uid}`));
        if (worksSnap.exists()) {
          const data = worksSnap.val();
          const worksArray: WorkSubmission[] = Object.entries(data)
            .map(([id, work]: [string, any]) => ({
              id,
              ...work,
            }))
            .sort((a, b) => b.submittedAt - a.submittedAt);
          setWorks(worksArray);
        }
      } catch (error) {
        console.error('Error fetching works:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorks();
  }, [profile?.uid]);

  const filteredWorks = filter === 'all' 
    ? works 
    : works.filter(w => w.status === filter);

  const stats = {
    total: works.length,
    pending: works.filter(w => w.status === 'pending').length,
    approved: works.filter(w => w.status === 'approved').length,
    rejected: works.filter(w => w.status === 'rejected').length,
    totalEarned: works.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.reward, 0),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-pending" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

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
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">
          My Work
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-display text-2xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="font-display text-2xl font-bold text-pending">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="font-display text-2xl font-bold text-success">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="font-display text-2xl font-bold text-destructive">{stats.rejected}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-success text-success-foreground">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-success-foreground/80">Total Earned</p>
              <p className="font-display text-2xl font-bold flex items-center">
                <IndianRupee className="h-5 w-5" />
                {stats.totalEarned.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-muted rounded-lg" />
                        <div className="flex-1">
                          <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                          <div className="h-4 bg-muted rounded w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredWorks.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="font-display text-xl font-bold text-foreground mb-2">
                  No Work Found
                </h2>
                <p className="text-muted-foreground mb-6">
                  {filter === 'all' 
                    ? "You haven't submitted any work yet" 
                    : `No ${filter} submissions`}
                </p>
                <Link to="/campaigns">
                  <Button>Browse Campaigns</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWorks.map((work) => (
                  <Card key={work.id} className="card-hover">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          {getStatusIcon(work.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {work.campaignTitle}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Submitted on {new Date(work.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`font-semibold flex items-center justify-end ${
                                work.status === 'approved' ? 'text-success' : 'text-foreground'
                              }`}>
                                {work.status === 'approved' && '+'}
                                <IndianRupee className="h-3 w-3" />
                                {work.reward.toFixed(2)}
                              </p>
                              {getStatusBadge(work.status)}
                            </div>
                          </div>

                          {work.status === 'rejected' && work.rejectionReason && (
                            <div className="mt-3 flex items-start gap-2 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                                <p className="text-sm text-muted-foreground">{work.rejectionReason}</p>
                              </div>
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-4">
                            <a
                              href={work.proofLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-accent hover:underline flex items-center gap-1"
                            >
                              View Proof
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <Link 
                              to={`/campaigns/${work.campaignId}`}
                              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                              View Campaign
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default MyWork;
