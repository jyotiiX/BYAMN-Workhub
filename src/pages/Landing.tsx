import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  TrendingUp,
  Wallet,
  Briefcase,
  Star,
  Shield,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle
} from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: Briefcase,
      title: 'Quick Tasks',
      description: 'Complete simple micro-tasks and earn money instantly. No special skills required.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Wallet,
      title: 'UPI Withdrawals',
      description: 'Withdraw your earnings directly to your UPI. Fast and secure payments.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Shield,
      title: 'Admin Verified',
      description: 'Every task and payment is verified by admins for complete transparency.',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: Users,
      title: 'Create Campaigns',
      description: 'Need work done? Create campaigns and get genuine workers from India.',
      color: 'from-amber-500 to-orange-500'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Active Workers' },
    { value: '₹50L+', label: 'Paid Out' },
    { value: '500+', label: 'Campaigns' },
    { value: '4.8★', label: 'User Rating' }
  ];

  const testimonials = [
    {
      name: 'Rahul Sharma',
      role: 'Freelancer',
      content: 'I\'ve earned over ₹50,000 in just 3 months. This platform has changed my life!',
      rating: 5
    },
    {
      name: 'Priya Patel',
      role: 'Student',
      content: 'Perfect for earning extra money during college breaks. Simple tasks, quick payments.',
      rating: 5
    },
    {
      name: 'Vikram Singh',
      role: 'Part-time Worker',
      content: 'The best micro-task platform I\'ve used. Reliable payments and great support team.',
      rating: 5
    }
  ];

  const steps = [
    {
      step: 1,
      title: 'Create Account',
      description: 'Sign up with your email and verify your account in minutes.'
    },
    {
      step: 2,
      title: 'Browse Campaigns',
      description: 'Find tasks that match your interests and skills.'
    },
    {
      step: 3,
      title: 'Submit Work',
      description: 'Complete tasks and submit proof for admin review.'
    },
    {
      step: 4,
      title: 'Get Paid',
      description: 'Receive earnings in your wallet and withdraw via UPI.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20 overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center">
          {/* Enhanced Background Gradients with Animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background animate-gradient"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.15),transparent_50%)] animate-pulse" style={{animationDuration: '4s'}}></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(74,222,128,0.15),transparent_50%)] animate-pulse" style={{animationDuration: '5s', animationDelay: '1s'}}></div>
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32 relative w-full">
            <div className="max-w-4xl mx-auto text-center">
              {/* Enhanced Badge */}
              <Badge 
                variant="secondary" 
                className="mb-6 sm:mb-8 bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground shadow-lg hover:shadow-2xl transition-all duration-300 px-5 py-2.5 text-sm sm:text-base font-medium inline-flex items-center touch-manipulation hover:scale-105 animate-fade-in"
              >
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-pulse" />
                India's #1 Micro-Task Platform
              </Badge>
              
              {/* Enhanced Heading with better typography */}
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-5 sm:mb-6 leading-[1.1] sm:leading-tight tracking-tight px-2 sm:px-0 animate-fade-in" style={{animationDelay: '0.1s', animationFillMode: 'both'}}>
                Earn Money by Completing{' '}
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
                  Simple Tasks
                </span>
              </h1>
              
              {/* Improved description with better line height */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0 animate-fade-in" style={{animationDelay: '0.2s', animationFillMode: 'both'}}>
                Join thousands of Indians earning money online. Complete micro-tasks from anywhere, anytime. 
                Get paid instantly with secure transactions.
              </p>
              
              {/* Enhanced Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0 animate-fade-in" style={{animationDelay: '0.3s', animationFillMode: 'both'}}>
                <Link to="/auth?mode=register" className="w-full sm:w-auto max-w-sm sm:max-w-none">
                  <Button 
                    size="lg" 
                    className="gap-2 text-base sm:text-lg px-8 py-7 sm:py-6 w-full sm:w-auto shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 touch-manipulation min-h-[56px] font-semibold group relative overflow-hidden before:absolute before:inset-0 before:bg-white/10 before:translate-y-full hover:before:translate-y-0 before:transition-transform before:duration-300"
                  >
                    Start Earning Now
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/campaigns" className="w-full sm:w-auto max-w-sm sm:max-w-none">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="gap-2 text-base sm:text-lg px-8 py-7 sm:py-6 w-full sm:w-auto border-2 hover:bg-accent/5 transition-all duration-300 touch-manipulation min-h-[56px] font-semibold"
                  >
                    Browse Work
                    <Briefcase className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Enhanced Stats with better spacing and hover effects */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-12 mt-12 sm:mt-16 lg:mt-24 px-2 sm:px-0">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center p-3 sm:p-4 rounded-lg hover:bg-muted/30 transition-all duration-300 group touch-manipulation animate-fade-in"
                  style={{animationDelay: `${0.4 + index * 0.1}s`, animationFillMode: 'both'}}
                >
                  <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 sm:py-20 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Enhanced Section Header */}
            <div className="text-center mb-10 sm:mb-12 lg:mb-16 px-4 sm:px-0">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 lg:mb-6 tracking-tight leading-tight">
                How It <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Start earning in 4 simple steps. No experience required.
              </p>
            </div>
            
            {/* Enhanced Step Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-6 max-w-7xl mx-auto px-4 sm:px-0">
              {steps.map((step, index) => (
                <Card 
                  key={index} 
                  className="p-6 sm:p-8 hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/30 group hover:-translate-y-3 bg-card/50 backdrop-blur-sm touch-manipulation active:scale-[0.98] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-accent/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Enhanced Step Number Circle */}
                    <div className="relative mb-6">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 relative z-10">
                        {step.step}
                      </div>
                      <div className="absolute inset-0 h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500"></div>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Enhanced Section Header */}
            <div className="text-center mb-10 sm:mb-12 lg:mb-16 px-4 sm:px-0">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 lg:mb-6 tracking-tight leading-tight">
                Why Choose <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">WorkHub</span>?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                We provide a secure and transparent platform for both workers and campaign creators.
              </p>
            </div>
            
            {/* Enhanced Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="p-5 sm:p-6 md:p-8 hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/30 group hover:-translate-y-3 bg-card/50 backdrop-blur-sm touch-manipulation active:scale-[0.98] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-accent/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
                >
                  {/* Enhanced Icon Container */}
                  <div className="relative mb-5 sm:mb-6">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 relative z-10`}>
                      <feature.icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className={`absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500`}></div>
                  </div>
                  
                  {/* Enhanced Text */}
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 100% Safe & Transparent Section */}
        <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden">
          {/* Enhanced Background matching the design */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#2c4e6f] via-[#3d6586] to-[#4a7a9d]"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-12 sm:mb-14 lg:mb-16 text-white tracking-tight">
              100% Safe & Transparent
            </h2>
            
            {/* Trust Features Grid - 3 columns layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8 max-w-5xl mx-auto mb-12 sm:mb-14 lg:mb-16">
              {[
                'Admin-verified tasks',
                'Secure UPI payments',
                'No fake surveys',
                'Real earning opportunities',
                'Transparent pricing',
                'India-focused platform'
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-center md:justify-start gap-3 text-white/90 group hover:scale-105 transition-all duration-300 cursor-default">
                  <CheckCircle className="h-6 w-6 text-teal-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-base sm:text-lg font-medium group-hover:text-white transition-colors duration-300">{item}</span>
                </div>
              ))}
            </div>
            
            {/* CTA Button */}
            <Link to="/auth?mode=register">
              <Button 
                size="lg" 
                className="bg-teal-500 hover:bg-teal-600 text-white gap-2 text-base sm:text-lg px-10 sm:px-12 py-6 sm:py-7 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold touch-manipulation min-h-[56px] rounded-lg"
              >
                Join BYAMN WorkHub
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Ready to Get Work Done Section */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="max-w-4xl mx-auto p-10 sm:p-12 lg:p-16 text-center shadow-xl border-2 hover:shadow-2xl transition-all duration-500 hover:border-primary/20 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-accent/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 before:pointer-events-none">
              <div className="flex justify-center mb-6 relative z-10">
                <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center relative z-10 hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-8 w-8 text-teal-600" />
                </div>
                <div className="absolute inset-0 h-16 w-16 mx-auto rounded-full bg-teal-400 opacity-20 blur-xl animate-pulse"></div>
              </div>
              
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 tracking-tight relative z-10">
                Ready to Get Work Done?
              </h2>
              
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed relative z-10">
                Create a campaign and get genuine Indian workers to complete your tasks. 
                Pay only for approved work.
              </p>
              
              <div className="relative z-10">
                <Link to="/campaigns/create">
                  <Button 
                    size="lg" 
                    className="bg-[#1e3a5f] hover:bg-[#2d5a7b] text-white gap-2 text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold touch-manipulation min-h-[56px]"
                  > 
                    Create Your Campaign
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
        {/* Enhanced Background with multiple gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Enhanced Heading */}
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 text-white tracking-tight leading-tight">
            Ready to Start Earning?
          </h2>
          
          {/* Enhanced Description */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto text-white/90 leading-relaxed px-2 sm:px-0">
            Join thousands of Indians who are earning money online with our platform. 
            Sign up today and start earning in minutes.
          </p>
          
          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link to="/auth?mode=register" className="w-full sm:w-auto max-w-sm sm:max-w-none">
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white text-primary hover:bg-gray-100 gap-2 text-base sm:text-lg px-8 sm:px-10 py-7 sm:py-7 w-full sm:w-auto shadow-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold group touch-manipulation min-h-[56px]"
              >
                Get Started Now
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/about" className="w-full sm:w-auto max-w-sm sm:max-w-none">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-black hover:bg-white/10 gap-2 text-base sm:text-lg px-8 sm:px-10 py-7 sm:py-7 w-full sm:w-auto backdrop-blur-sm transition-all duration-300 hover:scale-105 font-semibold touch-manipulation min-h-[56px]"
              >
                Learn More
                <Info className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);
};

export default Landing;