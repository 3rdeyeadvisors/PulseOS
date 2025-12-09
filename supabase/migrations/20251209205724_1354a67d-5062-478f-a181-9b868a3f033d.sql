-- Create a function to create friendship in both directions
CREATE OR REPLACE FUNCTION public.create_friendship(_user_id uuid, _friend_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.friendships (user_id, friend_id)
  VALUES (_user_id, _friend_id)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.friendships (user_id, friend_id)
  VALUES (_friend_id, _user_id)
  ON CONFLICT DO NOTHING;
END;
$$;