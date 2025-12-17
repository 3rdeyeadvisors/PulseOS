-- Update the handle_new_user function to automatically start a 14-day trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Create subscription record with 14-day trial starting immediately
  INSERT INTO public.user_subscriptions (user_id, status, is_grandfathered, trial_ends_at)
  VALUES (NEW.id, 'trialing', FALSE, NOW() + INTERVAL '14 days');
  
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
$function$;