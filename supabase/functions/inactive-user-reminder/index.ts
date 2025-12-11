import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const appUrl = "https://pulselife.com";

    // Calculate date 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    // Get users who haven't been active for more than 2 days
    const { data: inactiveUsers, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, last_active_date')
      .lt('last_active_date', twoDaysAgoStr)
      .not('email', 'is', null);

    if (usersError) {
      console.error("Error fetching inactive users:", usersError);
      throw usersError;
    }

    if (!inactiveUsers || inactiveUsers.length === 0) {
      console.log("No inactive users found");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get email preferences to check if users want to receive emails
    const userIds = inactiveUsers.map(u => u.user_id);
    const { data: emailPrefs } = await supabase
      .from('email_preferences')
      .select('user_id, daily_digest')
      .in('user_id', userIds);

    const prefsMap = new Map(emailPrefs?.map(p => [p.user_id, p]) || []);

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of inactiveUsers) {
      const prefs = prefsMap.get(user.user_id);
      
      // Skip if user has opted out of emails
      if (prefs && !prefs.daily_digest) {
        continue;
      }

      const firstName = user.full_name?.split(' ')[0] || 'there';
      const daysSinceActive = Math.floor(
        (new Date().getTime() - new Date(user.last_active_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      try {
        await resend.emails.send({
          from: "Pulse <notifications@pulselife.com>",
          to: [user.email],
          subject: `We miss you, ${firstName}! 👋`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #1e293b; border-radius: 16px; overflow: hidden;">
                      
                      <!-- Header -->
                      <tr>
                        <td style="padding: 32px 32px 24px; text-align: center;">
                          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #f8fafc;">
                            Hey ${firstName}! 👋
                          </h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 0 32px 24px;">
                          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                            It's been ${daysSinceActive} days since we last saw you on Pulse. Your daily insights, personalized recommendations, and friends are waiting for you!
                          </p>
                          <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                            Don't let your streak slip away - come back and see what's new today.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Stats reminder -->
                      <tr>
                        <td style="padding: 0 32px 24px;">
                          <div style="background-color: #334155; border-radius: 12px; padding: 20px; text-align: center;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #e2e8f0;">Your streak needs attention!</p>
                            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #fbbf24;">🔥 Come back today</p>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- CTA Button -->
                      <tr>
                        <td style="padding: 0 32px 32px; text-align: center;">
                          <a href="${appUrl}/app" 
                             style="display: inline-block; padding: 16px 48px; background-color: #3b82f6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px;">
                            Open Your Dashboard
                          </a>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 24px 32px; background-color: #0f172a; border-top: 1px solid #475569;">
                          <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                            You're receiving this because you haven't visited Pulse recently.<br>
                            <a href="${appUrl}/app/settings" style="color: #93c5fd; text-decoration: underline;">Manage email preferences</a>
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

        // Log the email
        await supabase.from('email_logs').insert({
          user_id: user.user_id,
          email_type: 'inactive_reminder',
          subject: `We miss you, ${firstName}! 👋`,
          status: 'sent',
        });

        sentCount++;
        console.log(`Sent inactive reminder to ${user.email}`);
      } catch (emailError: any) {
        console.error(`Failed to send to ${user.email}:`, emailError);
        errors.push(`${user.email}: ${emailError.message}`);
        
        await supabase.from('email_logs').insert({
          user_id: user.user_id,
          email_type: 'inactive_reminder',
          subject: `We miss you, ${firstName}! 👋`,
          status: 'failed',
          error_message: emailError.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        total: inactiveUsers.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in inactive-user-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
