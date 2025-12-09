-- Add unique constraint to username
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Add verified column for special users
ALTER TABLE public.profiles ADD COLUMN verified boolean DEFAULT false;

-- Mark admins as verified
UPDATE public.profiles 
SET verified = true 
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
);