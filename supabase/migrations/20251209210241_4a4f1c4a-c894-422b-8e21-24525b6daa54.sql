-- Fix the SECURITY DEFINER view issue by dropping and recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.safe_profiles;

CREATE VIEW public.safe_profiles 
WITH (security_invoker = true) AS
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