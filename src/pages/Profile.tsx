import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  ExternalLink, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Youtube,
  Globe,
  TrendingUp,
  Edit
} from 'lucide-react';

interface UserProfile {
  uid: string;
  fullName: string;
  bio: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    other?: string;
  };
  profileImage?: string;
  approvedWorks: number;
  createdAt: number;
  totalWithdrawn: number; // Changed from optional to required
}

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const targetUserId = userId || currentUserProfile?.uid;
      
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      setIsOwnProfile(!userId || userId === currentUserProfile?.uid);

      try {
        const userSnap = await get(ref(database, `users/${targetUserId}`));
        if (userSnap.exists()) {
          const userData = userSnap.val();
          // Ensure all required fields exist with defaults if missing
          const profileData: UserProfile = {
            uid: targetUserId,
            fullName: userData.fullName || '',
            bio: userData.bio || '',
            socialLinks: userData.socialLinks || {},
            profileImage: userData.profileImage,
            approvedWorks: userData.approvedWorks || 0,
            createdAt: userData.createdAt || Date.now(),
            totalWithdrawn: userData.totalWithdrawn || 0, // Ensure this field exists
          };
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUserProfile?.uid]);

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="animate-pulse">
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center">
                  <div className="h-24 w-24 rounded-full bg-muted mb-4" />
                  <div className="h-6 bg-muted rounded w-48 mb-2" />
                  <div className="h-4 bg-muted rounded w-32" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <User className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Profile Not Found
            </h2>
            <p className="text-muted-foreground">
              This user doesn't exist or the profile is not available.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const socialLinks = Object.entries(profile.socialLinks || {}).filter(([_, url]) => url);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-8 pb-8">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-4">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {profile.profileImage ? (
                      <img 
                        src={profile.profileImage} 
                        alt={profile.fullName}
                        className="h-24 w-24 object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-primary" />
                    )}
                  </div>
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                  {profile.fullName}
                </h1>
                {profile.bio && (
                  <p className="text-muted-foreground max-w-md">
                    {profile.bio}
                  </p>
                )}
                
                {/* Stats */}
                <div className="flex items-center gap-6 mt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-success">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-display text-2xl font-bold">
                        {profile.approvedWorks || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Approved Works</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-display text-2xl font-bold">
                        ₹{profile.totalWithdrawn || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Withdrawn</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Member since {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {isOwnProfile && (
                  <Link to="/profile/edit" className="mt-6">
                    <Button variant="outline" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">
                    Connect
                  </h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {socialLinks.map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      >
                        {getSocialIcon(platform)}
                        <span className="text-sm capitalize">{platform}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;