-- Drop the security definer view as it poses security risks
DROP VIEW IF EXISTS public.public_profile_search;

-- Drop the overly permissive notification policy and recreate properly
DROP POLICY IF EXISTS "Service can insert system notifications" ON public.notifications;