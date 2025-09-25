import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Move today's results to yesterday's results and clear today's results
    const { error } = await supabase
      .from('games')
      .update({
        yesterday_result: supabase.rpc('today_result'),
        today_result: null,
        status: 'pending',
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error migrating results:', error);
      throw error;
    }

    // Alternative approach using raw SQL for better reliability
    const { error: sqlError } = await supabase.rpc('migrate_daily_results');

    if (sqlError) {
      console.error('Error with SQL migration:', sqlError);
      // Try the update approach as fallback
      const { data: games } = await supabase
        .from('games')
        .select('id, today_result')
        .not('today_result', 'is', null);

      if (games && games.length > 0) {
        for (const game of games) {
          await supabase
            .from('games')
            .update({
              yesterday_result: game.today_result,
              today_result: null,
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', game.id);
        }
      }
    }

    console.log('Daily result migration completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily result migration completed',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in daily migration:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});