
-- Fix the create_friendship function to properly handle SECURITY DEFINER context
-- The function already has SECURITY DEFINER but we need to ensure proper execution
CREATE OR REPLACE FUNCTION public.create_friendship(_user_id uuid, _friend_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert friendship in both directions for bidirectional relationship
  INSERT INTO public.friendships (user_id, friend_id)
  VALUES (_user_id, _friend_id)
  ON CONFLICT ON CONSTRAINT unique_friendship DO NOTHING;
  
  INSERT INTO public.friendships (user_id, friend_id)
  VALUES (_friend_id, _user_id)
  ON CONFLICT ON CONSTRAINT unique_friendship DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_friendship(uuid, uuid) TO authenticated;
