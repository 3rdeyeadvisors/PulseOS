-- Add timezone column to profiles
ALTER TABLE public.profiles 
ADD COLUMN timezone text DEFAULT 'America/Chicago';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone in IANA format (e.g., America/Chicago)';