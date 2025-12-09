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
  daily_score: number;
}

export function DailyActionScoreCard() {
  const { user } = useAuth();
  const [score, setScore] = useState<DailyScore | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateScore = useCallback((tasksCompleted: number, tasksTotal: number, recommendationsTried: number, chatInteractions: number) => {
    // Tasks are worth up to 50 points (based on completion percentage)
    const taskScore = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 50) : 0;
    // Each recommendation tried is worth 10 points (up to 30)
    const recScore = Math.min(30, recommendationsTried * 10);
    // Each chat interaction is worth 5 points (up to 20)
    const chatScore = Math.min(20, chatInteractions * 5);
    
    return Math.min(100, taskScore + recScore + chatScore);
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
    const newDailyScore = calculateScore(tasksCompleted, tasksTotal, recommendationsTried, chatInteractions);

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
          daily_score: newDailyScore
        })
        .select()
        .single();

      if (newScore) {
        setScore(newScore);
      }
    }
    
    setLoading(false);
  }, [user, calculateScore]);

  // Initial fetch
  useEffect(() => {
    fetchAndUpdateScore();
  }, [fetchAndUpdateScore]);

  // Listen for custom task-updated events (more reliable than realtime for same-page updates)
  useEffect(() => {
    const handleTaskUpdate = () => {
      fetchAndUpdateScore();
    };
    
    window.addEventListener('task-updated', handleTaskUpdate);
    return () => {
      window.removeEventListener('task-updated', handleTaskUpdate);
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
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return "You're crushing it today!";
    if (score >= 50) return "Good progress, keep going!";
    if (score >= 20) return "You're getting started!";
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
            <div className="text-sm text-muted-foreground">/ 100</div>
            {currentScore >= 50 && (
              <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
            )}
          </div>
          <Target className="h-8 w-8 text-muted-foreground/30" />
        </div>

        {/* Progress Bar */}
        <Progress value={currentScore} className="h-2" />

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