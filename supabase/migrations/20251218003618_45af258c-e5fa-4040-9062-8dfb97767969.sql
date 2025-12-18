-- Fix: Remove the friends policy that exposes all columns
-- The get_safe_public_profile() function already handles friend access securely
-- by filtering out sensitive fields

DROP POLICY IF EXISTS "Friends can view each others basic profiles" ON public.profiles;

-- Now profile access is properly restricted:
-- - "Users can view own profile" - only own data (all columns)
-- - "Admins can view all profiles" - admin only (for support)
-- All friend profile access must go through get_safe_public_profile() function