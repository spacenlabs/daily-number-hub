import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResultUpdate {
  game_id: string;
  result_date: string;
  result: number;
  mode: 'auto' | 'manual';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to manage results
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['super_admin', 'admin', 'game_manager', 'result_operator'].includes(userRole.role)) {
      console.error('Permission denied for user:', user.id, 'with role:', userRole?.role);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authorized with role:', userRole.role);

    const { results } = await req.json() as { results: ResultUpdate[] };

    if (!results || !Array.isArray(results) || results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No results provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${results.length} result updates`);

    // Process each result
    let successCount = 0;
    const errors: string[] = [];

    for (const update of results) {
      try {
        // Insert into game_results_history table with upsert
        const { error: historyError } = await supabase
          .from('game_results_history')
          .upsert({ 
            game_id: update.game_id,
            result_date: update.result_date,
            result: update.result,
            mode: update.mode || 'manual',
            published_at: new Date().toISOString()
          }, {
            onConflict: 'game_id,result_date'
          });

        if (historyError) {
          errors.push(`Failed to insert result for game ${update.game_id}: ${historyError.message}`);
          console.error('History insert error:', historyError);
          continue;
        }

        // Also update the games table today_result if the date matches today
        const today = new Date().toISOString().split('T')[0];
        if (update.result_date === today) {
          const { error: gameError } = await supabase
            .from('games')
            .update({ 
              today_result: update.result,
              status: 'published',
              updated_at: new Date().toISOString()
            })
            .eq('id', update.game_id);

          if (gameError) {
            errors.push(`Failed to update game ${update.game_id}: ${gameError.message}`);
            console.error('Game update error:', gameError);
          } else {
            console.log(`Updated today_result for game ${update.game_id}: ${update.result}`);
          }
        }

        successCount++;
        console.log(`Processed result for game ${update.game_id} on ${update.result_date}: ${update.result}`);
      } catch (error) {
        errors.push(`Error processing game ${update.game_id}: ${error.message}`);
        console.error('Processing error:', error);
      }
    }

    console.log(`Successfully updated ${successCount} results`);
    if (errors.length > 0) {
      console.error('Errors:', errors);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        success_count: successCount,
        processed: results.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
