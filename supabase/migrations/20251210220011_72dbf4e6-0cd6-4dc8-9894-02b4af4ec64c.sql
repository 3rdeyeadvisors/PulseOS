-- Fix security issues by restricting what data friends and public searchers can see
-- The issue is that current RLS policies allow access to ALL columns including sensitive ones like email

-- Drop the overly permissive "Friends can view each others profiles" policy
DROP POLICY IF EXISTS "Friends can view each others profiles" ON public.profiles;

-- Drop the overly permissive "Users can search public profiles limited" policy
DROP POLICY IF EXISTS "Users can search public profiles limited" ON public.profiles;

-- Create a new restricted policy for friends that only allows access through the safe function
-- Friends should use get_safe_public_profile() function which filters sensitive data
-- This new policy allows friends to see basic info only (username, avatar, full_name if public)
CREATE POLICY "Friends can view limited profile data"
ON public.profiles
FOR SELECT
USING (
  -- User is viewing their own profile (handled by another policy, but keeping for safety)
  auth.uid() = user_id
  OR
  -- User is an admin
  public.has_role(auth.uid(), 'admin')
);

-- Update the get_safe_public_profile function to be more restrictive
-- Remove email from the returned data entirely
CREATE OR REPLACE FUNCTION public.get_safe_public_profile(profile_user_id uuid)
RETURNS TABLE(
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
    -- Only show full_name if profile is public
    CASE WHEN p.profile_public THEN p.full_name ELSE NULL END,
    p.avatar_url,
    -- Only show location if profile is public
    CASE WHEN p.profile_public THEN p.city ELSE NULL END,
    CASE WHEN p.profile_public THEN p.state ELSE NULL END,
    p.interests_public
  FROM public.profiles p
  WHERE p.user_id = profile_user_id
    AND (
      p.profile_public = true 
      OR p.user_id = auth.uid() 
      OR public.are_friends(auth.uid(), p.user_id)
    );
$$;

-- Create a secure function for searching profiles that doesn't expose sensitive data
CREATE OR REPLACE FUNCTION public.search_public_profiles(search_query text)
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  avatar_url text,
  verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.username,
    CASE WHEN p.profile_public THEN p.full_name ELSE NULL END,
    p.avatar_url,
    p.verified
  FROM public.profiles p
  WHERE p.profile_public = true
    AND p.username IS NOT NULL
    AND (
      p.username ILIKE '%' || search_query || '%'
      OR (p.profile_public AND p.full_name ILIKE '%' || search_query || '%')
    )
  LIMIT 20;
$$;