-- Drop the overly permissive search policy
DROP POLICY IF EXISTS "Users can search public profile info" ON public.profiles;

-- Create separate policies:
-- 1. Users can always see their own full profile
-- 2. Users can only see limited public fields of others (enforced at app level, but policy restricts to public profiles only)

-- Policy for viewing other users' profiles - only if they have made themselves searchable
-- The actual field restriction happens in the app queries
CREATE POLICY "Users can search profiles with username" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- User can see their own profile fully
  auth.uid() = user_id
  -- Or can see others who have a username (searchable users)
  OR (username IS NOT NULL AND profile_public = true)
  -- Or can see minimal info for friend functionality (username set)
  OR username IS NOT NULL
);

-- Actually, let's be more restrictive - only allow searching public profiles
DROP POLICY IF EXISTS "Users can search profiles with username" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can search public profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  profile_public = true 
  AND username IS NOT NULL
);

-- Friends should be able to see each other's profiles
CREATE POLICY "Friends can view each others profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  are_friends(auth.uid(), user_id)
);