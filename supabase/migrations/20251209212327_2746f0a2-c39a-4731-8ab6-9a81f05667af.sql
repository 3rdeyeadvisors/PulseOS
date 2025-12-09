-- Add missing DELETE policies for user control over their data

-- Allow users to delete their own email logs
CREATE POLICY "Users can delete their own email logs"
ON public.email_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own email preferences
CREATE POLICY "Users can delete their own email preferences"
ON public.email_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own action scores
CREATE POLICY "Users can delete their own action scores"
ON public.daily_action_scores
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own leaderboard entries
CREATE POLICY "Users can delete their own leaderboard entries"
ON public.weekly_leaderboards
FOR DELETE
USING (auth.uid() = user_id);

-- Add deny anonymous access policies for defense-in-depth
CREATE POLICY "Deny anonymous access to friend_requests"
ON public.friend_requests
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Deny anonymous access to friendships"
ON public.friendships
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);