import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface UserContext {
  name: string;
  city: string;
  interests: string[];
  dietaryPreferences: string[];
  currentStreak: number;
  tasksToday: number;
  completedToday: number;
}

// Generate contextual insights based on actual user data
function generateContextualInsight(context: UserContext): string {
  const insights: string[] = [];
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  // Time-based greetings that don't make false claims
  if (hour >= 5 && hour < 12) {
    insights.push("Morning is a great time to set intentions for the day ahead.");
    insights.push("Starting your day with a clear mind sets you up for success.");
    insights.push("A morning routine, even a simple one, can boost your day.");
  } else if (hour >= 12 && hour < 17) {
    insights.push("Take a moment to stretch - your body will thank you.");
    insights.push("A short break can help refresh your focus.");
    insights.push("Mid-day is a good time to reassess your priorities.");
  } else if (hour >= 17 && hour < 21) {
    insights.push("Evening is perfect for winding down and reflecting.");
    insights.push("Consider what went well today - gratitude helps perspective.");
    insights.push("A relaxing evening routine supports better sleep.");
  } else {
    insights.push("Rest is essential for tomorrow's productivity.");
    insights.push("Take care of yourself - you've earned it.");
    insights.push("A good night's sleep is one of the best investments you can make.");
  }

  // Weekend vs weekday insights
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    insights.push("Weekends are great for pursuing what brings you joy.");
    insights.push("Balance rest with activities that energize you.");
  }

  // Interest-based insights (only if we know their interests)
  if (context.interests.length > 0) {
    const interest = context.interests[Math.floor(Math.random() * context.interests.length)];
    const interestInsights: Record<string, string[]> = {
      reading: [
        "Even 10 minutes of reading can broaden your perspective.",
        "Books are gateways to new ideas and experiences.",
      ],
      fitness: [
        "Movement, in any form, is a gift to yourself.",
        "Every step counts toward your wellness journey.",
      ],
      cooking: [
        "Trying a new recipe can be a rewarding adventure.",
        "Cooking at home is both creative and nourishing.",
      ],
      travel: [
        "Planning adventures, even small ones, keeps life exciting.",
        "Exploring your local area can reveal hidden gems.",
      ],
      tech: [
        "Technology evolves fast - staying curious keeps you ahead.",
        "Building and learning new skills is always valuable.",
      ],
      music: [
        "Music can transform your mood in moments.",
        "Discovering new artists keeps life's soundtrack fresh.",
      ],
      gaming: [
        "Gaming can be a great way to unwind and challenge yourself.",
        "Balance screen time with other activities for variety.",
      ],
      art: [
        "Creativity comes in many forms - embrace yours.",
        "Art appreciation enriches everyday experiences.",
      ],
      finance: [
        "Small financial habits compound over time.",
        "Financial awareness is a form of self-care.",
      ],
      nature: [
        "Time outdoors can reset your mental state.",
        "Nature offers perspective that screens cannot.",
      ],
      sports: [
        "Active hobbies boost both physical and mental health.",
        "Team activities build connections beyond the game.",
      ],
    };
    
    const lowerInterest = interest.toLowerCase();
    if (interestInsights[lowerInterest]) {
      insights.push(...interestInsights[lowerInterest]);
    }
  }

  // Task-based insights (only based on actual data)
  if (context.tasksToday > 0) {
    if (context.completedToday > 0 && context.completedToday >= context.tasksToday) {
      insights.push("Great job completing your tasks! Celebrate the wins.");
    } else if (context.completedToday > 0) {
      insights.push("Progress is progress - every completed task matters.");
    }
  }

  // Streak-based insights (only if they have a streak)
  if (context.currentStreak >= 7) {
    insights.push("Consistency is your superpower - keep the momentum going!");
  } else if (context.currentStreak >= 3) {
    insights.push("You're building a great habit with your daily engagement!");
  }

  // Location-aware but not weather-claiming
  if (context.city) {
    insights.push(`Living in ${context.city} offers unique local experiences to explore.`);
  }

  // Dietary preference insights
  if (context.dietaryPreferences.length > 0) {
    insights.push("Mindful eating choices support your wellbeing.");
  }

  // Pick a random insight from the accumulated options
  return insights[Math.floor(Math.random() * insights.length)];
}

export function AIInsightCard() {
  const { user, session } = useAuth();
  const [insight, setInsight] = useState<string>('');
  const [aiName, setAiName] = useState<string>('Pulse');
  const [loading, setLoading] = useState(true);
  const [userContext, setUserContext] = useState<UserContext>({
    name: '',
    city: '',
    interests: [],
    dietaryPreferences: [],
    currentStreak: 0,
    tasksToday: 0,
    completedToday: 0,
  });

  const refreshInsight = useCallback(() => {
    const newInsight = generateContextualInsight(userContext);
    setInsight(newInsight);
  }, [userContext]);

  useEffect(() => {
    async function fetchUserData() {
      if (!user || !session) return;

      setLoading(true);

      // Fetch user data in parallel
      const [prefsResult, profileResult, tasksResult] = await Promise.all([
        supabase
          .from('preferences')
          .select('ai_name, interests, dietary_preferences')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('full_name, city, current_streak')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('tasks')
          .select('completed')
          .eq('user_id', user.id),
      ]);

      const prefs = prefsResult.data;
      const profile = profileResult.data;
      const tasks = tasksResult.data || [];

      if (prefs?.ai_name) {
        setAiName(prefs.ai_name);
      }

      const context: UserContext = {
        name: profile?.full_name || '',
        city: profile?.city || '',
        interests: (prefs?.interests as string[]) || [],
        dietaryPreferences: (prefs?.dietary_preferences as string[]) || [],
        currentStreak: profile?.current_streak || 0,
        tasksToday: tasks.length,
        completedToday: tasks.filter(t => t.completed).length,
      };

      setUserContext(context);
      setInsight(generateContextualInsight(context));
      setLoading(false);
    }

    fetchUserData();
  }, [user, session]);

  // Listen for task updates to refresh context
  useEffect(() => {
    const handleTaskUpdate = async () => {
      if (!user) return;
      
      const { data: tasks } = await supabase
        .from('tasks')
        .select('completed')
        .eq('user_id', user.id);
      
      if (tasks) {
        setUserContext(prev => ({
          ...prev,
          tasksToday: tasks.length,
          completedToday: tasks.filter(t => t.completed).length,
        }));
      }
    };

    window.addEventListener('task-updated', handleTaskUpdate);
    return () => window.removeEventListener('task-updated', handleTaskUpdate);
  }, [user]);

  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-gradient-to-br from-accent/10 to-card border border-accent/20 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-gradient-to-br from-accent/10 to-card border border-accent/20 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-medium text-muted-foreground">{aiName} says</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={refreshInsight}
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      <p className="text-sm leading-relaxed">{insight}</p>
    </div>
  );
}
