-- Fix overly permissive "Deny anonymous access" policies
-- These policies use RESTRICTIVE mode but with condition (auth.uid() IS NOT NULL)
-- which allows ANY authenticated user to see ALL rows

-- Remove the problematic "Deny anonymous access to profiles" policy
-- The actual user-specific policies already ensure users are authenticated
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Remove the problematic "Deny anonymous access to email_logs" policy  
DROP POLICY IF EXISTS "Deny anonymous access to email_logs" ON public.email_logs;

-- Also fix the friends policy that was incorrectly created
DROP POLICY IF EXISTS "Friends can view limited profile data" ON public.profiles;

-- The existing policies for profiles already provide proper access:
-- - "Users can view own profile" - user can see their own profile
-- - "Admins can view all profiles" - admins can see all

-- Remove remaining overly permissive "Deny anonymous" policies from other tables
-- These are redundant because the actual data-access policies already check auth.uid()
DROP POLICY IF EXISTS "Deny anonymous access to preferences" ON public.preferences;
DROP POLICY IF EXISTS "Deny anonymous access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Deny anonymous access to email_preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Deny anonymous access to chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Deny anonymous access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Deny anonymous access to friend_requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Deny anonymous access to friendships" ON public.friendships;
DROP POLICY IF EXISTS "Deny anonymous access to daily_action_scores" ON public.daily_action_scores;
DROP POLICY IF EXISTS "Deny anonymous access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Deny anonymous access to weekly_leaderboards" ON public.weekly_leaderboards;
DROP POLICY IF EXISTS "Deny anonymous access to activity_invites" ON public.activity_invites;