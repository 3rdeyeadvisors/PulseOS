-- Add temperature_unit column to preferences
ALTER TABLE public.preferences 
ADD COLUMN temperature_unit TEXT DEFAULT 'fahrenheit' CHECK (temperature_unit IN ('fahrenheit', 'celsius'));