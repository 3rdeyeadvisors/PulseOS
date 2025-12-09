
-- Phase 2: Leaderboards & Weekly Stats

-- 1. Create weekly_leaderboards table for caching weekly scores
CREATE TABLE IF NOT EXISTS public.weekly_leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_score integer NOT NULL DEFAULT 0,
  tasks_completed integer NOT NULL DEFAULT 0,
  recommendations_tried integer NOT NULL DEFAULT 0,
  social_engagement integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  rank integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_week UNIQUE (user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_leaderboards ENABLE ROW LEVEL SECURITY;

-- Users can view leaderboards for themselves and their friends
CREATE POLICY "Users can view their own leaderboard entries"
ON public.weekly_leaderboards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends leaderboard entries"
ON public.weekly_leaderboards FOR SELECT
USING (public.are_friends(auth.uid(), user_id));

-- System can insert/update leaderboard entries
CREATE POLICY "Users can insert their own leaderboard entries"
ON public.weekly_leaderboards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entries"
ON public.weekly_leaderboards FOR UPDATE
USING (auth.uid() = user_id);

-- 2. Add streak tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date date;

-- 3. Create trigger to update weekly leaderboards
CREATE TRIGGER update_weekly_leaderboards_updated_at
BEFORE UPDATE ON public.weekly_leaderboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create function to get friends leaderboard
CREATE OR REPLACE FUNCTION public.get_friends_leaderboard(_user_id uuid, _week_start date)
RETURNS TABLE (
  user_id uuid,
  username text,
  full_name text,
  avatar_url text,
  total_score integer,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH friend_ids AS (
    SELECT friend_id FROM friendships WHERE friendships.user_id = _user_id
    UNION
    SELECT _user_id -- Include current user
  ),
  ranked_scores AS (
    SELECT 
      wl.user_id,
      p.username,
      p.full_name,
      p.avatar_url,
      wl.total_score,
      ROW_NUMBER() OVER (ORDER BY wl.total_score DESC) as rank
    FROM weekly_leaderboards wl
    JOIN profiles p ON p.user_id = wl.user_id
    WHERE wl.week_start = _week_start
    AND wl.user_id IN (SELECT friend_id FROM friend_ids)
  )
  SELECT * FROM ranked_scores
  ORDER BY rank ASC
  LIMIT 50;
$$;

-- 5. Enable realtime for leaderboards
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_leaderboards;
