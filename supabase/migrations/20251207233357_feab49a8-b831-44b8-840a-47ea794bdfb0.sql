-- Add DELETE policy for profiles table (GDPR compliance)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Add DELETE policy for preferences table
CREATE POLICY "Users can delete their own preferences"
ON public.preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Add UPDATE policy for chat_messages (allow users to edit their messages)
CREATE POLICY "Users can update their own messages"
ON public.chat_messages
FOR UPDATE
USING (auth.uid() = user_id);