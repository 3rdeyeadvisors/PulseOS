-- Allow admins to view all preferences (needed for admin dashboard)
CREATE POLICY "Admins can view all preferences"
ON public.preferences
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));