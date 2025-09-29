import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdatePasswordRequest {
  userId: string;
  newPassword: string;
  currentPassword?: string; // Required when users update their own password
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client for operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create regular client for auth verification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userId, newPassword, currentPassword }: UpdatePasswordRequest = await req.json();

    // Validate password length
    if (!newPassword || newPassword.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has permission to update this password
    const { data: currentUserProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching current user profile:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to verify permissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isUpdatingOwnPassword = user.id === userId;
    const isSuperAdmin = currentUserProfile.role === 'super_admin';
    const canUpdatePassword = isUpdatingOwnPassword || isSuperAdmin;

    if (!canUpdatePassword) {
      return new Response(JSON.stringify({ error: 'Permission denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If user is updating their own password, verify current password
    if (isUpdatingOwnPassword && !isSuperAdmin) {
      if (!currentPassword) {
        return new Response(JSON.stringify({ error: 'Current password is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Update password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update password' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Password updated successfully for user:', userId);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Password updated successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in update-user-password function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);