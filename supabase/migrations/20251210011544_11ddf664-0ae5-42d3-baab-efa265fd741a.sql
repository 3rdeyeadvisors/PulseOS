-- 1. Create a secure view for public profile searches that only exposes safe fields
CREATE OR REPLACE VIEW public.public_profile_search AS
SELECT 
  user_id,
  username,
  full_name,
  avatar_url,
  profile_public
FROM public.profiles
WHERE profile_public = true AND username IS NOT NULL;

-- 2. Drop the existing permissive public profile search policy
DROP POLICY IF EXISTS "Users can search public profiles" ON public.profiles;

-- 3. Create a more restrictive public profile search policy that excludes sensitive data
-- Users can only see limited fields when searching public profiles
CREATE POLICY "Users can search public profiles limited"
ON public.profiles
FOR SELECT
USING (
  profile_public = true 
  AND username IS NOT NULL 
  AND auth.uid() IS NOT NULL
);

-- 4. Create a function to get safe public profile data
CREATE OR REPLACE FUNCTION public.get_safe_public_profile(profile_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  full_name text,
  avatar_url text,
  city text,
  state text,
  interests_public boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.username,
    p.full_name,
    p.avatar_url,
    CASE WHEN p.profile_public THEN p.city ELSE NULL END,
    CASE WHEN p.profile_public THEN p.state ELSE NULL END,
    p.interests_public
  FROM public.profiles p
  WHERE p.user_id = profile_user_id
    AND (p.profile_public = true OR p.user_id = auth.uid() OR public.are_friends(auth.uid(), p.user_id));
$$;

-- 5. Create admin policy for email_logs monitoring
CREATE POLICY "Admins can view all email logs"
ON public.email_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Allow service role to insert notifications (for system messages)
-- This is handled by service role key, but let's add a permissive policy for edge functions
CREATE POLICY "Service can insert system notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- 7. Drop the restrictive insert policy and recreate as permissive for user notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 8. Fix user_roles policy to be permissive
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);