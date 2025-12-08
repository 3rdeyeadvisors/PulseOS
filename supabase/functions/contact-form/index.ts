import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactFormRequest = await req.json();

    // Server-side validation
    if (!name || name.trim().length === 0 || name.length > 100) {
      throw new Error("Invalid name");
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      throw new Error("Invalid email");
    }
    if (!subject || subject.trim().length === 0 || subject.length > 200) {
      throw new Error("Invalid subject");
    }
    if (!message || message.trim().length === 0 || message.length > 5000) {
      throw new Error("Invalid message");
    }

    console.log(`Contact form submission from ${email}`);

    // Send notification email to support
    await resend.emails.send({
      from: "PulseOS Contact <onboarding@resend.dev>",
      to: ["support@notifications.pulseos.tech"],
      subject: `[Contact Form] ${subject}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f23;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f23; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.2);">
          <tr>
            <td style="padding: 30px 40px 20px; border-bottom: 1px solid rgba(139, 92, 246, 0.2);">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(139, 92, 246, 0.1);">
                    <p style="color: #8b5cf6; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">From</p>
                    <p style="color: #e2e8f0; font-size: 16px; margin: 0;">${name}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(139, 92, 246, 0.1);">
                    <p style="color: #8b5cf6; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Email</p>
                    <p style="color: #e2e8f0; font-size: 16px; margin: 0;"><a href="mailto:${email}" style="color: #8b5cf6;">${email}</a></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(139, 92, 246, 0.1);">
                    <p style="color: #8b5cf6; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Subject</p>
                    <p style="color: #e2e8f0; font-size: 16px; margin: 0;">${subject}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <p style="color: #8b5cf6; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Message</p>
                    <p style="color: #94a3b8; font-size: 15px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
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
      from: "PulseOS <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message - PulseOS",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f23;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f23; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.2);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="display: inline-block; padding: 12px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.3);">
                <span style="font-size: 32px;">✉️</span>
              </div>
              <h1 style="color: #ffffff; margin: 20px 0 0; font-size: 24px; font-weight: 700;">
                Message Received!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <p style="color: #e2e8f0; font-size: 18px; line-height: 1.6; margin: 0 0 20px;">
                Hi ${name}! 👋
              </p>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Thank you for reaching out to us. We've received your message and will get back to you as soon as possible, typically within 24-48 hours.
              </p>
              <div style="padding: 20px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.2); margin-bottom: 20px;">
                <p style="color: #8b5cf6; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Your message:</p>
                <p style="color: #94a3b8; font-size: 14px; margin: 0; font-style: italic;">"${subject}"</p>
              </div>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
                Best regards,<br>
                The PulseOS Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px 40px; border-top: 1px solid rgba(139, 92, 246, 0.2);">
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
  } catch (error: any) {
    console.error("Error in contact-form:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
