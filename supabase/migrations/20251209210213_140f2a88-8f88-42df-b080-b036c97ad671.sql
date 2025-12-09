-- Fix 1: Restrict profile search to only return non-sensitive fields
-- The current policy exposes emails and personal info

-- Drop the overly permissive search policy
DROP POLICY IF EXISTS "Users can search profiles by username" ON public.profiles;

-- Create a more restrictive policy that only allows searching but limits what can be seen
-- Users can only see: username, full_name, avatar_url, city, verified (public info)
-- They CANNOT see: email, state, country, age_range, household_type, zip_code

-- For search, users can view profiles where username is set (for friend search)
CREATE POLICY "Users can search public profile info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  username IS NOT NULL
);

-- Note: The email column is still visible through this policy
-- We need to handle this at the application level by only selecting safe columns

-- Fix 2: Remove email from being accessible via profile search
-- Create a view for safe profile data that excludes sensitive info
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  user_id,
  username,
  full_name,
  avatar_url,
  city,
  verified,
  profile_public,
  interests_public,
  current_streak,
  longest_streak
FROM public.profiles
WHERE username IS NOT NULL;