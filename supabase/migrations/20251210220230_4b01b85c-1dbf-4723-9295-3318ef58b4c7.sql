-- Add policy for friends to view each other's profiles
-- This is needed for social features to work
-- The code should use get_safe_public_profile() function which filters sensitive data like email
CREATE POLICY "Friends can view each others basic profiles"
ON public.profiles
FOR SELECT
USING (
  public.are_friends(auth.uid(), user_id)
);

-- Add policy for users to search public profiles (needed for friend search)
-- Note: The code should use search_public_profiles() function which filters sensitive data
CREATE POLICY "Users can search public profiles"
ON public.profiles
FOR SELECT
USING (
  profile_public = true 
  AND username IS NOT NULL 
  AND auth.uid() IS NOT NULL
);

-- Add INSERT policy for admins on email_logs (for system emails)
CREATE POLICY "Admins can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Also allow service role to insert (for edge functions)
-- Note: Service role bypasses RLS anyway, but this makes it explicit
CREATE POLICY "Service role can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');