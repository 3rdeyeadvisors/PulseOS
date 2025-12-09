-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Users can view requests they sent or received" ON public.friend_requests;

-- Create permissive policy for viewing requests
CREATE POLICY "Users can view requests they sent or received" 
ON public.friend_requests 
FOR SELECT 
TO authenticated
USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));