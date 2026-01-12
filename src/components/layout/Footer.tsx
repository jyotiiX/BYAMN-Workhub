import { Link } from 'react-router-dom';
import { 
  Heart, 
  Mail, 
  MapPin, 
  Phone, 
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Star,
  Shield,
  Users,
  Briefcase,
  TrendingUp,
  Award,
  Clock,
  IndianRupee,
  MessageCircle,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Calendar,
  Building,
  Smartphone,
  AtSign
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-t from-primary to-primary/90 text-primary-foreground mt-auto">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand and Description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 backdrop-blur-sm">
                <span className="text-xl font-bold text-accent-foreground">B</span>
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">
                  BYAMN <span className="text-accent">WorkHub</span>
                </h2>
                <p className="text-primary-foreground/80 text-sm">Trusted Platform</p>
              </div>
            </div>
            
            <p className="text-primary-foreground/80 leading-relaxed max-w-md">
              India's leading micro-task platform. Connect businesses with skilled workers to complete tasks efficiently. 
              Earn money by completing simple tasks or create campaigns to get work done.
            </p>
            
            <div className="flex items-center gap-3 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>India 🇮🇳</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                <span>Fast Payments</span>
              </div>
            </div>
            
            <div className="pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                Join 10,000+ Users
              </h4>
              <div className="flex items-center gap-2">
                <Link 
                  to="/auth?mode=register" 
                  className="inline-flex items-center gap-2 bg-white text-primary hover:bg-accent/90 transition-colors px-4 py-2 rounded-lg font-medium"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link 
                  to="/campaigns" 
                  className="inline-flex items-center gap-2 bg-primary/20 hover:bg-primary/30 transition-colors px-4 py-2 rounded-lg font-medium border border-primary/30"
                >
                  Browse Work
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/" 
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors group"
                >
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/campaigns" 
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors group"
                >
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <span>Browse Campaigns</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/leaderboard" 
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors group"
                >
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <span>Leaderboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors group"
                >
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/auth?mode=register" 
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors group"
                >
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <span>Start Earning</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/campaigns/create" 
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors group"
                >
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <span>Create Campaign</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Services</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/campaigns" 
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors group"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Find Work</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/campaigns/create" 
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors group"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Post Work</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/wallet" 
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors group"
                >
                  <IndianRupee className="h-4 w-4" />
                  <span>Wallet</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors group"
                >
                  <Users className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/profile" 
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors group"
                >
                  <Users className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a 
                    href="mailto:support@byamn.com" 
                    className="text-primary-foreground/80 hover:text-white transition-colors text-sm"
                  >
                    support@byamn.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a 
                    href="tel:+91-1234567890" 
                    className="text-primary-foreground/80 hover:text-white transition-colors text-sm"
                  >
                    +91-1234567890
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-primary-foreground/80 text-sm">
                    Mumbai, Maharashtra
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Support Hours</p>
                  <p className="text-primary-foreground/80 text-sm">
                    24/7 Available
                  </p>
                </div>
              </li>
            </ul>
            
            <div className="pt-4">
              <h5 className="font-medium mb-3">Follow Us</h5>
              <div className="flex gap-3">
                <a href="#" className="p-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="p-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="p-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="p-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <p className="text-sm text-primary-foreground/70 text-center sm:text-left">
              © {new Date().getFullYear()} BYAMN WorkHub. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link to="/terms" className="text-sm text-primary-foreground/70 hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/privacy" className="text-sm text-primary-foreground/70 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/refund" className="text-sm text-primary-foreground/70 hover:text-white transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
            Made with <Heart className="h-4 w-4 text-destructive fill-destructive" /> for Indian workers
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;