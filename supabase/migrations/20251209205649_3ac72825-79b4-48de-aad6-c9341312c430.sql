-- Fix friendships policies - they're all RESTRICTIVE
DROP POLICY IF EXISTS "Deny anonymous access to friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can insert friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can insert friendships" 
ON public.friendships 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their friendships" 
ON public.friendships 
FOR SELECT 
TO authenticated
USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));

CREATE POLICY "Users can delete their friendships" 
ON public.friendships 
FOR DELETE 
TO authenticated
USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));