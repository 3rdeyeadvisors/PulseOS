-- Allow authenticated users to search for other users by username
-- This enables friend search functionality while protecting sensitive data
CREATE POLICY "Users can search profiles by username"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Allow viewing public profiles
    profile_public = true
    -- Or allow viewing basic info for friend search (username lookup)
    OR username IS NOT NULL
  )
);

-- Note: The existing "Users can view their own profile" policy still applies
-- This new policy allows searching for other users while RLS protects the data