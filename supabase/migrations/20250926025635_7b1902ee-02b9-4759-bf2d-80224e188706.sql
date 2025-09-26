-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the daily result migration to run at 12:01 AM every day
SELECT cron.schedule(
    'daily-result-migration',
    '1 0 * * *', -- Run at 12:01 AM every day
    $$
    SELECT
      net.http_post(
          url:='https://lgffdjrwblfycfqarstj.supabase.co/functions/v1/daily-result-migration',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZmZkanJ3YmxmeWNmcWFyc3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTEyMDMsImV4cCI6MjA3NDEyNzIwM30.ZZtOwiKM49jg36E80VTGFOMKNFHXw4xFuFsAkDgo718"}'::jsonb,
          body:='{"scheduled": true}'::jsonb
      ) as request_id;
    $$
);