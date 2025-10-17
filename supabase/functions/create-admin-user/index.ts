import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the user making the request is a super admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Check if user is super admin
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole || userRole.role !== 'super_admin') {
      throw new Error('Insufficient permissions - Super Admin required')
    }

    // Parse request body
    const { email, password, role, firstName, lastName } = await req.json()

    if (!email || !password || !role) {
      throw new Error('Missing required fields: email, password, role')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }

    // Validate password strength
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    // Validate role
    const validRoles = ['super_admin', 'admin', 'game_manager', 'content_manager', 'result_operator', 'viewer', 'user']
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role specified')
    }

    // Create user with admin privileges
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        created_by_admin: true,
        created_by: user.id,
        first_name: firstName,
        last_name: lastName
      }
    })

    if (createError) {
      console.error('User creation error:', createError)
      throw new Error(`Failed to create user: ${createError.message}`)
    }

    if (!newUser.user) {
      throw new Error('User creation failed - no user returned')
    }

    // Set the user's role in user_roles table (will also trigger permissions assignment via trigger)
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({ 
        user_id: newUser.user.id,
        role: role,
        assigned_by: user.id
      })

    if (roleInsertError) {
      console.error('Role insert error:', roleInsertError)
      // Try to clean up the created user if role insert fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw new Error(`Failed to set user role: ${roleInsertError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully',
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          role: role,
          created_at: newUser.user.created_at
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})