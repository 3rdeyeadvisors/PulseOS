-- Create table to track daily action scores
CREATE TABLE public.daily_action_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  tasks_total INTEGER NOT NULL DEFAULT 0,
  recommendations_tried INTEGER NOT NULL DEFAULT 0,
  chat_interactions INTEGER NOT NULL DEFAULT 0,
  daily_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, score_date)
);

-- Enable RLS
ALTER TABLE public.daily_action_scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own scores"
ON public.daily_action_scores
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores"
ON public.daily_action_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
ON public.daily_action_scores
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_daily_action_scores_updated_at
BEFORE UPDATE ON public.daily_action_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();