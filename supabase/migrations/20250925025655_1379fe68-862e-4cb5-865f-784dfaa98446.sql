-- Create function for daily result migration
CREATE OR REPLACE FUNCTION public.migrate_daily_results()
RETURNS void AS $$
BEGIN
    -- Move today's results to yesterday's results and clear today's results
    UPDATE public.games 
    SET 
        yesterday_result = today_result,
        today_result = NULL,
        status = 'pending',
        updated_at = now()
    WHERE today_result IS NOT NULL;
    
    -- Log the migration
    RAISE NOTICE 'Daily result migration completed at %', now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the daily migration function to run at 12:01 AM every day
SELECT cron.schedule(
    'daily-result-migration',
    '1 0 * * *',  -- At 12:01 AM every day
    $$
    SELECT net.http_post(
        url := 'https://lgffdjrwblfycfqarstj.supabase.co/functions/v1/daily-result-migration',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZmZkanJ3YmxmeWNmcWFyc3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTEyMDMsImV4cCI6MjA3NDEyNzIwM30.ZZtOwiKM49jg36E80VTGFOMKNFHXw4xFuFsAkDgo718"}'::jsonb,
        body := '{"trigger": "cron"}'::jsonb
    );
    $$
);

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;