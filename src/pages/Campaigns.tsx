import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce'; // Added this import
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  IndianRupee, 
  Users, 
  Clock,
  ArrowRight,
  Briefcase,
  TrendingUp
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  totalWorkers: number;
  completedWorkers: number;
  rewardPerWorker: number;
  status: 'active' | 'paused' | 'completed' | 'banned';
  createdAt: number;
  category: string;
}

const Campaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high-reward' | 'new'>('all');

  // Use the debounce hook with a 500ms delay
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const campaignsSnap = await get(ref(database, 'campaigns'));
        if (campaignsSnap.exists()) {
          const data = campaignsSnap.val();
          const campaignsArray: Campaign[] = Object.entries(data)
            .map(([id, campaign]: [string, any]) => ({
              id,
              ...campaign,
            }))
            .filter(c => c.status === 'active');
          
          campaignsArray.sort((a, b) => b.createdAt - a.createdAt);
          setCampaigns(campaignsArray);
          setFilteredCampaigns(campaignsArray);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Update this effect to use debouncedSearch
  useEffect(() => {
    let result = [...campaigns];
    
    // Apply debounced search logic
    if (debouncedSearch) {
      result = result.filter(c => 
        c.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.description.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    
    // Apply sorting filters
    switch (filter) {
      case 'high-reward':
        result.sort((a, b) => b.rewardPerWorker - a.rewardPerWorker);
        break;
      case 'new':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }
    
    setFilteredCampaigns(result);
  }, [debouncedSearch, filter, campaigns]);

  const getSpotsLeft = (campaign: Campaign) => {
    return campaign.totalWorkers - campaign.completedWorkers;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Available Campaigns
            </h1>
            <p className="text-muted-foreground">
              Browse and complete tasks to earn money
            </p>
          </div>
          {user && (
            <Link to="/campaigns/create">
              <Button className="gap-2">
                <Briefcase className="h-4 w-4" />
                Create Campaign
              </Button>
            </Link>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'high-reward' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('high-reward')}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              High Reward
            </Button>
            <Button
              variant={filter === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('new')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Newest
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3 mb-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              No Campaigns Found
            </h2>
            <p className="text-muted-foreground mb-6">
              {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Be the first to create a campaign!'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                      {campaign.category || 'General'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-1">
                    {campaign.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {campaign.description}
                  </p>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1 text-sm">
                      <IndianRupee className="h-4 w-4 text-success" />
                      <span className="font-semibold text-success">
                        {campaign.rewardPerWorker}
                      </span>
                      <span className="text-muted-foreground">/task</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{getSpotsLeft(campaign)} spots left</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{campaign.completedWorkers}/{campaign.totalWorkers}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-accent rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(campaign.completedWorkers / campaign.totalWorkers) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  <Link to={`/campaigns/${campaign.id}`}>
                    <Button className="w-full gap-2" variant="outline">
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Campaigns;