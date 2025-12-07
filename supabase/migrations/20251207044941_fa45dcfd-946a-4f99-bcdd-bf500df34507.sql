-- Add zip_code column to profiles for more accurate location
ALTER TABLE public.profiles 
ADD COLUMN zip_code text;