import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { z } from 'zod';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  bio: z.string().max(200, 'Bio must be less than 200 characters'),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagram: z.string().url('Invalid URL').optional().or(z.literal('')),
  youtube: z.string().url('Invalid URL').optional().or(z.literal('')),
  other: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const ProfileEdit = () => {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    bio: profile?.bio || '',
    linkedin: profile?.socialLinks?.linkedin || '',
    twitter: profile?.socialLinks?.twitter || '',
    instagram: profile?.socialLinks?.instagram || '',
    youtube: profile?.socialLinks?.youtube || '',
    other: profile?.socialLinks?.other || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      toast({
        title: 'Validation Error',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        fullName: formData.fullName,
        bio: formData.bio,
        socialLinks: {
          linkedin: formData.linkedin || undefined,
          twitter: formData.twitter || undefined,
          instagram: formData.instagram || undefined,
          youtube: formData.youtube || undefined,
          other: formData.other || undefined,
        },
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
      navigate('/profile');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Count filled social links
  const filledLinks = [formData.linkedin, formData.twitter, formData.instagram, formData.youtube, formData.other]
    .filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6 gap-2"
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="A short description about yourself"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.bio.length}/200 characters
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Social Links</Label>
                    <span className="text-xs text-muted-foreground">
                      {filledLinks}/4 links (max 4)
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="text-sm text-muted-foreground">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/username"
                        disabled={!formData.linkedin && filledLinks >= 4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="text-sm text-muted-foreground">X (Twitter)</Label>
                      <Input
                        id="twitter"
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleChange}
                        placeholder="https://x.com/username"
                        disabled={!formData.twitter && filledLinks >= 4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="text-sm text-muted-foreground">Instagram</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        placeholder="https://instagram.com/username"
                        disabled={!formData.instagram && filledLinks >= 4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="youtube" className="text-sm text-muted-foreground">YouTube</Label>
                      <Input
                        id="youtube"
                        name="youtube"
                        value={formData.youtube}
                        onChange={handleChange}
                        placeholder="https://youtube.com/@channel"
                        disabled={!formData.youtube && filledLinks >= 4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="other" className="text-sm text-muted-foreground">Other</Label>
                      <Input
                        id="other"
                        name="other"
                        value={formData.other}
                        onChange={handleChange}
                        placeholder="https://yourwebsite.com"
                        disabled={!formData.other && filledLinks >= 4}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    Note: Profile picture can only be changed by admin.
                  </p>
                  <Button type="submit" className="gap-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfileEdit;
