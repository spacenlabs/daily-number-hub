-- Create game_results_history table for storing historical results
CREATE TABLE IF NOT EXISTS public.game_results_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  result INTEGER NOT NULL CHECK (result >= 0 AND result <= 99),
  result_date DATE NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  mode TEXT DEFAULT 'manual' CHECK (mode IN ('auto', 'manual')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, result_date)
);

-- Enable Row Level Security
ALTER TABLE public.game_results_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Results history is viewable by everyone" 
ON public.game_results_history 
FOR SELECT 
USING (true);

-- Create policies for authenticated users with permissions to insert/update
CREATE POLICY "Authenticated users can insert results history" 
ON public.game_results_history 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update results history" 
ON public.game_results_history 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete results history" 
ON public.game_results_history 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create index for better performance
CREATE INDEX idx_game_results_history_game_date ON public.game_results_history(game_id, result_date DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_game_results_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_game_results_history_updated_at
BEFORE UPDATE ON public.game_results_history
FOR EACH ROW
EXECUTE FUNCTION public.update_game_results_history_updated_at();