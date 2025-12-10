import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteAcceptedEmailRequest {
  senderId: string;
  accepterName: string;
  activityName: string;
  activityType: string;
  proposedTime: string;
}

const getActivityEmoji = (type: string): string => {
  const emojis: Record<string, string> = {
    restaurant: "🍽️",
    concert: "🎵",
    movie: "🎬",
    sports: "⚽",
    hiking: "🥾",
    coffee: "☕",
    drinks: "🍹",
    gaming: "🎮",
    fitness: "💪",
    event: "🎉",
    other: "🎉",
  };
  return emojis[type] || "🎉";
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { senderId, accepterName, activityName, activityType, proposedTime }: InviteAcceptedEmailRequest = await req.json();
    
    console.log(`Sending invite accepted email to user ${senderId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get sender's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", senderId)
      .single();

    if (!profile?.email) {
      console.log("Sender email not found");
      return new Response(JSON.stringify({ skipped: true, reason: "No email" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const displayName = profile.full_name || profile.email.split('@')[0];
    const emoji = getActivityEmoji(activityType);
    const formattedTime = new Date(proposedTime).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const emailResponse = await resend.emails.send({
      from: "PulseOS <support@notifications.pulseos.tech>",
      to: [profile.email],
      subject: `🎉 ${accepterName} accepted your invite to ${activityName}!`,
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
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
              <div style="display: inline-block; padding: 16px; background: rgba(255, 255, 255, 0.2); border-radius: 16px;">
                <span style="font-size: 48px;">🎉</span>
              </div>
              <h1 style="margin: 20px 0 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                It's On!
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px 40px;">
              <p style="color: #1e293b; font-size: 18px; line-height: 1.7; margin: 0 0 24px;">
                Great news, ${displayName}! 🎊
              </p>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                <strong style="color: #16a34a;">${accepterName}</strong> accepted your invite! Time to make plans!
              </p>
              
              <div style="padding: 24px; background-color: #f0fdf4; border-radius: 12px; border: 2px solid #22c55e; margin-bottom: 24px;">
                <p style="color: #16a34a; font-size: 20px; font-weight: 600; margin: 0 0 16px;">
                  ${emoji} ${activityName}
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #64748b; font-size: 14px;">📅 When:</span>
                      <span style="color: #1e293b; font-size: 14px; margin-left: 8px; font-weight: 500;">${formattedTime}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #64748b; font-size: 14px;">👥 With:</span>
                      <span style="color: #1e293b; font-size: 14px; margin-left: 8px; font-weight: 500;">${accepterName}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://pulseos.tech/app/friends" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px;">
                      View Upcoming Plans →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                Have a great time! 🙌
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
              <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
                You're receiving this because your activity invite was accepted.<br>
                <a href="https://pulseos.tech/app/settings" style="color: #16a34a; text-decoration: underline;">Manage email preferences</a>
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

    console.log("Invite accepted email sent:", emailResponse);

    // Log the email
    await supabase.from("email_logs").insert({
      user_id: senderId,
      email_type: "invite_accepted",
      subject: `${accepterName} accepted your invite to ${activityName}!`,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invite accepted email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});