import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting password reset function');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { email }: ResetPasswordRequest = await req.json();
    console.log('Password reset requested for email:', email);

    if (!email) {
      console.error('No email provided');
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user exists
    const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    if (getUserError) {
      console.error('Error checking user existence:', getUserError);
      return new Response(JSON.stringify({ error: 'Failed to verify user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userExists = users.users.some(user => user.email === email);
    if (!userExists) {
      console.log('User does not exist, but returning success for security');
      // Return success even if user doesn't exist for security reasons
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'If this email is registered, you will receive a password reset link shortly.' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the current origin for redirect URL
    const origin = req.headers.get('referer') || req.headers.get('origin');
    const redirectUrl = origin ? `${origin}` : 'https://89a9d7af-2e3f-43f4-8054-669cdb4e33cc.lovableproject.com/';

    console.log('Sending password reset email to:', email);
    console.log('Redirect URL:', redirectUrl);

    // Send password reset email using admin client
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (resetError) {
      console.error('Error sending password reset email:', resetError);
      return new Response(JSON.stringify({ error: 'Failed to send password reset email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Password reset email sent successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Password reset email sent successfully. Please check your inbox.' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in reset-password function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);