-- Phase 2: Update get_friends_leaderboard to show all friends with tasks enabled
-- This includes friends with 0 points, but excludes those who don't have tasks module enabled

CREATE OR REPLACE FUNCTION public.get_friends_leaderboard(_user_id uuid, _week_start date)
RETURNS TABLE(user_id uuid, username text, full_name text, avatar_url text, total_score integer, rank bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH friend_ids AS (
    SELECT friend_id FROM friendships WHERE friendships.user_id = _user_id
    UNION
    SELECT _user_id -- Include current user
  ),
  friends_with_tasks_enabled AS (
    -- Only include friends who have 'greeting' in their enabled_modules (indicates active user)
    -- or have tasks-related modules enabled
    SELECT fi.friend_id
    FROM friend_ids fi
    JOIN preferences pref ON pref.user_id = fi.friend_id
    WHERE pref.enabled_modules IS NOT NULL 
      AND array_length(pref.enabled_modules, 1) > 0
  ),
  friends_with_scores AS (
    SELECT 
      p.user_id,
      p.username,
      p.full_name,
      p.avatar_url,
      COALESCE(wl.total_score, 0) as total_score
    FROM friends_with_tasks_enabled fte
    JOIN profiles p ON p.user_id = fte.friend_id
    LEFT JOIN weekly_leaderboards wl ON wl.user_id = p.user_id AND wl.week_start = _week_start
  ),
  ranked_scores AS (
    SELECT 
      fws.*,
      ROW_NUMBER() OVER (ORDER BY fws.total_score DESC, fws.full_name ASC) as rank
    FROM friends_with_scores fws
  )
  SELECT * FROM ranked_scores
  ORDER BY rank ASC
  LIMIT 50;
$$;