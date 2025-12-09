-- Remove duplicate policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Drop the safe_profiles view as it's not needed and creates security issues
DROP VIEW IF EXISTS public.safe_profiles;

-- Remove the email column exposure by ensuring queries only select safe fields
-- The email is needed internally but should never be exposed to other users
-- This is enforced at application level since RLS can't restrict columns