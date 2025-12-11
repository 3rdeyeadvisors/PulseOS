-- Allow all authenticated users to read admin roles (for founder badge display)
CREATE POLICY "Users can view admin roles"
ON public.user_roles
FOR SELECT
USING (role = 'admin' AND auth.uid() IS NOT NULL);