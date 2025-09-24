-- Create games table for lottery results
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_code TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  today_result INTEGER,
  yesterday_result INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('published', 'pending', 'manual')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Create policies - allowing public read access for the homepage, admin write access
CREATE POLICY "Games are publicly readable" 
ON public.games 
FOR SELECT 
USING (true);

CREATE POLICY "Games can be updated by anyone (single admin system)" 
ON public.games 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial games data
INSERT INTO public.games (name, short_code, scheduled_time, today_result, yesterday_result, status) VALUES
('Darbhanga King', 'DK', '11:00', 73, 45, 'published'),
('Samastipur King', 'SK', '14:00', 28, 92, 'published'),
('Madhubani King', 'MK', '15:00', 56, 17, 'published'),
('Sitamarhi King', 'SMK', '16:00', NULL, 84, 'pending'),
('Shri Ganesh', 'SG', '16:30', NULL, 63, 'pending'),
('Chakiya King', 'CK', '17:00', NULL, 39, 'pending'),
('Faridabad', 'FB', '18:00', NULL, 75, 'pending'),
('Muzaffarpur King', 'MZK', '19:00', NULL, 21, 'pending'),
('Ghaziabad', 'GZB', '20:30', NULL, 68, 'pending'),
('Ara King', 'AK', '21:30', NULL, 94, 'pending'),
('Chhapra King', 'CHK', '21:45', NULL, 12, 'pending'),
('Patna King', 'PK', '22:00', NULL, 87, 'pending'),
('Gali', 'GL', '23:30', NULL, 35, 'pending'),
('Disawar', 'DS', '05:00', 49, 76, 'published');