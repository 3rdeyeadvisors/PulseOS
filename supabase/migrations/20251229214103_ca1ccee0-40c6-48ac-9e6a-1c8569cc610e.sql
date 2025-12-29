-- Drop the overly permissive policy that exposes all profile data to friend request senders
DROP POLICY IF EXISTS "Users can view sender profiles for friend requests" ON public.profiles;

-- Add policy for friends to view each other's profiles (was missing)
CREATE POLICY "Users can view friends profiles"
ON public.profiles
FOR SELECT
USING (are_friends(auth.uid(), user_id));

-- Create a secure function for viewing friend request sender profiles
-- This only returns the minimal data needed to identify who sent a request
CREATE OR REPLACE FUNCTION public.get_friend_request_sender_profile(sender_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  username text,
  avatar_url text,
  verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.username,
    p.avatar_url,
    p.verified
  FROM public.profiles p
  WHERE p.user_id = sender_user_id
    AND EXISTS (
      SELECT 1 
      FROM public.friend_requests fr
      WHERE fr.sender_id = sender_user_id 
        AND fr.receiver_id = auth.uid()
        AND fr.status = 'pending'
    );
$$;