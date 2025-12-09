import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DigestEmailRequest {
  userId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId }: DigestEmailRequest = await req.json();
    
    console.log(`Preparing daily digest for user ${userId}`);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, city')
      .eq('user_id', userId)
      .single();

    if (!profile?.email) {
      throw new Error('User email not found');
    }

    // Check email preferences
    const { data: emailPrefs } = await supabase
      .from('email_preferences')
      .select('daily_digest')
      .eq('user_id', userId)
      .single();

    if (!emailPrefs?.daily_digest) {
      console.log('Daily digest disabled for user');
      return new Response(JSON.stringify({ skipped: true, reason: 'Daily digest disabled' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get yesterday's action score
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: yesterdayScore } = await supabase
      .from('daily_action_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('score_date', yesterdayStr)
      .maybeSingle();

    // Get pending tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, due_date, completed')
      .eq('user_id', userId)
      .eq('completed', false)
      .limit(5);

    const displayName = profile.full_name || profile.email.split('@')[0];
    const score = yesterdayScore?.daily_score || 0;
    const tasksCompleted = yesterdayScore?.tasks_completed || 0;
    const tasksTotal = yesterdayScore?.tasks_total || 0;

    // Generate score message
    let scoreMessage = "";
    let scoreEmoji = "📊";
    if (score >= 80) {
      scoreMessage = "Amazing work yesterday! You crushed it!";
      scoreEmoji = "🔥";
    } else if (score >= 50) {
      scoreMessage = "Good progress yesterday! Keep the momentum going.";
      scoreEmoji = "💪";
    } else if (score >= 20) {
      scoreMessage = "You made some progress yesterday. Today's a new opportunity!";
      scoreEmoji = "✨";
    } else {
      scoreMessage = "Yesterday was quiet. Let's make today count!";
      scoreEmoji = "🚀";
    }

    // Generate tasks HTML
    let tasksHtml = "";
    if (tasks && tasks.length > 0) {
      tasksHtml = tasks.map(task => `
        <tr>
          <td style="padding: 12px 16px; background-color: #f5f3ff; border-radius: 8px; margin-bottom: 8px;">
            <span style="color: #1e293b; font-size: 14px;">☐ ${task.title}</span>
            ${task.due_date ? `<span style="color: #64748b; font-size: 12px; margin-left: 8px;">Due: ${task.due_date}</span>` : ''}
          </td>
        </tr>
        <tr><td style="height: 8px;"></td></tr>
      `).join('');
    } else {
      tasksHtml = `
        <tr>
          <td style="padding: 16px; background-color: #f5f3ff; border-radius: 8px; text-align: center;">
            <span style="color: #64748b; font-size: 14px;">No pending tasks. Add some to boost your score!</span>
          </td>
        </tr>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "PulseOS <support@notifications.pulseos.tech>",
      to: [profile.email],
      subject: `${scoreEmoji} Your Daily Pulse - Score: ${score}/100`,
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
              <h1 style="margin: 20px 0 0; font-size: 24px; font-weight: 700; color: #ffffff;">
                Good morning, ${displayName}!
              </h1>
            </td>
          </tr>
          
          <!-- Action Score -->
          <tr>
            <td style="padding: 32px 40px;">
              <div style="padding: 28px; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 16px; border: 2px solid #ddd6fe; text-align: center;">
                <p style="color: #6d28d9; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Yesterday's Action Score</p>
                <p style="font-size: 56px; font-weight: 800; margin: 0; color: #6d28d9;">${score}</p>
                <p style="color: #64748b; font-size: 14px; margin: 8px 0 16px;">out of 100</p>
                <div style="background: #e2e8f0; border-radius: 8px; height: 10px; overflow: hidden; margin-bottom: 16px;">
                  <div style="background: linear-gradient(90deg, #8b5cf6, #6d28d9); height: 100%; width: ${score}%; border-radius: 8px;"></div>
                </div>
                <p style="color: #1e293b; font-size: 16px; margin: 0 0 8px;">${scoreMessage}</p>
                <p style="color: #64748b; font-size: 14px; margin: 0;">Tasks completed: ${tasksCompleted}/${tasksTotal}</p>
              </div>
            </td>
          </tr>
          
          <!-- Pending Tasks -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="color: #6d28d9; font-size: 14px; font-weight: 600; margin: 0 0 16px;">📋 Your Pending Tasks</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${tasksHtml}
              </table>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://pulseos.tech/app" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px;">
                      Start Today's Actions →
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
                You're receiving this daily digest because you opted in.<br>
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

    console.log("Daily digest sent successfully:", emailResponse);

    // Log the email
    await supabase.from("email_logs").insert({
      user_id: userId,
      email_type: "daily_digest",
      subject: `Your Daily Pulse - Score: ${score}/100`,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending daily digest:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
