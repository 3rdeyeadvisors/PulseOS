-- Fix: Restrict public profile search to only expose safe fields
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can search public profiles" ON public.profiles;

-- Create a new more restrictive policy for public profile search
-- This policy allows searching but the application should only SELECT safe columns
CREATE POLICY "Users can search public profiles" 
ON public.profiles 
FOR SELECT 
USING (
  (profile_public = true) 
  AND (username IS NOT NULL)
  AND (auth.uid() IS NOT NULL)  -- Require authentication
);

-- Note: The actual column restriction must happen at the application level
-- by only selecting: user_id, username, full_name, avatar_url, city, verified
-- and NOT selecting: email, zip_code, age_range, household_type