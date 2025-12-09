import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!user) return;
    
    const fetchOrCreateScore = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Try to get today's score
      const { data: existingScore, error: fetchError } = await supabase
        .from('daily_action_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('score_date', today)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching score:', fetchError);
        setLoading(false);
        return;
      }

      if (existingScore) {
        setScore(existingScore);
        setLoading(false);
        return;
      }

      // Get today's tasks count
      const { data: tasks } = await supabase
        .from('tasks')
        .select('completed')
        .eq('user_id', user.id);

      const tasksTotal = tasks?.length || 0;
      const tasksCompleted = tasks?.filter(t => t.completed).length || 0;

      // Calculate initial score
      const taskScore = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 50) : 0;
      const initialScore = Math.min(100, taskScore);

      // Create today's score
      const { data: newScore, error: insertError } = await supabase
        .from('daily_action_scores')
        .insert({
          user_id: user.id,
          score_date: today,
          tasks_completed: tasksCompleted,
          tasks_total: tasksTotal,
          daily_score: initialScore
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating score:', insertError);
      } else {
        setScore(newScore);
      }
      setLoading(false);
    };

    fetchOrCreateScore();
  }, [user]);

  // Subscribe to task changes to update score
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('task-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        async () => {
          // Recalculate score when tasks change
          const today = new Date().toISOString().split('T')[0];
          
          const { data: tasks } = await supabase
            .from('tasks')
            .select('completed')
            .eq('user_id', user.id);

          const tasksTotal = tasks?.length || 0;
          const tasksCompleted = tasks?.filter(t => t.completed).length || 0;
          const taskScore = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 50) : 0;
          const newDailyScore = Math.min(100, taskScore + (score?.recommendations_tried || 0) * 10 + (score?.chat_interactions || 0) * 5);

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, score]);

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