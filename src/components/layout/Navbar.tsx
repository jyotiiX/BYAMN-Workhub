import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Menu,
  X,
  User,
  Wallet,
  LayoutDashboard,
  Trophy,
  LogOut,
  Briefcase,
  PlusCircle,
  Shield,
  Home,
  Search,
  Bell,
  ChevronDown,
  Moon,
  Sun,
  Settings,
  Activity,
  Users
} from 'lucide-react';
import { useTheme } from 'next-themes';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/about', label: 'About', icon: Users },
    { path: '/campaigns', label: 'Campaigns', icon: Briefcase },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const userLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/my-work', label: 'My Work', icon: Activity },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-300 ${
      scrolled ? 'bg-background/90 border-b border-border/50 shadow-sm' : 'bg-transparent border-b-0'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-accent">
                <span className="text-lg font-bold text-primary-foreground">B</span>
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                BYAMN <span className="text-accent">WorkHub</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </div>
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hidden md:flex h-9 w-9 mr-1"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 transition-all" />
              ) : (
                <Moon className="h-4 w-4 transition-all" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {user ? (
              <>
                <Link to="/campaigns/create">
                  <Button variant="outline" size="sm" className="hidden md:flex gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create Campaign
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 relative group">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 group-hover:ring-2 group-hover:ring-primary transition-all">
                        {profile?.profileImage ? (
                          <img 
                            src={profile.profileImage} 
                            alt={profile.fullName}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <span className="max-w-[100px] truncate text-sm font-medium hidden md:block">
                        {profile?.fullName || 'User'}
                      </span>
                      <ChevronDown className="h-4 w-4 hidden md:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b border-border/30">
                      <p className="text-sm font-medium">{profile?.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                    </div>
                    <div className="py-1">
                      {userLinks.map((link) => (
                        <DropdownMenuItem key={link.path} asChild>
                          <Link to={link.path} className="flex items-center gap-2">
                            <link.icon className="h-4 w-4" />
                            {link.label}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {profile?.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/analytics" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
