import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Home, 
  LayoutDashboard, 
  DollarSign, 
  Newspaper, 
  MapPin, 
  Users, 
  Settings, 
  MessageCircle,
  Search,
  ArrowLeft,
  Zap
} from "lucide-react";

const quickLinks = [
  { href: '/app', icon: LayoutDashboard, label: 'Today', description: 'Your daily dashboard' },
  { href: '/app/money', icon: DollarSign, label: 'Money', description: 'Budget & gas prices' },
  { href: '/app/reality', icon: Newspaper, label: 'Reality', description: 'News & updates' },
  { href: '/app/out-and-about', icon: MapPin, label: 'Out & About', description: 'Local recommendations' },
  { href: '/app/friends', icon: Users, label: 'Friends', description: 'Social & leaderboards' },
  { href: '/app/chat', icon: MessageCircle, label: 'AI Chat', description: 'Talk to Pulse AI' },
  { href: '/app/settings', icon: Settings, label: 'Settings', description: 'Customize your experience' },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to chat with the search query
      navigate('/app/chat', { state: { initialMessage: `Help me find: ${searchQuery}` } });
    }
  };

  const filteredLinks = quickLinks.filter(link => 
    link.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-destructive/5 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-gradient">PulseOS</span>
          </Link>
          
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          {/* 404 Display */}
          <div className="mb-8">
            <h1 className="text-8xl sm:text-9xl font-bold text-gradient mb-4">404</h1>
            <p className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
              Page Not Found
            </p>
            <p className="text-muted-foreground">
              The page <code className="px-2 py-1 rounded bg-muted text-sm">{location.pathname}</code> doesn't exist.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="mb-10 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search or ask Pulse AI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-24 h-12"
              />
              <Button 
                type="submit" 
                size="sm" 
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Quick Links */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Quick Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(searchQuery ? filteredLinks : quickLinks).map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 hover:bg-card hover:border-border transition-all group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{link.label}</p>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                </Link>
              ))}
            </div>
            {searchQuery && filteredLinks.length === 0 && (
              <p className="text-muted-foreground mt-4">
                No matching pages found. Try asking Pulse AI for help!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/">
              <Button variant="outline" size="lg">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <Link to="/app">
              <Button size="lg">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Need help? <Link to="/contact" className="text-primary hover:underline">Contact Support</Link></p>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
