import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  userId: string;
  email: string;
  type: "event_reminder" | "task_reminder" | "daily_digest";
  subject: string;
  title: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, type, subject, title, content, ctaText, ctaUrl }: NotificationEmailRequest = await req.json();
    
    console.log(`Sending ${type} email to ${email}`);

    const emailResponse = await resend.emails.send({
      from: "PulseOS <notifications@resend.dev>",
      to: [email],
      subject: subject,
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
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; border-bottom: 1px solid rgba(139, 92, 246, 0.2);">
              <div style="display: inline-flex; align-items: center; gap: 8px;">
                <span style="font-size: 24px;">⚡</span>
                <span style="color: #ffffff; font-size: 20px; font-weight: 700;">PulseOS</span>
              </div>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 20px; font-weight: 600;">
                ${title}
              </h1>
              <div style="color: #94a3b8; font-size: 16px; line-height: 1.7;">
                ${content}
              </div>
              
              ${ctaText && ctaUrl ? `
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td>
                    <a href="${ctaUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6, #d946ef); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 10px;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; border-top: 1px solid rgba(139, 92, 246, 0.2); background: rgba(0,0,0,0.2);">
              <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
                You're receiving this because you have notifications enabled.<br>
                <a href="https://pulse.lovable.app/app/settings" style="color: #8b5cf6; text-decoration: none;">Manage preferences</a>
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

    console.log("Notification email sent:", emailResponse);

    // Log the email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("email_logs").insert({
      user_id: userId,
      email_type: type,
      subject: subject,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
