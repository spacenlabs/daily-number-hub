-- Enable comprehensive realtime for games table
-- 1) Ensure full row data is available to Realtime
DO $$
BEGIN
  -- Set REPLICA IDENTITY FULL (idempotent)
  EXECUTE 'ALTER TABLE public.games REPLICA IDENTITY FULL';
EXCEPTION
  WHEN others THEN
    -- Ignore if table already configured; this is safe to re-run
    NULL;
END $$;

-- 2) Add table to supabase_realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'games'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.games';
  END IF;
END $$;