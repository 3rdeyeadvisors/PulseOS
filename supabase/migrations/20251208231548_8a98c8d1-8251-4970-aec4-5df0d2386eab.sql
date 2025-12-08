-- Add explicit DENY policies for anonymous users on all tables
-- This ensures that even if auth.uid() returns null, anonymous users cannot access data

-- For each table, we need to use RESTRICTIVE policies that explicitly check authentication

-- profiles: Add restrictive policy to deny anonymous
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
AS RESTRICTIVE
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- email_logs: Add restrictive policy
CREATE POLICY "Deny anonymous access to email_logs" 
ON public.email_logs 
AS RESTRICTIVE
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- chat_messages: Add restrictive policy
CREATE POLICY "Deny anonymous access to chat_messages" 
ON public.chat_messages 
AS RESTRICTIVE
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- notifications: Add restrictive policy
CREATE POLICY "Deny anonymous access to notifications" 
ON public.notifications 
AS RESTRICTIVE
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- email_preferences: Add restrictive policy
CREATE POLICY "Deny anonymous access to email_preferences" 
ON public.email_preferences 
AS RESTRICTIVE
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- preferences: Add restrictive policy
CREATE POLICY "Deny anonymous access to preferences" 
ON public.preferences 
AS RESTRICTIVE
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- tasks: Add restrictive policy
CREATE POLICY "Deny anonymous access to tasks" 
ON public.tasks 
AS RESTRICTIVE
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- user_roles: Add restrictive policy
CREATE POLICY "Deny anonymous access to user_roles" 
ON public.user_roles 
AS RESTRICTIVE
FOR SELECT 
USING (auth.uid() IS NOT NULL);