-- Fix the extension schema issue properly
-- The extensions are managed by Supabase and should be left as they are
-- The warning is acceptable for managed extensions

-- Just ensure the cron job is properly scheduled
-- First, unschedule any existing job
SELECT cron.unschedule('daily-result-migration');

-- Re-schedule the daily migration job
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