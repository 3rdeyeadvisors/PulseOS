-- Fix: Remove the public profile policy entirely
-- All public profile access should go through the security definer functions:
-- - search_public_profiles() - for searching
-- - get_safe_public_profile() - for viewing specific profiles
-- These functions properly filter sensitive columns (email, location)

DROP POLICY IF EXISTS "Users can view public profile basics for friend requests" ON public.profiles;

-- The remaining policies are secure:
-- - "Users can view own profile" - only own data
-- - "Friends can view each others basic profiles" - requires friendship
-- - "Admins can view all profiles" - admin only

-- Also fix the user_roles policy that exposes admin identities
DROP POLICY IF EXISTS "Users can view admin roles" ON public.user_roles;

-- Fix password_reset_tokens policy to properly use service_role check
DROP POLICY IF EXISTS "Service role only" ON public.password_reset_tokens;

CREATE POLICY "Service role only access"
ON public.password_reset_tokens
FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);