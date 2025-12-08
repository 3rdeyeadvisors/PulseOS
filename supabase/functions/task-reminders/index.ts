import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskReminderRequest {
  userId: string;
  taskId: string;
  taskTitle: string;
  dueDate?: string;
  sendEmail?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, taskId, taskTitle, dueDate, sendEmail = true }: TaskReminderRequest = await req.json();
    
    console.log(`Creating task reminder for user ${userId}, task: ${taskTitle}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create in-app notification
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: "task_reminder",
        title: "Task Reminder 📋",
        message: dueDate 
          ? `Don't forget: "${taskTitle}" is due ${dueDate}` 
          : `Reminder: "${taskTitle}" needs your attention`,
        data: { taskId, taskTitle, dueDate },
      })
      .select()
      .single();

    if (notifError) {
      console.error("Error creating task reminder notification:", notifError);
      throw notifError;
    }

    console.log("Task reminder notification created:", notification);

    // Send email if requested and user has email preferences enabled
    if (sendEmail) {
      // Get user's email and preferences
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", userId)
        .single();

      const { data: emailPrefs } = await supabase
        .from("email_preferences")
        .select("task_reminders")
        .eq("user_id", userId)
        .single();

      if (profile?.email && emailPrefs?.task_reminders) {
        const displayName = profile.full_name || profile.email.split('@')[0];

        await resend.emails.send({
          from: "PulseOS <onboarding@resend.dev>",
          to: [profile.email],
          subject: `Task Reminder: ${taskTitle}`,
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
                <span style="font-size: 32px;">📋</span>
              </div>
              <h1 style="color: #ffffff; margin: 20px 0 0; font-size: 24px; font-weight: 700;">
                Task Reminder
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <p style="color: #e2e8f0; font-size: 18px; line-height: 1.6; margin: 0 0 20px;">
                Hey ${displayName}! 👋
              </p>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Just a friendly reminder about your task:
              </p>
              <div style="padding: 20px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.2); margin-bottom: 20px;">
                <p style="color: #8b5cf6; font-size: 18px; font-weight: 600; margin: 0 0 8px;">${taskTitle}</p>
                ${dueDate ? `<p style="color: #94a3b8; font-size: 14px; margin: 0;">Due: ${dueDate}</p>` : ''}
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://pulse.lovable.app/app" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #8b5cf6, #d946ef); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px;">
                      View Your Tasks →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(139, 92, 246, 0.2);">
              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">
                You're receiving this because you have task reminders enabled.<br>
                <a href="#" style="color: #8b5cf6; text-decoration: none;">Manage email preferences</a>
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
        await supabase.from("email_logs").insert({
          user_id: userId,
          email_type: "task_reminder",
          subject: `Task Reminder: ${taskTitle}`,
          status: "sent",
        });

        console.log("Task reminder email sent successfully");
      }
    }

    return new Response(JSON.stringify({ success: true, data: notification }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in task-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
