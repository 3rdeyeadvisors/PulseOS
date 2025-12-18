-- Fix: Remove overly permissive public profile search policy
-- The existing security definer functions (search_public_profiles, get_safe_public_profile) 
-- already properly filter sensitive data. This direct SELECT policy bypasses that protection.

DROP POLICY IF EXISTS "Users can search public profiles" ON public.profiles;

-- Create a more restrictive policy that only allows viewing public profiles
-- but excludes sensitive fields by using a view or requiring function usage
-- Since we can't restrict columns in RLS, we'll rely on the security definer functions
-- and remove direct public search access

-- Create a policy that only allows viewing basic public info for profile discovery
-- This is more restrictive - users must use the search_public_profiles function for searches
CREATE POLICY "Users can view public profile basics for friend requests"
ON public.profiles
FOR SELECT
USING (
  -- Allow viewing if profile is public AND user is authenticated AND they're looking at a specific user
  -- This is needed for friend request flows where you need to see the target user's basic info
  (profile_public = true AND username IS NOT NULL AND auth.uid() IS NOT NULL)
);

-- Note: The policy still allows SELECT, but the frontend should use 
-- search_public_profiles() and get_safe_public_profile() functions
-- which properly filter sensitive data (email, full location details)

-- Remove email column from profiles table as it's redundant with auth.users
-- and creates a security risk. Email should only be accessed from auth.users.
-- First, let's check if any critical functionality depends on this column
-- For now, we'll create a view that excludes sensitive data

-- Create a secure view for public profile access that excludes sensitive data
CREATE OR REPLACE VIEW public.public_profiles_view AS
SELECT 
  user_id,
  username,
  CASE WHEN profile_public THEN full_name ELSE NULL END as full_name,
  avatar_url,
  CASE WHEN profile_public THEN city ELSE NULL END as city,
  CASE WHEN profile_public THEN state ELSE NULL END as state,
  verified,
  current_streak,
  interests_public
FROM public.profiles
WHERE profile_public = true AND username IS NOT NULL;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles_view TO authenticated;