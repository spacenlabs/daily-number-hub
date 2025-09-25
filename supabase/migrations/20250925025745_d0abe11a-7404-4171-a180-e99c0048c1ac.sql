-- Fix security warnings from previous migration

-- 1. Fix Function Search Path Mutable - Update the migrate_daily_results function
DROP FUNCTION IF EXISTS public.migrate_daily_results();

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;