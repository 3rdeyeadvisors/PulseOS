import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, ArrowRight, Sparkles, Calendar, Heart, Users, CheckCircle2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function Index() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setIsSubmitting(true);
    // Simulate waitlist submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('You\'re on the list! We\'ll notify you when we launch.');
    setEmail('');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-gradient">PulseOS</span>
          </div>
          
          <Link to="/auth">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Your AI-Powered Life Assistant</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight">
            Stop Juggling Life.
            <br />
            <span className="text-gradient">Start Living It.</span>
          </h1>
          
          {/* Subheadline - Clear value prop */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            PulseOS brings together your daily tasks, date night ideas, family events, local recommendations, 
            and personalized insights — all in one dashboard that adapts to your life.
          </p>

          {/* Email Capture Form */}
          <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-card border-border/50 text-base"
            />
            <Button type="submit" size="lg" className="h-12 px-6 w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Social Proof */}
          <p className="text-sm text-muted-foreground mb-16">
            Join 500+ people already on the waitlist
          </p>
          
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Daily Action Score</h3>
              <p className="text-sm text-muted-foreground text-center">Track your progress and build momentum with personalized daily goals</p>
            </div>
            
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-pink-500/10">
                <Heart className="h-5 w-5 text-pink-500" />
              </div>
              <h3 className="font-semibold">Date Night Ideas</h3>
              <p className="text-sm text-muted-foreground text-center">Get personalized couple activities and romantic plans near you</p>
            </div>
            
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="font-semibold">Family Events</h3>
              <p className="text-sm text-muted-foreground text-center">Discover kid-friendly activities and family outings in your area</p>
            </div>
            
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <Calendar className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold">Smart Planning</h3>
              <p className="text-sm text-muted-foreground text-center">AI organizes your day based on weather, events, and your schedule</p>
            </div>
          </div>

          {/* How it Works Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-10">How PulseOS Works</h2>
            <div className="grid gap-6 text-left">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                <div>
                  <h3 className="font-semibold mb-1">Tell us about your life</h3>
                  <p className="text-muted-foreground">Share your location, interests, dietary preferences, and household type during a quick onboarding.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                <div>
                  <h3 className="font-semibold mb-1">Get your personalized dashboard</h3>
                  <p className="text-muted-foreground">Wake up to weather, news, tasks, food recommendations, and events — all tailored to you.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
                <div>
                  <h3 className="font-semibold mb-1">Complete actions, boost your score</h3>
                  <p className="text-muted-foreground">Check off tasks, try recommendations, and watch your Daily Action Score grow as you engage with life.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2025 PulseOS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
