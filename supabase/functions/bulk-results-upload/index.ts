import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResultUpdate {
  game_id: string;
  date: string;
  result: number;
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['super_admin', 'admin', 'game_manager', 'result_operator'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { updates } = await req.json() as { updates: ResultUpdate[] };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No updates provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${updates.length} result updates`);

    // Process each update
    let successCount = 0;
    const errors: string[] = [];

    for (const update of updates) {
      try {
        // For historical data, we'll update yesterday_result
        const { error } = await supabase
          .from('games')
          .update({ 
            yesterday_result: update.result,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.game_id);

        if (error) {
          errors.push(`Failed to update game ${update.game_id}: ${error.message}`);
          console.error('Update error:', error);
        } else {
          successCount++;
        }
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
        processed: updates.length,
        successful: successCount,
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
