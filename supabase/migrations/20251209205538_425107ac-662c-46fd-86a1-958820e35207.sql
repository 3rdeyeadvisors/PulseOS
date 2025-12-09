-- Fix the UPDATE policy - make it permissive
DROP POLICY IF EXISTS "Users can update requests they received" ON public.friend_requests;

CREATE POLICY "Users can update requests they received" 
ON public.friend_requests 
FOR UPDATE 
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Also fix the INSERT policy
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;

CREATE POLICY "Users can send friend requests" 
ON public.friend_requests 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- And the DELETE policy
DROP POLICY IF EXISTS "Users can delete requests they sent" ON public.friend_requests;

CREATE POLICY "Users can delete requests they sent" 
ON public.friend_requests 
FOR DELETE 
TO authenticated
USING (auth.uid() = sender_id);