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
  // Enable CORS headers - must be defined outside try/catch
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  }

  // Handle CORS preflight requests FIRST - before any other logic
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    // Get request body
    let body: ContactSupportRequest;
    try {
      body = await req.json() as ContactSupportRequest;
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    const { subject, category, message, email, userName, userRole } = body

    // Validate input
    if (!subject || !category || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: subject, category, and message are required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Email is optional but preferred - use fallback if not provided
    const userEmail = email || userName || 'Unknown User'

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
User: ${userName}${email ? ` (${email})` : ''}
Role: ${userRole}
Subject: ${subject}

Message:
${message}

---
This email was automatically generated from the PypeFlow support form.
    `.trim()

    // Send email using Resend API
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const TO_EMAILS = ['jack.sun121601@gmail.com', 'support@outboundsalespro.com']

    if (RESEND_API_KEY) {
      // Using Resend API
      // Use onboarding@resend.dev if domain not verified, or your verified domain
      const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'PypeFlow Support <onboarding@resend.dev>'
      
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
            body: JSON.stringify({
            from: fromEmail,
            to: TO_EMAILS,
            reply_to: email || userEmail || undefined,
            subject: emailSubject,
            text: emailBody,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Support Request from PypeFlow Dashboard</h2>
              <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Category:</strong> ${categoryLabels[category] || category}</p>
                <p><strong>User:</strong> ${userName}${email ? ` (${email})` : ''}</p>
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
          console.error('Resend API error response:', errorData)
          const errorJson = JSON.parse(errorData || '{}')
          console.error('Resend API error details:', errorJson)
          throw new Error(`Failed to send email: ${errorJson.message || 'Unknown error'}`)
        }
        
        const result = await resendResponse.json()
        console.log('Email sent successfully:', result.id)
      } catch (resendError: any) {
        console.error('Resend API call failed:', resendError)
        // Don't throw - log the error but still return success to user
        // You can check logs in Supabase Dashboard
        console.error('Failed to send email but continuing...', resendError.message)
      }
    } else {
      // Fallback: Use Supabase's built-in email or log for now
      // Note: In production, set RESEND_API_KEY in Supabase Edge Function secrets
      console.log('=== SUPPORT REQUEST (Email not sent - RESEND_API_KEY not configured) ===')
      console.log('To:', TO_EMAILS.join(', '))
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
    const errorMessage = error?.message || error?.toString() || 'Failed to submit support request'
    console.error('Error details:', {
      message: errorMessage,
      stack: error?.stack,
      name: error?.name
    })
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
})

