import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';

interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  total_score: number;
  rank: number;
  verified?: boolean;
  isCurrentUser?: boolean;
}

interface WeeklyStats {
  total_score: number;
  tasks_completed: number;
  recommendations_tried: number;
  social_engagement: number;
  streak_days: number;
  rank: number | null;
}

export function useLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    return {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    };
  });

  const fetchLeaderboard = useCallback(async () => {
    if (!user) return;

    const weekStart = format(currentWeek.start, 'yyyy-MM-dd');

    // Fetch friends leaderboard using the RPC function
    const { data: leaderboardData, error } = await supabase
      .rpc('get_friends_leaderboard', {
        _user_id: user.id,
        _week_start: weekStart,
      });

    if (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    } else if (leaderboardData && leaderboardData.length > 0) {
      // Fetch verified status for all users
      const userIds = leaderboardData.map((entry: any) => entry.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, verified')
        .in('user_id', userIds);

      const verifiedMap = new Map(profilesData?.map(p => [p.user_id, p.verified]) || []);

      const entries = leaderboardData.map((entry: any) => ({
        ...entry,
        verified: verifiedMap.get(entry.user_id) || false,
        isCurrentUser: entry.user_id === user.id,
      }));
      setLeaderboard(entries);
    } else {
      setLeaderboard([]);
    }
  }, [user, currentWeek]);

  const fetchWeeklyStats = useCallback(async () => {
    if (!user) return;

    const weekStart = format(currentWeek.start, 'yyyy-MM-dd');

    // Fetch or calculate weekly stats
    const { data: existingStats } = await supabase
      .from('weekly_leaderboards')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (existingStats) {
      setWeeklyStats({
        total_score: existingStats.total_score,
        tasks_completed: existingStats.tasks_completed,
        recommendations_tried: existingStats.recommendations_tried,
        social_engagement: existingStats.social_engagement,
        streak_days: existingStats.streak_days,
        rank: existingStats.rank,
      });
    } else {
      // Calculate from daily scores
      const weekEnd = format(currentWeek.end, 'yyyy-MM-dd');
      
      const { data: dailyScores } = await supabase
        .from('daily_action_scores')
        .select('*')
        .eq('user_id', user.id)
        .gte('score_date', weekStart)
        .lte('score_date', weekEnd);

      if (dailyScores && dailyScores.length > 0) {
        const stats = dailyScores.reduce(
          (acc, day) => ({
            total_score: acc.total_score + day.daily_score,
            tasks_completed: acc.tasks_completed + day.tasks_completed,
            recommendations_tried: acc.recommendations_tried + day.recommendations_tried,
            social_engagement: acc.social_engagement + (day.social_engagement || 0),
            streak_days: acc.streak_days + 1,
          }),
          { total_score: 0, tasks_completed: 0, recommendations_tried: 0, social_engagement: 0, streak_days: 0 }
        );

        setWeeklyStats({ ...stats, rank: null });

        // Upsert the weekly leaderboard entry
        await supabase
          .from('weekly_leaderboards')
          .upsert({
            user_id: user.id,
            week_start: weekStart,
            week_end: weekEnd,
            total_score: stats.total_score,
            tasks_completed: stats.tasks_completed,
            recommendations_tried: stats.recommendations_tried,
            social_engagement: stats.social_engagement,
            streak_days: stats.streak_days,
          }, {
            onConflict: 'user_id,week_start',
          });
      } else {
        setWeeklyStats({
          total_score: 0,
          tasks_completed: 0,
          recommendations_tried: 0,
          social_engagement: 0,
          streak_days: 0,
          rank: null,
        });
      }
    }
  }, [user, currentWeek]);

  const updateWeeklyScore = useCallback(async () => {
    if (!user) return;

    const weekStart = format(currentWeek.start, 'yyyy-MM-dd');
    const weekEnd = format(currentWeek.end, 'yyyy-MM-dd');

    // Recalculate from daily scores
    const { data: dailyScores } = await supabase
      .from('daily_action_scores')
      .select('*')
      .eq('user_id', user.id)
      .gte('score_date', weekStart)
      .lte('score_date', weekEnd);

    if (dailyScores && dailyScores.length > 0) {
      const stats = dailyScores.reduce(
        (acc, day) => ({
          total_score: acc.total_score + day.daily_score,
          tasks_completed: acc.tasks_completed + day.tasks_completed,
          recommendations_tried: acc.recommendations_tried + day.recommendations_tried,
          social_engagement: acc.social_engagement + (day.social_engagement || 0),
          streak_days: acc.streak_days + 1,
        }),
        { total_score: 0, tasks_completed: 0, recommendations_tried: 0, social_engagement: 0, streak_days: 0 }
      );

      // Upsert the weekly leaderboard entry
      await supabase
        .from('weekly_leaderboards')
        .upsert({
          user_id: user.id,
          week_start: weekStart,
          week_end: weekEnd,
          total_score: stats.total_score,
          tasks_completed: stats.tasks_completed,
          recommendations_tried: stats.recommendations_tried,
          social_engagement: stats.social_engagement,
          streak_days: stats.streak_days,
        }, {
          onConflict: 'user_id,week_start',
        });

      // Refresh data
      await Promise.all([fetchLeaderboard(), fetchWeeklyStats()]);
    }
  }, [user, currentWeek, fetchLeaderboard, fetchWeeklyStats]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLeaderboard(), fetchWeeklyStats()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchLeaderboard, fetchWeeklyStats]);

  // Listen for daily score updates (dispatched AFTER daily_action_scores is saved)
  useEffect(() => {
    const handleScoreUpdate = () => {
      updateWeeklyScore();
    };

    // Listen to daily-score-updated which fires after DB is updated
    window.addEventListener('daily-score-updated', handleScoreUpdate);
    window.addEventListener('streak-updated', handleScoreUpdate);
    
    return () => {
      window.removeEventListener('daily-score-updated', handleScoreUpdate);
      window.removeEventListener('streak-updated', handleScoreUpdate);
    };
  }, [updateWeeklyScore]);

  // Subscribe to realtime changes on daily_action_scores for cross-tab/device updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('leaderboard-score-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_action_scores',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          updateWeeklyScore();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, updateWeeklyScore]);

  // Subscribe to realtime changes on weekly_leaderboards for live leaderboard updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('weekly-leaderboards-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_leaderboards'
        },
        () => {
          // Refresh leaderboard when any weekly score changes
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchLeaderboard]);

  return {
    leaderboard,
    weeklyStats,
    loading,
    currentWeek,
    refreshLeaderboard: fetchLeaderboard,
    updateWeeklyScore,
  };
}
