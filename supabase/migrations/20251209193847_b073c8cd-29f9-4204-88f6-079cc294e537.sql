
-- Phase 4: Activity Invites

-- 1. Create invite_status enum
DO $$ BEGIN
  CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'declined', 'countered');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create activity_invites table
CREATE TABLE IF NOT EXISTS public.activity_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'restaurant', 'event', 'movie', etc.
  activity_name text NOT NULL,
  activity_data jsonb, -- Store venue details, event info, etc.
  proposed_time timestamp with time zone NOT NULL,
  message text,
  status public.invite_status NOT NULL DEFAULT 'pending',
  counter_time timestamp with time zone, -- For counter-proposals
  counter_message text,
  counter_count integer NOT NULL DEFAULT 0, -- Track number of counters (max 1 each)
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT different_users_invite CHECK (sender_id != receiver_id),
  CONSTRAINT max_counters CHECK (counter_count <= 2)
);

-- Enable RLS
ALTER TABLE public.activity_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view invites they sent or received"
ON public.activity_invites FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send invites to friends only"
ON public.activity_invites FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND public.are_friends(auth.uid(), receiver_id)
);

CREATE POLICY "Users can update invites they're part of"
ON public.activity_invites FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete invites they sent"
ON public.activity_invites FOR DELETE
USING (auth.uid() = sender_id);

-- 3. Create trigger for updated_at
CREATE TRIGGER update_activity_invites_updated_at
BEFORE UPDATE ON public.activity_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_invites_receiver ON public.activity_invites(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_invites_sender ON public.activity_invites(sender_id, status);

-- 5. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_invites;
