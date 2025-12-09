-- Add "Deny anonymous access" policies to tables missing them

-- daily_action_scores - missing deny anonymous policy
CREATE POLICY "Deny anonymous access to daily_action_scores" 
ON public.daily_action_scores 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- activity_invites - missing deny anonymous policy
CREATE POLICY "Deny anonymous access to activity_invites" 
ON public.activity_invites 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- friend_requests - missing deny anonymous policy
CREATE POLICY "Deny anonymous access to friend_requests" 
ON public.friend_requests 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- friendships - missing deny anonymous policy
CREATE POLICY "Deny anonymous access to friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- weekly_leaderboards - missing deny anonymous policy
CREATE POLICY "Deny anonymous access to weekly_leaderboards" 
ON public.weekly_leaderboards 
FOR SELECT 
USING (auth.uid() IS NOT NULL);