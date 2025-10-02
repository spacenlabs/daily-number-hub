import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('Daily migration function called at:', new Date().toISOString())
  
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

    console.log('Starting daily result migration...')
    
    // Step 1: Fetch current state of all games before migration
    const { data: gamesBeforeMigration, error: fetchError } = await supabase
      .from('games')
      .select('id, today_result, yesterday_result, status')
    
    if (fetchError) {
      console.error('Error fetching games before migration:', fetchError)
      throw fetchError
    }

    console.log(`Creating backup for ${gamesBeforeMigration?.length || 0} games...`)

    // Step 2: Create backup in migration_backups table
    const { data: backup, error: backupError } = await supabase
      .from('migration_backups')
      .insert({
        backup_data: gamesBeforeMigration,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()
    
    if (backupError) {
      console.error('Error creating backup:', backupError)
      throw backupError
    }

    console.log('Backup created with ID:', backup.id)

    // Step 3: Call the existing database function to migrate results
    const { error: migrationError } = await supabase.rpc('migrate_daily_results')
    
    if (migrationError) {
      console.error('Error during migration:', migrationError)
      throw migrationError
    }

    console.log('Daily migration completed successfully at:', new Date().toISOString())

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily migration completed successfully',
        backup_id: backup.id,
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
    console.error('Daily migration failed:', error)
    
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