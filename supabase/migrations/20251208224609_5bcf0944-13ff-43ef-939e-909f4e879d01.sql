-- Add INSERT policy for email_logs table to allow users to insert their own email logs
-- This enables proper tracking of email delivery status
CREATE POLICY "Users can insert their own email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);