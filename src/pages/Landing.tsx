import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  IndianRupee,
  Users,
  TrendingUp,
  CheckCircle2,
  Star
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const Landing = () => {
  const features = [
    {
      icon: Zap,
      title: 'Quick Tasks',
      description: 'Complete simple micro-tasks and earn money instantly. No special skills required.',
    },
    {
      icon: IndianRupee,
      title: 'UPI Withdrawals',
      description: 'Withdraw your earnings directly to your UPI. Fast and secure payments.',
    },
    {
      icon: Shield,
      title: 'Admin Verified',
      description: 'Every task and payment is verified by admins for complete transparency.',
    },
    {
      icon: Users,
      title: 'Create Campaigns',
      description: 'Need work done? Create campaigns and get genuine workers from India.',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Active Workers' },
    { value: '₹50L+', label: 'Paid Out' },
    { value: '500+', label: 'Campaigns' },
    { value: '4.8★', label: 'User Rating' },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Create Account',
      description: 'Sign up with your email and verify your account in minutes.',
    },
    {
      step: '02',
      title: 'Browse Campaigns',
      description: 'Find tasks that match your interests and skills.',
    },
    {
      step: '03',
      title: 'Submit Work',
      description: 'Complete tasks and submit proof for admin review.',
    },
    {
      step: '04',
      title: 'Get Paid',
      description: 'Receive earnings in your wallet and withdraw via UPI.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
              <Star className="h-4 w-4 fill-current" />
              India's Trusted Micro-Task Platform
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Earn Money by Completing{' '}
              <span className="text-accent">Simple Tasks</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Join thousands of workers earning real money. Complete micro-tasks, 
              submit proof, and get paid directly to your UPI account.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/auth?mode=register">
                <Button variant="hero" size="xl" className="gap-2">
                  Start Earning Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/campaigns">
                <Button variant="hero-outline" size="xl">
                  Browse Campaigns
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="bg-card rounded-xl p-6 text-center shadow-lg card-hover animate-fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <p className="font-display text-2xl md:text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-accent">WorkHub</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide a secure and transparent platform for both workers and campaign creators.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="bg-card rounded-xl p-6 shadow-md card-hover animate-fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              How It <span className="text-accent">Works</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start earning in 4 simple steps. No experience required.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div 
                key={item.step}
                className="relative animate-fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="bg-card rounded-xl p-6 shadow-md card-hover h-full">
                  <span className="font-display text-5xl font-bold text-accent/20 absolute top-4 right-4">
                    {item.step}
                  </span>
                  <h3 className="font-semibold text-lg mb-2 relative">{item.title}</h3>
                  <p className="text-sm text-muted-foreground relative">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              100% Safe & Transparent
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                'Admin-verified tasks',
                'Secure UPI payments',
                'No fake surveys',
                'Real earning opportunities',
                'Transparent pricing',
                'India-focused platform',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 justify-center">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
            <Link to="/auth?mode=register">
              <Button variant="hero" size="xl" className="gap-2">
                Join BYAMN WorkHub
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-xl text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Work Done?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Create a campaign and get genuine Indian workers to complete your tasks. 
              Pay only for approved work.
            </p>
            <Link to="/campaigns/create">
              <Button size="lg" className="gap-2">
                Create Your Campaign
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
