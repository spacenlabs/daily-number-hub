-- Populate random results history for all games from 2025-01-01 to 2025-10-06
DO $$
DECLARE
    game_record RECORD;
    loop_date DATE;
    end_date DATE := '2025-10-06';
    start_date DATE := '2025-01-01';
    random_result INTEGER;
BEGIN
    -- Loop through all games
    FOR game_record IN SELECT id FROM public.games LOOP
        -- Loop through each date
        loop_date := start_date;
        WHILE loop_date <= end_date LOOP
            -- Generate random result between 0 and 99
            random_result := floor(random() * 100)::INTEGER;
            
            -- Insert into history
            INSERT INTO public.game_results_history (
                game_id,
                result,
                result_date,
                mode,
                published_at
            )
            VALUES (
                game_record.id,
                random_result,
                loop_date,
                'manual',
                loop_date::timestamp + interval '23 hours'
            )
            ON CONFLICT (game_id, result_date) 
            DO UPDATE SET
                result = EXCLUDED.result,
                mode = EXCLUDED.mode,
                published_at = EXCLUDED.published_at,
                updated_at = now();
            
            -- Move to next date
            loop_date := loop_date + interval '1 day';
        END LOOP;
    END LOOP;
    
    -- Set yesterday_result for all games (October 6th, 2025)
    UPDATE public.games
    SET yesterday_result = floor(random() * 100)::INTEGER,
        updated_at = now();
    
    RAISE NOTICE 'Successfully populated random results history from % to % for all games', start_date, end_date;
END $$;