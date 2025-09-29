-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily migration at 12:01 AM every day
SELECT cron.schedule(
  'daily-result-migration',
  '1 0 * * *', -- At 12:01 AM every day (1 minute past midnight)
  $$
  SELECT
    net.http_post(
        url:='https://lgffdjrwblfycfqarstj.supabase.co/functions/v1/daily-migration',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZmZkanJ3YmxmeWNmcWFyc3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTEyMDMsImV4cCI6MjA3NDEyNzIwM30.ZZtOwiKM49jg36E80VTGFOMKNFHXw4xFuFsAkDgo718"}'::jsonb,
        body:='{"trigger": "cron", "timestamp": "'||now()||'"}'::jsonb
    ) as request_id;
  $$
);