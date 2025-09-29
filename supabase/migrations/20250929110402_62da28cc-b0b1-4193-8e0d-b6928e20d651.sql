-- Ensure realtime emits full row data for updates
ALTER TABLE public.games REPLICA IDENTITY FULL;

-- Make sure games is part of the realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'games') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
  END IF;
END $$;