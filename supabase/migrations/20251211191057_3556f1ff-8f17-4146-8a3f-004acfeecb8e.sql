-- Create task_invites table for inviting friends to compete on tasks
CREATE TABLE public.task_invites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_task_invite UNIQUE (task_id, receiver_id)
);

-- Enable RLS
ALTER TABLE public.task_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view task invites they sent or received"
ON public.task_invites
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send task invites to friends"
ON public.task_invites
FOR INSERT
WITH CHECK (auth.uid() = sender_id AND are_friends(auth.uid(), receiver_id));

CREATE POLICY "Users can update task invites they received"
ON public.task_invites
FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete task invites they sent"
ON public.task_invites
FOR DELETE
USING (auth.uid() = sender_id);

-- Create trigger for updated_at
CREATE TRIGGER update_task_invites_updated_at
BEFORE UPDATE ON public.task_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_task_invites_receiver ON public.task_invites(receiver_id);
CREATE INDEX idx_task_invites_sender ON public.task_invites(sender_id);
CREATE INDEX idx_task_invites_task ON public.task_invites(task_id);