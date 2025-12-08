import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FloatingAIButton } from '@/components/FloatingAIButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { 
  Zap, 
  LayoutDashboard, 
  Settings, 
  MessageCircle, 
  LogOut,
  Menu,
  X,
  DollarSign,
  Newspaper,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { href: '/app', icon: LayoutDashboard, label: 'Today' },
  { href: '/app/money', icon: DollarSign, label: 'Money' },
  { href: '/app/reality', icon: Newspaper, label: 'Reality' },
  { href: '/app/out-and-about', icon: MapPin, label: 'Out & About' },
  { href: '/app/settings', icon: Settings, label: 'Settings' },
];

export function AppShell({ children }: AppShellProps) {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [aiName, setAiName] = useState<string>('Pulse');

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;
      
      // Fetch profile and preferences in parallel
      const [{ data: profile }, { data: prefs }] = await Promise.all([
        supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('preferences')
          .select('ai_name')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);
      
      if (profile) {
        setAvatarUrl(profile.avatar_url);
        setFullName(profile.full_name || '');
      }
      if (prefs?.ai_name) {
        setAiName(prefs.ai_name);
      }
    }
    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = () => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/app" className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-gradient">PulseOS</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-2',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to="/app/settings" className="hidden lg:flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={avatarUrl || undefined} alt={fullName || 'Profile'} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {fullName || user?.email}
              </span>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="hidden md:flex"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-md animate-fade-in">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3',
                        isActive && 'bg-primary/10 text-primary'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="w-full justify-start gap-3 text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 overflow-x-hidden">
        {children}
      </main>

      {/* Floating AI Button */}
      <FloatingAIButton aiName={aiName} />
    </div>
  );
}
