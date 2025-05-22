// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

interface CreateSDRRequest {
  email: string
  password: string
  fullName: string
  role: 'sdr'
}

serve(async (req) => {
  try {
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      })
    }

    // Get request body
    const { email, password, fullName, role } = await req.json() as CreateSDRRequest

    // Validate input
    if (!email || !password || !fullName || role !== 'sdr') {
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user already exists in auth
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = users?.find(u => u.email === email)

    if (existingAuthUser) {
      return new Response(
        JSON.stringify({ error: 'An account with this email already exists' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'A profile with this email already exists' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Create user with admin rights
    const { data: { user }, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'sdr'
      }
    })

    if (createUserError) {
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Create profile for the new user
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: user.id,
          email,
          full_name: fullName,
          role: 'sdr',
          active: true
        }
      ])
      .select()
      .single()

    if (profileError) {
      // If profile creation fails, delete the user to maintain consistency
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    return new Response(
      JSON.stringify({ user, profile }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        } 
      }
    )
  }
})