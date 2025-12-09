-- Drop the restrictive anonymous denial and recreate properly
-- The issue is all policies are RESTRICTIVE which means ALL must pass

-- First drop existing restrictive policies
DROP POLICY IF EXISTS "Deny anonymous access to friend_requests" ON public.friend_requests;

-- Recreate as a check that works with permissive policies
-- Since we're using permissive policies with TO authenticated, anonymous users are already blocked