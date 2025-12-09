import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FriendRequestEmailRequest {
  receiverId: string;
  senderName: string;
  senderUsername?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { receiverId, senderName, senderUsername }: FriendRequestEmailRequest = await req.json();
    
    console.log(`Sending friend request email to user ${receiverId} from ${senderName}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get receiver's profile and email preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", receiverId)
      .single();

    if (!profile?.email) {
      console.log("Receiver email not found");
      return new Response(JSON.stringify({ skipped: true, reason: "No email" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const displayName = profile.full_name || profile.email.split('@')[0];
    const senderDisplay = senderUsername ? `${senderName} (@${senderUsername})` : senderName;

    const emailResponse = await resend.emails.send({
      from: "PulseOS <support@notifications.pulseos.tech>",
      to: [profile.email],
      subject: `${senderName} wants to be your friend on PulseOS! 👋`,
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
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.3);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="display: inline-block; padding: 12px; background: rgba(34, 197, 94, 0.15); border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.4);">
                <span style="font-size: 32px;">👋</span>
              </div>
              <h1 style="margin: 20px 0 0; font-size: 28px; font-weight: 700;">
                <span style="color: #ffffff;">New Friend Request!</span>
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <p style="color: #e2e8f0; font-size: 18px; line-height: 1.7; margin: 0 0 24px;">
                Hey ${displayName}! 👋
              </p>
              
              <div style="padding: 20px; background: rgba(34, 197, 94, 0.1); border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.3); margin-bottom: 24px;">
                <p style="color: #22c55e; font-size: 16px; font-weight: 600; margin: 0 0 8px;">
                  ${senderDisplay}
                </p>
                <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                  wants to connect with you on PulseOS
                </p>
              </div>
              
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Once you accept, you can compete on weekly leaderboards, send activity invites, and see each other's progress!
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://pulseos.tech/friends" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px;">
                      View Friend Request →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; border-top: 1px solid rgba(139, 92, 246, 0.3); background: rgba(0,0,0,0.2);">
              <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
                You're receiving this because someone sent you a friend request.<br>
                <a href="https://pulseos.tech/app/settings" style="color: #8b5cf6; text-decoration: none;">Manage email preferences</a>
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

    console.log("Friend request email sent:", emailResponse);

    // Log the email
    await supabase.from("email_logs").insert({
      user_id: receiverId,
      email_type: "friend_request",
      subject: `${senderName} wants to be your friend on PulseOS!`,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending friend request email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
