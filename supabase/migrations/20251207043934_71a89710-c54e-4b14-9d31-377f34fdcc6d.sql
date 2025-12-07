-- Add state column to profiles for better local news
ALTER TABLE public.profiles 
ADD COLUMN state text;