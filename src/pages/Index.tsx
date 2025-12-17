import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, Sparkles, Calendar, Heart, Users, TrendingUp, Trophy, UserPlus, Send, BadgeCheck, MapPin, Utensils, Music, Loader2, Crown, Check, X } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect authenticated users to app or onboarding
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (user && !loading) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile?.onboarding_completed) {
          navigate('/app', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      }
    };
    
    checkAndRedirect();
  }, [user, loading, navigate]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user exists, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const freeFeatures = [
    'Personalized dashboard',
    'Weather & news updates',
    'Task management',
    'Daily Action Score',
    'Food recommendations',
  ];

  const premiumFeatures = [
    'Everything in Free',
    'AI Personal Assistant',
    'Friend connections',
    'Activity invites',
    'Weekly leaderboards',
    'Priority support',
  ];

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
            PulseOS brings together your daily tasks, local recommendations, social connections, 
            and personalized insights — all in one dashboard that adapts to your life.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to="/auth">
              <Button size="lg" className="h-12 px-8 text-base">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <p className="text-sm text-muted-foreground mb-16">
            Free tier available • 14-day Premium trial
          </p>
          
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Daily Action Score</h3>
              <p className="text-sm text-muted-foreground text-center">Track your progress and build momentum with personalized daily goals</p>
            </div>
            
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="font-semibold">Weekly Leaderboards</h3>
              <p className="text-sm text-muted-foreground text-center">Compete with friends and see who can achieve the most each week</p>
            </div>
            
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="font-semibold">Connect with Friends</h3>
              <p className="text-sm text-muted-foreground text-center">Find friends by username or email and build your social circle</p>
            </div>
            
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <Send className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold">Activity Invites</h3>
              <p className="text-sm text-muted-foreground text-center">Invite friends to restaurants, events, and activities with one tap</p>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mt-20 max-w-4xl mx-auto" id="pricing">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Simple Pricing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
              Start free and upgrade when you're ready to unlock the full power of your AI assistant.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Free Plan */}
              <div className="p-6 rounded-2xl bg-card border border-border text-left">
                <h3 className="text-xl font-bold mb-2">Free</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Perfect for getting started</p>
                
                <Link to="/auth">
                  <Button variant="outline" className="w-full mb-6">
                    Get Started
                  </Button>
                </Link>
                
                <ul className="space-y-3">
                  {freeFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <X className="h-4 w-4 flex-shrink-0" />
                    <span>AI Personal Assistant</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <X className="h-4 w-4 flex-shrink-0" />
                    <span>Friend connections</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <X className="h-4 w-4 flex-shrink-0" />
                    <span>Activity invites</span>
                  </li>
                </ul>
              </div>
              
              {/* Premium Plan */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-2 border-primary/30 text-left relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">Premium</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold">$14.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">14-day free trial included</p>
                
                <Link to="/auth">
                  <Button className="w-full mb-6">
                    <Crown className="h-4 w-4 mr-2" />
                    Start Free Trial
                  </Button>
                </Link>
                
                <ul className="space-y-3">
                  {premiumFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className={feature === 'AI Personal Assistant' ? 'font-medium' : ''}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* AI Assistant Feature Highlight */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="p-4 rounded-2xl bg-primary/20 border border-primary/30">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-3">
                    <Crown className="h-3 w-3" />
                    Premium Feature
                  </div>
                  <h3 className="text-xl font-bold mb-2">Your AI That Actually Knows You</h3>
                  <p className="text-muted-foreground mb-4">
                    Ask anything — from what to eat tonight to how to tackle your busiest day. 
                    Get instant answers tailored to your location, preferences, and schedule. 
                    No more generic advice. Just smart, personalized help whenever you need it.
                  </p>
                  <Link to="/auth">
                    <Button variant="outline" size="sm">
                      Try Free for 14 Days
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Social Features Highlight */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-500">Premium Social Features</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Life is Better Together</h2>
            <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
              Connect with friends, compete on leaderboards, and plan activities together. 
              Unlock social features with Premium.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <UserPlus className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Find Friends</h3>
                </div>
                <p className="text-sm text-muted-foreground">Search by username or email. Invite anyone to join via email if they are not on PulseOS yet.</p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Trophy className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold">Friendly Competition</h3>
                </div>
                <p className="text-sm text-muted-foreground">Weekly leaderboards track your progress against friends. Who will be #1 this week?</p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <BadgeCheck className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold">Verified Profiles</h3>
                </div>
                <p className="text-sm text-muted-foreground">Notable users get a blue verification badge so you know who is who.</p>
              </div>
            </div>
          </div>

          {/* Activity Types */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Plan Activities with Friends</h2>
            <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
              Discover local spots and invite friends to join you. From dinner to concerts, make every outing social.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
                <Utensils className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Restaurants</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
                <Music className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Concerts</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Events</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Local Spots</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium">Date Nights</span>
              </div>
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
                  <h3 className="font-semibold mb-1">Connect and compete</h3>
                  <p className="text-muted-foreground">Add friends, climb the leaderboard, and invite others to activities you discover.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">4</div>
                <div>
                  <h3 className="font-semibold mb-1">Boost your Daily Action Score</h3>
                  <p className="text-muted-foreground">Complete tasks, try recommendations, and watch your score grow as you engage with life.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-20 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Take Control of Your Day?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join PulseOS today and start living more intentionally with your personalized life dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="h-12 px-8 text-base">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Free tier forever • Premium: 14-day free trial, then $14.99/month
            </p>
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
