-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create cron job to auto-sync results every 5 minutes
SELECT cron.schedule(
  'auto-sync-results-every-5-minutes',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://lgffdjrwblfycfqarstj.supabase.co/functions/v1/auto-sync-results',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZmZkanJ3YmxmeWNmcWFyc3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTEyMDMsImV4cCI6MjA3NDEyNzIwM30.ZZtOwiKM49jg36E80VTGFOMKNFHXw4xFuFsAkDgo718"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);