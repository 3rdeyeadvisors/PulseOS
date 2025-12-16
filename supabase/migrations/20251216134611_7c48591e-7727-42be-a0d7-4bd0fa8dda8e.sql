-- Update search function to allow finding users by username even if profile is private
-- Full name search still requires public profile
CREATE OR REPLACE FUNCTION public.search_public_profiles(search_query text)
RETURNS TABLE(user_id uuid, username text, full_name text, avatar_url text, verified boolean)
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
    p.verified
  FROM public.profiles p
  WHERE p.username IS NOT NULL
    AND (
      -- Username search works regardless of profile_public
      p.username ILIKE '%' || search_query || '%'
      -- Full name search only works if profile is public
      OR (p.profile_public = true AND p.full_name ILIKE '%' || search_query || '%')
    )
  LIMIT 20;
$$;