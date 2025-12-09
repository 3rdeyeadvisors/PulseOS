
-- Phase 1: Social Features Database Schema

-- 1. Add social fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS interests_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_public boolean DEFAULT false;

-- Create index for username searches
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_public ON public.profiles(profile_public) WHERE profile_public = true;

-- 2. Create friend_request_status enum
DO $$ BEGIN
  CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status public.friend_request_status NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT different_users CHECK (sender_id != receiver_id),
  CONSTRAINT unique_request UNIQUE (sender_id, receiver_id)
);

-- Enable RLS on friend_requests
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for friend_requests
CREATE POLICY "Users can view requests they sent or received"
ON public.friend_requests FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
ON public.friend_requests FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update requests they received"
ON public.friend_requests FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete requests they sent"
ON public.friend_requests FOR DELETE
USING (auth.uid() = sender_id);

-- 4. Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT different_friends CHECK (user_id != friend_id),
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- Enable RLS on friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS policies for friendships
CREATE POLICY "Users can view their friendships"
ON public.friendships FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friendships"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their friendships"
ON public.friendships FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 5. Update daily_action_scores for 500 point system
ALTER TABLE public.daily_action_scores 
ADD COLUMN IF NOT EXISTS social_engagement integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_bonus integer NOT NULL DEFAULT 0;

-- 6. Create trigger to update updated_at on friend_requests
CREATE TRIGGER update_friend_requests_updated_at
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create function to check if two users are friends
CREATE OR REPLACE FUNCTION public.are_friends(_user_id uuid, _friend_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friendships
    WHERE (user_id = _user_id AND friend_id = _friend_id)
       OR (user_id = _friend_id AND friend_id = _user_id)
  )
$$;

-- 8. Create function to get pending friend request count
CREATE OR REPLACE FUNCTION public.get_pending_request_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.friend_requests
  WHERE receiver_id = _user_id AND status = 'pending'
$$;
