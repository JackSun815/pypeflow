// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface ContactSupportRequest {
  subject: string
  category: 'question' | 'technical' | 'bug'
  message: string
  email: string
  userName: string
  userRole: string
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
    const { subject, category, message, email, userName, userRole } = await req.json() as ContactSupportRequest

    // Validate input
    if (!subject || !category || !message || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Prepare email content
    const categoryLabels: Record<string, string> = {
      question: 'General Question',
      technical: 'Technical Difficulty',
      bug: 'Bug Report'
    }

    const emailSubject = `[PypeFlow Support] ${categoryLabels[category] || category}: ${subject}`
    
    const emailBody = `
Support Request from PypeFlow Dashboard

Category: ${categoryLabels[category] || category}
User: ${userName} (${email})
Role: ${userRole}
Subject: ${subject}

Message:
${message}

---
This email was automatically generated from the PypeFlow support form.
    `.trim()

    // Send email using Resend API
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const TO_EMAIL = 'jack.sun121601@gmail.com'

    if (RESEND_API_KEY) {
      // Using Resend API
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'PypeFlow Support <support@pypeflow.com>',
          to: TO_EMAIL,
          reply_to: email,
          subject: emailSubject,
          text: emailBody,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Support Request from PypeFlow Dashboard</h2>
              <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Category:</strong> ${categoryLabels[category] || category}</p>
                <p><strong>User:</strong> ${userName} (${email})</p>
                <p><strong>Role:</strong> ${userRole}</p>
                <p><strong>Subject:</strong> ${subject}</p>
              </div>
              <div style="background-color: #FFFFFF; padding: 16px; border-left: 4px solid #4F46E5; margin: 16px 0;">
                <h3 style="margin-top: 0;">Message:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
              <p style="color: #6B7280; font-size: 12px;">
                This email was automatically generated from the PypeFlow support form.
              </p>
            </div>
          `,
        }),
      })

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text()
        console.error('Resend API error:', errorData)
        throw new Error('Failed to send email via Resend')
      }
    } else {
      // Fallback: Use Supabase's built-in email or log for now
      // Note: In production, set RESEND_API_KEY in Supabase Edge Function secrets
      console.log('=== SUPPORT REQUEST (Email not sent - RESEND_API_KEY not configured) ===')
      console.log('To:', TO_EMAIL)
      console.log('Subject:', emailSubject)
      console.log('Body:', emailBody)
      console.log('========================================')
      
      // For development: You can manually check logs
      // For production: Set RESEND_API_KEY in Supabase Dashboard > Edge Functions > Secrets
      console.warn('RESEND_API_KEY not set. Email not sent. Please configure Resend API key in Supabase Edge Function secrets.')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Support request submitted successfully' }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error: any) {
    console.error('Contact support error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to submit support request' }),
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

