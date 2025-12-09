import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  fullName?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, fullName }: WelcomeEmailRequest = await req.json();
    
    console.log(`Sending welcome email to ${email} for user ${userId}`);

    const displayName = fullName || email.split('@')[0];

    const emailResponse = await resend.emails.send({
      from: "PulseOS <support@notifications.pulseos.tech>",
      to: [email],
      subject: "Welcome to PulseOS - Your Personal Life Dashboard 🚀",
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
                <span style="font-size: 48px;">⚡</span>
              </div>
              <h1 style="margin: 20px 0 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                Welcome to PulseOS
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="color: #1e293b; font-size: 18px; line-height: 1.6; margin: 0 0 20px;">
                Hey ${displayName}! 👋
              </p>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Welcome to your personal life dashboard. PulseOS is designed to help you stay on top of everything that matters - from weather and news to events and daily recommendations.
              </p>
              
              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px; background-color: #f5f3ff; border-radius: 12px; border: 1px solid #ddd6fe;">
                    <p style="color: #6d28d9; font-size: 14px; font-weight: 600; margin: 0 0 8px;">🌤️ Weather & Location</p>
                    <p style="color: #475569; font-size: 14px; margin: 0;">Real-time weather updates for your area</p>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background-color: #f5f3ff; border-radius: 12px; border: 1px solid #ddd6fe;">
                    <p style="color: #6d28d9; font-size: 14px; font-weight: 600; margin: 0 0 8px;">📰 Personalized News</p>
                    <p style="color: #475569; font-size: 14px; margin: 0;">News curated based on your interests</p>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background-color: #f5f3ff; border-radius: 12px; border: 1px solid #ddd6fe;">
                    <p style="color: #6d28d9; font-size: 14px; font-weight: 600; margin: 0 0 8px;">🎉 Local Events</p>
                    <p style="color: #475569; font-size: 14px; margin: 0;">Discover events happening near you</p>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background-color: #f5f3ff; border-radius: 12px; border: 1px solid #ddd6fe;">
                    <p style="color: #6d28d9; font-size: 14px; font-weight: 600; margin: 0 0 8px;">🤖 AI Assistant</p>
                    <p style="color: #475569; font-size: 14px; margin: 0;">Chat with Pulse for personalized insights</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://pulseos.tech/app" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px;">
                      Open Your Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
              <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
                You're receiving this because you signed up for PulseOS.<br>
                <a href="https://pulseos.tech/app/settings" style="color: #6d28d9; text-decoration: underline;">Manage email preferences</a>
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

    console.log("Welcome email sent successfully:", emailResponse);

    // Log the email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("email_logs").insert({
      user_id: userId,
      email_type: "welcome",
      subject: "Welcome to PulseOS",
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
