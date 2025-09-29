-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run daily at 00:55 AM
SELECT cron.schedule(
  'daily-result-migration',
  '55 0 * * *', -- At 00:55 every day
  $$
  SELECT
    net.http_post(
        url:='https://lgffdjrwblfycfqarstj.supabase.co/functions/v1/daily-result-migration',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZmZkanJ3YmxmeWNmcWFyc3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTEyMDMsImV4cCI6MjA3NDEyNzIwM30.ZZtOwiKM49jg36E80VTGFOMKNFHXw4xFuFsAkDgo718"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);