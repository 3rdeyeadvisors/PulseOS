import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviterName, inviterEmail, inviteeEmail }: InviteEmailRequest = await req.json();
    
    console.log(`Sending invite email to ${inviteeEmail} from ${inviterName}`);

    const emailResponse = await resend.emails.send({
      from: "PulseOS <support@notifications.pulseos.tech>",
      to: [inviteeEmail],
      subject: `${inviterName} invited you to join PulseOS! 🚀`,
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
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="display: inline-block; padding: 12px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.3);">
                <span style="font-size: 32px;">⚡</span>
              </div>
              <h1 style="margin: 20px 0 0; font-size: 28px; font-weight: 700;">
                <span style="color: #ffffff;">You're Invited to </span><span style="color: #a78bfa;">PulseOS</span>
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="color: #e2e8f0; font-size: 18px; line-height: 1.6; margin: 0 0 20px;">
                Hey there! 👋
              </p>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                <strong style="color: #a78bfa;">${inviterName}</strong> thinks you'd love PulseOS - your personal life dashboard that helps you stay on top of everything that matters.
              </p>
              
              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.2);">
                    <p style="color: #8b5cf6; font-size: 14px; font-weight: 600; margin: 0 0 8px;">🌤️ Weather & Location</p>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">Real-time weather updates for your area</p>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.2);">
                    <p style="color: #8b5cf6; font-size: 14px; font-weight: 600; margin: 0 0 8px;">👥 Connect with Friends</p>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">Stay connected and plan activities together</p>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.2);">
                    <p style="color: #8b5cf6; font-size: 14px; font-weight: 600; margin: 0 0 8px;">🤖 AI Assistant</p>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">Chat with Pulse for personalized insights</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://pulse.lovable.app/auth" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #8b5cf6, #d946ef); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px;">
                      Join PulseOS Now →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(139, 92, 246, 0.2);">
              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">
                You're receiving this because ${inviterName} (${inviterEmail}) invited you to PulseOS.
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

    console.log("Invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
