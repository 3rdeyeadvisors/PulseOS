import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, LogOut } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-gradient">PulseOS</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Welcome to <span className="text-gradient">PulseOS</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Your personal AI-powered life operating system is ready.
            </p>
          </div>

          {/* Placeholder Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-6 rounded-xl bg-card border border-border/50 shadow-card">
              <h3 className="font-semibold mb-2">🎉 Account Created</h3>
              <p className="text-sm text-muted-foreground">
                Your profile and preferences have been initialized. The onboarding flow is coming next.
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border/50 shadow-card">
              <h3 className="font-semibold mb-2">🎨 Theme System Active</h3>
              <p className="text-sm text-muted-foreground">
                8 beautiful themes are ready. Settings page with theme picker is coming soon.
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border/50 shadow-card">
              <h3 className="font-semibold mb-2">🔐 Secure by Default</h3>
              <p className="text-sm text-muted-foreground">
                Row Level Security is enabled. Your data is protected and only accessible to you.
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border/50 shadow-card">
              <h3 className="font-semibold mb-2">🚀 Next Steps</h3>
              <p className="text-sm text-muted-foreground">
                Onboarding wizard, Today dashboard, Settings, and PulseAI chat are coming up.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
