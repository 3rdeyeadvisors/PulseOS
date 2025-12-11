import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  isFounder?: boolean;
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
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Memoize currentWeek to prevent unnecessary recalculations
  const currentWeek = useMemo(() => {
    const now = new Date();
    return {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    };
  }, []);

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
      // Fetch verified status and roles for all users
      const userIds = leaderboardData.map((entry: any) => entry.user_id);
      
      const [profilesResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, verified')
          .in('user_id', userIds),
        supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds)
          .eq('role', 'admin')
      ]);

      const verifiedMap = new Map(profilesResult.data?.map(p => [p.user_id, p.verified]) || []);
      const founderSet = new Set(rolesResult.data?.map(r => r.user_id) || []);

      const entries = leaderboardData.map((entry: any) => ({
        ...entry,
        verified: verifiedMap.get(entry.user_id) || false,
        isFounder: founderSet.has(entry.user_id),
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
    const weekEnd = format(currentWeek.end, 'yyyy-MM-dd');

    // Always recalculate from daily scores to ensure accuracy
    const { data: dailyScores } = await supabase
      .from('daily_action_scores')
      .select('*')
      .eq('user_id', user.id)
      .gte('score_date', weekStart)
      .lte('score_date', weekEnd);

    if (dailyScores && dailyScores.length > 0) {
      // Count days where user was actually active (score > 0 or tasks completed > 0)
      const activeDays = dailyScores.filter(day => day.daily_score > 0 || day.tasks_completed > 0).length;
      
      const stats = dailyScores.reduce(
        (acc, day) => ({
          total_score: acc.total_score + (day.daily_score || 0),
          tasks_completed: acc.tasks_completed + (day.tasks_completed || 0),
          recommendations_tried: acc.recommendations_tried + (day.recommendations_tried || 0),
          social_engagement: acc.social_engagement + (day.social_engagement || 0),
        }),
        { total_score: 0, tasks_completed: 0, recommendations_tried: 0, social_engagement: 0 }
      );

      const weeklyStats = { ...stats, streak_days: activeDays, rank: null };
      setWeeklyStats(weeklyStats);

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
          streak_days: activeDays,
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
  }, [user, currentWeek]);

  // Debounced update function to prevent excessive API calls
  const updateWeeklyScore = useCallback(async () => {
    if (!user) return;

    // Debounce: cancel any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Throttle: don't fetch more than once per 2 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) {
      updateTimeoutRef.current = setTimeout(() => updateWeeklyScore(), 2000);
      return;
    }
    lastFetchRef.current = now;

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
      const activeDays = dailyScores.filter(day => day.daily_score > 0 || day.tasks_completed > 0).length;
      
      const stats = dailyScores.reduce(
        (acc, day) => ({
          total_score: acc.total_score + (day.daily_score || 0),
          tasks_completed: acc.tasks_completed + (day.tasks_completed || 0),
          recommendations_tried: acc.recommendations_tried + (day.recommendations_tried || 0),
          social_engagement: acc.social_engagement + (day.social_engagement || 0),
        }),
        { total_score: 0, tasks_completed: 0, recommendations_tried: 0, social_engagement: 0 }
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
          streak_days: activeDays,
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

    // Cleanup timeout on unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [user, fetchLeaderboard, fetchWeeklyStats]);

  // Listen for daily score updates (dispatched AFTER daily_action_scores is saved)
  useEffect(() => {
    const handleScoreUpdate = () => {
      updateWeeklyScore();
    };

    window.addEventListener('daily-score-updated', handleScoreUpdate);
    window.addEventListener('streak-updated', handleScoreUpdate);
    
    return () => {
      window.removeEventListener('daily-score-updated', handleScoreUpdate);
      window.removeEventListener('streak-updated', handleScoreUpdate);
    };
  }, [updateWeeklyScore]);

  // Single combined realtime subscription for better performance
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('leaderboard-combined')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_action_scores',
          filter: `user_id=eq.${user.id}`
        },
        () => updateWeeklyScore()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_leaderboards'
        },
        () => fetchLeaderboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, updateWeeklyScore, fetchLeaderboard]);

  return {
    leaderboard,
    weeklyStats,
    loading,
    currentWeek,
    refreshLeaderboard: fetchLeaderboard,
    updateWeeklyScore,
  };
}
