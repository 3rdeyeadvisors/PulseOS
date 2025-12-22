-- Add leaderboard_reminders column with default FALSE (disabled for everyone)
ALTER TABLE public.email_preferences 
ADD COLUMN IF NOT EXISTS leaderboard_reminders boolean NOT NULL DEFAULT false;

-- Update all existing users to have leaderboard_reminders disabled
UPDATE public.email_preferences SET leaderboard_reminders = false;