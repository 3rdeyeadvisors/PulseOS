import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, CheckCircle2, Flame, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DailyScore {
  tasks_completed: number;
  tasks_total: number;
  recommendations_tried: number;
  chat_interactions: number;
  social_engagement: number;
  streak_bonus: number;
  daily_score: number;
}

export function DailyActionScoreCard() {
  const { user } = useAuth();
  const [score, setScore] = useState<DailyScore | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateScore = useCallback((
    tasksCompleted: number, 
    tasksTotal: number, 
    recommendationsTried: number, 
    chatInteractions: number,
    socialEngagement: number = 0,
    streakBonus: number = 0
  ) => {
    // NEW 500-POINT SYSTEM:
    // Tasks: 200 pts (10 pts per task, max 20 tasks)
    const taskScore = Math.min(200, tasksCompleted * 10);
    // Recommendations: 100 pts (20 pts each, max 5)
    const recScore = Math.min(100, recommendationsTried * 20);
    // Social: 100 pts (10 pts per interaction, max 10)
    const socialScore = Math.min(100, socialEngagement * 10);
    // Streaks: 50 pts (7-day = 25, 30-day = 50)
    const streakScore = Math.min(50, streakBonus);
    // Chat: 50 pts (10 pts each, max 5)
    const chatScore = Math.min(50, chatInteractions * 10);
    
    return Math.min(500, taskScore + recScore + socialScore + streakScore + chatScore);
  }, []);

  const fetchAndUpdateScore = useCallback(async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's tasks count
    const { data: tasks } = await supabase
      .from('tasks')
      .select('completed')
      .eq('user_id', user.id);

    const tasksTotal = tasks?.length || 0;
    const tasksCompleted = tasks?.filter(t => t.completed).length || 0;

    // Try to get today's score
    const { data: existingScore } = await supabase
      .from('daily_action_scores')
      .select('*')
      .eq('user_id', user.id)
      .eq('score_date', today)
      .maybeSingle();

    const recommendationsTried = existingScore?.recommendations_tried || 0;
    const chatInteractions = existingScore?.chat_interactions || 0;
    const socialEngagement = existingScore?.social_engagement || 0;
    const streakBonus = existingScore?.streak_bonus || 0;
    const newDailyScore = calculateScore(tasksCompleted, tasksTotal, recommendationsTried, chatInteractions, socialEngagement, streakBonus);

    if (existingScore) {
      // Update existing score
      const { data: updatedScore } = await supabase
        .from('daily_action_scores')
        .update({
          tasks_completed: tasksCompleted,
          tasks_total: tasksTotal,
          daily_score: newDailyScore
        })
        .eq('user_id', user.id)
        .eq('score_date', today)
        .select()
        .single();

      if (updatedScore) {
        setScore(updatedScore);
        // Dispatch event after successful update so weekly leaderboard can sync
        window.dispatchEvent(new CustomEvent('daily-score-updated'));
      }
    } else {
      // Create new score
      const { data: newScore } = await supabase
        .from('daily_action_scores')
        .insert({
          user_id: user.id,
          score_date: today,
          tasks_completed: tasksCompleted,
          tasks_total: tasksTotal,
          recommendations_tried: 0,
          chat_interactions: 0,
          social_engagement: 0,
          streak_bonus: 0,
          daily_score: newDailyScore
        })
        .select()
        .single();

      if (newScore) {
        setScore(newScore);
        // Dispatch event after successful insert so weekly leaderboard can sync
        window.dispatchEvent(new CustomEvent('daily-score-updated'));
      }
    }
    
    setLoading(false);
  }, [user, calculateScore]);

  // Initial fetch
  useEffect(() => {
    fetchAndUpdateScore();
  }, [fetchAndUpdateScore]);

  // Listen for custom task-updated and streak-updated events
  useEffect(() => {
    const handleUpdate = () => {
      fetchAndUpdateScore();
    };
    
    window.addEventListener('task-updated', handleUpdate);
    window.addEventListener('streak-updated', handleUpdate);
    return () => {
      window.removeEventListener('task-updated', handleUpdate);
      window.removeEventListener('streak-updated', handleUpdate);
    };
  }, [fetchAndUpdateScore]);

  // Also subscribe to realtime changes (for cross-tab/device updates)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('task-score-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchAndUpdateScore();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAndUpdateScore]);

  const getScoreColor = (score: number) => {
    if (score >= 400) return 'text-emerald-500';
    if (score >= 250) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 400) return "You're crushing it today!";
    if (score >= 250) return "Good progress, keep going!";
    if (score >= 100) return "You're getting started!";
    return "Start completing tasks to boost your score!";
  };

  if (loading) {
    return (
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Daily Action Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded-lg" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentScore = score?.daily_score || 0;

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Daily Action Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-4xl font-bold ${getScoreColor(currentScore)}`}>
              {currentScore}
            </div>
            <div className="text-sm text-muted-foreground">/ 500</div>
            {currentScore >= 250 && (
              <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
            )}
          </div>
          <Target className="h-8 w-8 text-muted-foreground/30" />
        </div>

        {/* Progress Bar */}
        <Progress value={(currentScore / 500) * 100} className="h-2" />

        {/* Message */}
        <p className="text-sm text-muted-foreground">{getScoreMessage(currentScore)}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm">
              <span className="font-medium">{score?.tasks_completed || 0}</span>
              <span className="text-muted-foreground">/{score?.tasks_total || 0} tasks</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm">
              <span className="font-medium">{score?.recommendations_tried || 0}</span>
              <span className="text-muted-foreground"> tried</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}