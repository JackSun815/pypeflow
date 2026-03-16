// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractConversationId(payload: any) {
  return (
    payload?.conversation_id ||
    payload?.conversationId ||
    payload?.data?.conversation_id ||
    payload?.data?.conversationId
  )
}

function extractEventType(payload: any) {
  return (
    payload?.event_type ||
    payload?.eventType ||
    payload?.type ||
    payload?.data?.event_type ||
    payload?.data?.type ||
    'unknown'
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    await supabaseAdmin
      .from('ai_practice_sessions')
      .delete()
      .lte('expires_at', new Date().toISOString())

    const conversationId = extractConversationId(payload)
    const eventType = extractEventType(payload)

    if (!conversationId) {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const updateData: Record<string, unknown> = {
      callback_payload: payload,
      status: eventType,
    }

    const { error } = await supabaseAdmin
      .from('ai_practice_sessions')
      .update(updateData)
      .eq('tavus_conversation_id', conversationId)

    if (error) {
      throw new Error(error.message)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    console.error('tavus-webhook error:', error)

    return new Response(JSON.stringify({
      error: error.message || 'Failed to process Tavus webhook',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
