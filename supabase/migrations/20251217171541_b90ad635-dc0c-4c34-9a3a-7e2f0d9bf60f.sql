-- Update handle_new_user to create subscription record for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  -- Create default preferences
  INSERT INTO public.preferences (user_id)
  VALUES (NEW.id);
  
  -- Create subscription record (new users get trial, not grandfathered)
  INSERT INTO public.user_subscriptions (user_id, status, is_grandfathered)
  VALUES (NEW.id, 'inactive', FALSE);
  
  -- Assign admin role if email matches Kevin's emails
  IF NEW.email IN ('kevinroberts5678@gmail.com', 'kevin@pulselife.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;