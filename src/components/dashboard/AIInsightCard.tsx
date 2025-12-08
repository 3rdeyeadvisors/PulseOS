import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const insightTemplates = [
  "Based on your interests, you might enjoy exploring a new documentary today.",
  "It's a great day to try that recipe you've been thinking about!",
  "Consider taking a short walk - it's good for both body and mind.",
  "You haven't checked in with your goals recently. A quick review might be helpful!",
  "Perfect weather for outdoor activities in your area today.",
  "Your productivity tends to peak in the afternoon - plan deep work accordingly.",
  "A new podcast episode from your favorite creator is available.",
  "Remember to stay hydrated throughout the day!",
];

export function AIInsightCard() {
  const { user, session } = useAuth();
  const [insight, setInsight] = useState<string>('');
  const [aiName, setAiName] = useState<string>('Pulse');
  const [loading, setLoading] = useState(true);

  const generateInsight = () => {
    setLoading(true);
    // Simulate AI thinking
    setTimeout(() => {
      const randomInsight = insightTemplates[Math.floor(Math.random() * insightTemplates.length)];
      setInsight(randomInsight);
      setLoading(false);
    }, 600);
  };

  useEffect(() => {
    async function fetchPreferences() {
      if (!user || !session) return;

      const { data, error } = await supabase
        .from('preferences')
        .select('ai_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Preferences fetch error:', error);
        return;
      }

      if (data?.ai_name) {
        setAiName(data.ai_name);
      }
    }

    fetchPreferences();
    generateInsight();
  }, [user, session]);

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
          onClick={generateInsight}
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      <p className="text-sm leading-relaxed">{insight}</p>
    </div>
  );
}
