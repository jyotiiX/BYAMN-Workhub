import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  AlertCircle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

type Priority = 'high' | 'medium' | 'low';

interface WorkSubmission {
  id: string;
  campaignId: string;
  campaignTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reward: number;
  proofLink: string;
  rejectionReason?: string;
  priority: Priority;
}

const priorityOrder: Record<Priority, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

const MyWork = () => {
  const { profile } = useAuth();
  const [works, setWorks] = useState<WorkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
              priority: work.priority ?? 'medium', // fallback for old data
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

  const filteredWorks =
    filter === 'all' ? works : works.filter(w => w.status === filter);

  const sortedWorks = [...filteredWorks].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = a.submittedAt - b.submittedAt;
        break;
      case 'priority':
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const sortByPriority = () => {
    setSortBy('priority');
    setSortOrder('asc');
  };

  const getPriorityBadge = (priority: Priority) => {
    const styles = {
      high: 'border-red-500 text-red-500',
      medium: 'border-yellow-500 text-yellow-500',
      low: 'border-blue-500 text-blue-500',
    };

    return (
      <Badge
        variant="outline"
        className={styles[priority]}
        aria-label={`Priority: ${priority}`}
      >
        {priority.toUpperCase()}
      </Badge>
    );
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">
            My Work
          </h1>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (sortBy === 'date') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('date');
                  setSortOrder('desc');
                }
              }}
              className="gap-1"
            >
              Date
              {sortBy === 'date' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
            </Button>
            <Button
              variant={sortBy === 'priority' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (sortBy === 'priority') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('priority');
                  setSortOrder('asc');
                }
              }}
              className="gap-1"
            >
              Priority
              {sortBy === 'priority' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
            </Button>
          </div>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            {loading ? (
              <p>Loading...</p>
            ) : filteredWorks.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No work found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedWorks.map((work) => (
                  <Card key={work.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {getStatusIcon(work.status)}
                          <div>
                            <h3 className="font-semibold">
                              {work.campaignTitle}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Submitted on {new Date(work.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {getPriorityBadge(work.priority)}
                          <p className="font-semibold flex items-center">
                            <IndianRupee className="h-3 w-3" />
                            {work.reward.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {work.status === 'rejected' && work.rejectionReason && (
                        <div className="mt-3 flex gap-2 p-3 border border-destructive/20 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <p className="text-sm">{work.rejectionReason}</p>
                        </div>
                      )}

                      <div className="mt-3 flex gap-4">
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