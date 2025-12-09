import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  streakBonus: number;
  lastActiveDate: string | null;
}

export function useStreak() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    streakBonus: 0,
    lastActiveDate: null
  });
  const [loading, setLoading] = useState(true);

  // Calculate bonus points based on streak length
  const calculateStreakBonus = useCallback((streak: number): number => {
    if (streak >= 30) return 50; // Max bonus for 30+ day streak
    if (streak >= 14) return 35; // 2 week streak
    if (streak >= 7) return 25;  // 1 week streak
    if (streak >= 3) return 10;  // 3 day streak
    return 0;
  }, []);

  // Check and update streak based on activity
  const updateStreak = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Get current profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_active_date')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    const lastActiveDate = profile.last_active_date;
    let newStreak = profile.current_streak || 0;
    let newLongestStreak = profile.longest_streak || 0;

    // Check if user was active today (has completed at least one task or action)
    const { data: todayScore } = await supabase
      .from('daily_action_scores')
      .select('daily_score, tasks_completed')
      .eq('user_id', user.id)
      .eq('score_date', today)
      .maybeSingle();

    const isActiveToday = todayScore && (todayScore.daily_score > 0 || todayScore.tasks_completed > 0);

    if (lastActiveDate === today) {
      // Already updated today, just return current data
      const bonus = calculateStreakBonus(newStreak);
      setStreakData({
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        streakBonus: bonus,
        lastActiveDate
      });
      setLoading(false);
      return;
    }

    if (isActiveToday) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActiveDate === yesterdayStr) {
        // Consecutive day - increment streak
        newStreak += 1;
      } else if (!lastActiveDate || lastActiveDate < yesterdayStr) {
        // Streak broken or first activity - reset to 1
        newStreak = 1;
      }

      // Update longest streak if needed
      if (newStreak > newLongestStreak) {
        newLongestStreak = newStreak;
      }

      const streakBonus = calculateStreakBonus(newStreak);

      // Update profile with new streak data
      await supabase
        .from('profiles')
        .update({
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_active_date: today
        })
        .eq('user_id', user.id);

      // Update today's score with streak bonus
      if (todayScore) {
        await supabase
          .from('daily_action_scores')
          .update({ streak_bonus: streakBonus })
          .eq('user_id', user.id)
          .eq('score_date', today);
      }

      setStreakData({
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        streakBonus,
        lastActiveDate: today
      });

      // Dispatch event to refresh score card
      window.dispatchEvent(new CustomEvent('streak-updated'));
    } else {
      // Not active today yet
      const bonus = calculateStreakBonus(newStreak);
      setStreakData({
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        streakBonus: bonus,
        lastActiveDate
      });
    }

    setLoading(false);
  }, [user, calculateStreakBonus]);

  // Initial load
  useEffect(() => {
    updateStreak();
  }, [updateStreak]);

  // Listen for task updates to recalculate streak
  useEffect(() => {
    const handleUpdate = () => {
      updateStreak();
    };

    window.addEventListener('task-updated', handleUpdate);
    window.addEventListener('score-updated', handleUpdate);
    
    return () => {
      window.removeEventListener('task-updated', handleUpdate);
      window.removeEventListener('score-updated', handleUpdate);
    };
  }, [updateStreak]);

  return {
    ...streakData,
    loading,
    refreshStreak: updateStreak
  };
}
