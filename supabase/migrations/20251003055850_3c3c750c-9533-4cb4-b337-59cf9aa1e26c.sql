-- Update migrate_daily_results function to auto-save to history
CREATE OR REPLACE FUNCTION public.migrate_daily_results()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- First, archive today's results to history
    INSERT INTO public.game_results_history (
        game_id,
        result,
        result_date,
        mode,
        published_at
    )
    SELECT 
        id as game_id,
        today_result as result,
        CURRENT_DATE - INTERVAL '1 day' as result_date,
        'auto' as mode,
        now() as published_at
    FROM public.games
    WHERE today_result IS NOT NULL
    ON CONFLICT (game_id, result_date) 
    DO UPDATE SET
        result = EXCLUDED.result,
        mode = EXCLUDED.mode,
        published_at = EXCLUDED.published_at,
        updated_at = now();
    
    -- Then migrate results in games table
    UPDATE public.games 
    SET 
        yesterday_result = today_result,
        today_result = NULL,
        status = 'pending',
        updated_at = now()
    WHERE today_result IS NOT NULL;
    
    RAISE NOTICE 'Daily result migration completed at % - % results archived', now(), (SELECT COUNT(*) FROM games WHERE yesterday_result IS NOT NULL);
END;
$function$;