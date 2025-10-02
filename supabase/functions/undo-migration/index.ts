import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('Undo migration function called at:', new Date().toISOString())
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get backup_id from request body
    const { backup_id } = await req.json()

    if (!backup_id) {
      throw new Error('backup_id is required')
    }

    console.log('Attempting to restore from backup:', backup_id)

    // Fetch the backup data
    const { data: backup, error: fetchError } = await supabase
      .from('migration_backups')
      .select('*')
      .eq('id', backup_id)
      .eq('restored', false)
      .single()

    if (fetchError || !backup) {
      console.error('Error fetching backup:', fetchError)
      throw new Error('Backup not found or already restored')
    }

    console.log(`Restoring ${backup.backup_data.length} games from backup...`)

    // Restore each game's state
    for (const game of backup.backup_data) {
      const { error: updateError } = await supabase
        .from('games')
        .update({
          today_result: game.today_result,
          yesterday_result: game.yesterday_result,
          status: game.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', game.id)

      if (updateError) {
        console.error(`Error restoring game ${game.id}:`, updateError)
        throw updateError
      }
    }

    // Mark backup as restored
    const { error: markError } = await supabase
      .from('migration_backups')
      .update({
        restored: true,
        restored_at: new Date().toISOString()
      })
      .eq('id', backup_id)

    if (markError) {
      console.error('Error marking backup as restored:', markError)
      throw markError
    }

    console.log('Undo migration completed successfully at:', new Date().toISOString())

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Migration successfully undone',
        restored_games: backup.backup_data.length,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Undo migration failed:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    )
  }
})
