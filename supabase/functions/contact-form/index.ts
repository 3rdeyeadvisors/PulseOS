import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// HTML encode to prevent XSS/injection
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

// Sanitize input - remove control characters and excessive whitespace
function sanitizeInput(input: string): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .trim();
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Extract and sanitize inputs
    const name = sanitizeInput(String(body.name || ''));
    const email = sanitizeInput(String(body.email || '').toLowerCase());
    const subject = sanitizeInput(String(body.subject || ''));
    const message = sanitizeInput(String(body.message || ''));

    // Server-side validation with strict rules
    if (!name || name.length < 2 || name.length > 100) {
      return new Response(
        JSON.stringify({ error: "Name must be between 2 and 100 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (!email || !isValidEmail(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (!subject || subject.length < 3 || subject.length > 200) {
      return new Response(
        JSON.stringify({ error: "Subject must be between 3 and 200 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (!message || message.length < 10 || message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Message must be between 10 and 5000 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // HTML-encode all user inputs before inserting into email templates
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    // Log without sensitive details
    console.log(`Contact form submission received`);

    // Send notification email to support
    await resend.emails.send({
      from: "PulseOS <support@notifications.pulseos.tech>",
      to: ["support@pulseos.tech"],
      subject: `[Contact Form] ${safeSubject}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e2e8f0;">
              <h1 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 700;">New Contact Form Submission</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <p style="color: #6d28d9; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">From</p>
                    <p style="color: #1e293b; font-size: 16px; margin: 0;">${safeName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <p style="color: #6d28d9; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">Email</p>
                    <p style="color: #1e293b; font-size: 16px; margin: 0;"><a href="mailto:${safeEmail}" style="color: #6d28d9;">${safeEmail}</a></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <p style="color: #6d28d9; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">Subject</p>
                    <p style="color: #1e293b; font-size: 16px; margin: 0;">${safeSubject}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="color: #6d28d9; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">Message</p>
                    <p style="color: #475569; font-size: 15px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    // Send confirmation email to user
    await resend.emails.send({
      from: "PulseOS <support@notifications.pulseos.tech>",
      to: [email], // Use original email for sending (not escaped)
      subject: "We received your message - PulseOS",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
              <div style="display: inline-block; padding: 16px; background: rgba(255, 255, 255, 0.2); border-radius: 16px;">
                <span style="font-size: 48px;">✉️</span>
              </div>
              <h1 style="margin: 20px 0 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                Message Received!
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px 40px;">
              <p style="color: #1e293b; font-size: 18px; line-height: 1.6; margin: 0 0 20px;">
                Hi ${safeName}!
              </p>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Thank you for reaching out to us. We've received your message and will get back to you as soon as possible, typically within 24-48 hours.
              </p>
              
              <div style="padding: 20px; background-color: #f5f3ff; border-radius: 12px; border: 2px solid #8b5cf6; margin-bottom: 24px;">
                <p style="color: #6d28d9; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Your message:</p>
                <p style="color: #475569; font-size: 14px; margin: 0; font-style: italic;">"${safeSubject}"</p>
              </div>
              
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
                Best regards,<br>
                The PulseOS Team
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
              <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
                This is an automated confirmation. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    console.log("Contact form emails sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in contact-form function");
    return new Response(
      JSON.stringify({ error: "Failed to send message. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
