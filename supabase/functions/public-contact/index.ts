// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface PublicContactRequest {
  name: string
  email: string
  phone: string
  message: string
}

serve(async (req) => {
  // Simple CORS headers (matches working contact-support function)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  }

  // Handle CORS preflight requests first
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {

    // Get request body
    const { name, email, phone, message } = await req.json() as PublicContactRequest

    // Validate input
    if (!name || !message || (!email && !phone)) {
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
    const emailSubject = `[PypeFlow Contact] New Inquiry from ${name}`
    
    const contactInfo = []
    if (email) contactInfo.push(`Email: ${email}`)
    if (phone) contactInfo.push(`Phone: ${phone}`)
    
    const emailBody = `
New Contact Form Submission from PypeFlow Website

Contact Information:
${contactInfo.join('\n')}
Name: ${name}

Message:
${message}

---
This email was automatically generated from the PypeFlow public contact form.
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
          from: 'PypeFlow Contact <contact@pypeflow.com>',
          to: TO_EMAIL,
          reply_to: email || undefined,
          subject: emailSubject,
          text: emailBody,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 24px; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h2>
                <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">From PypeFlow Website</p>
              </div>
              <div style="background-color: #F9FAFB; padding: 24px; border: 1px solid #E5E7EB; border-top: none;">
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
                  <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Contact Information</h3>
                  <p style="color: #374151; margin: 4px 0;"><strong>Name:</strong> ${name}</p>
                  ${email ? `<p style="color: #374151; margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #2563eb;">${email}</a></p>` : ''}
                  ${phone ? `<p style="color: #374151; margin: 4px 0;"><strong>Phone:</strong> <a href="tel:${phone}" style="color: #2563eb;">${phone}</a></p>` : ''}
                </div>
                <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                  <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Message</h3>
                  <p style="color: #374151; margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
                </div>
              </div>
              <div style="background-color: #F3F4F6; padding: 16px; border-radius: 0 0 8px 8px; border: 1px solid #E5E7EB; border-top: none;">
                <p style="color: #6B7280; font-size: 12px; margin: 0; text-align: center;">
                  This email was automatically generated from the PypeFlow public contact form.
                </p>
              </div>
            </div>
          `,
        }),
      })

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text()
        console.error('Resend API error (public-contact):', errorData)
        // Do NOT throw here – we still want to return success to the user
      }
    } else {
      // Fallback: Log to console (for development)
      console.log('=== PUBLIC CONTACT FORM SUBMISSION ===')
      console.log('To:', TO_EMAIL)
      console.log('Subject:', emailSubject)
      console.log('Body:', emailBody)
      console.log('=====================================')
      
      console.warn('RESEND_API_KEY not set. Email not sent. Please configure Resend API key in Supabase Edge Function secrets.')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Contact form submitted successfully' }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error: any) {
    console.error('Public contact error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to submit contact form' }),
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

