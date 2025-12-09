-- Update profile_public default to true so new users can be found
ALTER TABLE public.profiles ALTER COLUMN profile_public SET DEFAULT true;

-- Update existing users who have a username to be searchable
UPDATE public.profiles SET profile_public = true WHERE username IS NOT NULL AND profile_public IS NULL;
UPDATE public.profiles SET profile_public = true WHERE username IS NOT NULL AND profile_public = false;