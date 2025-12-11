-- Add RLS policy to allow users to view tasks they've been invited to (accepted invites)
CREATE POLICY "Users can view tasks they are participating in"
ON public.tasks
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Own tasks
    user_id = auth.uid() 
    OR 
    -- Tasks where user has accepted an invite
    EXISTS (
      SELECT 1 FROM public.task_invites
      WHERE task_invites.task_id = tasks.id
      AND task_invites.receiver_id = auth.uid()
      AND task_invites.status = 'accepted'
    )
  )
);

-- Drop the old SELECT policy that only allowed viewing own tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;