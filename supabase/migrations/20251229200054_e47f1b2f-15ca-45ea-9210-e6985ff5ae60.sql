-- Phase 1: Allow users to view profiles of people who sent them friend requests
-- This fixes the "Unknown User" issue when displaying pending friend requests

CREATE POLICY "Users can view sender profiles for friend requests"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friend_requests
    WHERE friend_requests.sender_id = profiles.user_id
    AND friend_requests.receiver_id = auth.uid()
    AND friend_requests.status = 'pending'
  )
);