-- Fix: Remove the security definer view as it's a security risk
-- We'll rely on the existing security definer FUNCTIONS instead which are properly secured

DROP VIEW IF EXISTS public.public_profiles_view;

-- The existing approach using security definer functions is correct:
-- - search_public_profiles() - for searching users
-- - get_safe_public_profile() - for viewing a specific profile
-- These functions properly filter sensitive data and are the recommended pattern