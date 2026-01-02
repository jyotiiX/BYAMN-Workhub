import { Link } from 'react-router-dom';
import { Heart, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                <span className="text-lg font-bold text-accent-foreground">B</span>
              </div>
              <span className="font-display text-xl font-bold">
                BYAMN WorkHub
              </span>
            </div>
            <p className="text-primary-foreground/70 text-sm">
              India's trusted micro-task platform. Earn money by completing simple tasks or create campaigns to get work done.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <MapPin className="h-4 w-4" />
              <span>Made in India 🇮🇳</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <Link to="/campaigns" className="hover:text-primary-foreground transition-colors">
                  Browse Campaigns
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-primary-foreground transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/auth?mode=register" className="hover:text-primary-foreground transition-colors">
                  Start Earning
                </Link>
              </li>
              <li>
                <Link to="/campaigns/create" className="hover:text-primary-foreground transition-colors">
                  Create Campaign
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <Link to="/terms" className="hover:text-primary-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-primary-foreground transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:support@byamn.com" className="hover:text-primary-foreground transition-colors">
                  support@byamn.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/70">
            © {new Date().getFullYear()} BYAMN WorkHub. All rights reserved.
          </p>
          <p className="text-sm text-primary-foreground/70 flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-destructive fill-destructive" /> for Indian workers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
