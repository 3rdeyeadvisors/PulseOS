import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting overdue task reminder check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find tasks that:
    // 1. Are not completed
    // 2. Were created before midnight yesterday (at least 1 day old)
    // 3. Haven't had a reminder sent yet today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const { data: overdueTasks, error: tasksError } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        user_id,
        created_at,
        due_date
      `)
      .eq("completed", false)
      .lt("created_at", yesterday.toISOString());

    if (tasksError) {
      console.error("Error fetching overdue tasks:", tasksError);
      throw tasksError;
    }

    console.log(`Found ${overdueTasks?.length || 0} overdue tasks`);

    if (!overdueTasks || overdueTasks.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No overdue tasks found", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Group tasks by user
    const tasksByUser: Record<string, typeof overdueTasks> = {};
    for (const task of overdueTasks) {
      if (!tasksByUser[task.user_id]) {
        tasksByUser[task.user_id] = [];
      }
      tasksByUser[task.user_id].push(task);
    }

    let emailsSent = 0;

    for (const [userId, tasks] of Object.entries(tasksByUser)) {
      // Check if we already sent an overdue reminder today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: existingLog } = await supabase
        .from("email_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("email_type", "overdue_task_reminder")
        .gte("sent_at", today.toISOString())
        .limit(1);

      if (existingLog && existingLog.length > 0) {
        console.log(`Already sent overdue reminder to user ${userId} today, skipping`);
        continue;
      }

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

      if (!profile?.email || !emailPrefs?.task_reminders) {
        console.log(`User ${userId} has no email or task reminders disabled`);
        continue;
      }

      const displayName = profile.full_name || profile.email.split("@")[0];
      const taskCount = tasks.length;

      // Build task list HTML
      const taskListHtml = tasks.slice(0, 5).map(task => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #334155;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 20px; height: 20px; border: 2px solid #ef4444; border-radius: 4px; flex-shrink: 0;"></div>
              <div>
                <p style="margin: 0; color: #f1f5f9; font-size: 15px; font-weight: 500;">${task.title}</p>
                ${task.due_date ? `<p style="margin: 4px 0 0; color: #fca5a5; font-size: 13px;">Due: ${new Date(task.due_date).toLocaleDateString()}</p>` : ''}
              </div>
            </div>
          </td>
        </tr>
      `).join("");

      const moreTasksHtml = taskCount > 5 
        ? `<p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 16px 0 0;">...and ${taskCount - 5} more task${taskCount - 5 > 1 ? 's' : ''}</p>` 
        : '';

      try {
        await resend.emails.send({
          from: "PulseOS <support@notifications.pulseos.tech>",
          to: [profile.email],
          subject: `📋 Your incomplete tasks from yesterday (${taskCount})`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
              <div style="display: inline-block; padding: 16px; background: rgba(255, 255, 255, 0.15); border-radius: 16px; margin-bottom: 16px;">
                <span style="font-size: 48px;">⏰</span>
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff;">
                Your Tasks From Yesterday
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px 40px;">
              <p style="color: #f1f5f9; font-size: 18px; line-height: 1.6; margin: 0 0 16px;">
                Hey ${displayName}! 👋
              </p>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                You have <strong style="color: #fca5a5;">${taskCount} task${taskCount > 1 ? 's' : ''}</strong> from yesterday that still need${taskCount > 1 ? '' : 's'} your attention:
              </p>
              
              <!-- Task List -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                ${taskListHtml}
              </table>
              ${moreTasksHtml}
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://pulseos.tech/app" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                      Complete Your Tasks →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 24px 0 0;">
                Small steps lead to big progress. Let's get these done! 💪
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; border-top: 1px solid #334155; background-color: #0f172a;">
              <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
                You're receiving this because you have task reminders enabled.<br>
                <a href="https://pulseos.tech/app/settings" style="color: #3b82f6; text-decoration: underline;">Manage email preferences</a>
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
          email_type: "overdue_task_reminder",
          subject: `Your incomplete tasks from yesterday (${taskCount})`,
          status: "sent",
        });

        emailsSent++;
        console.log(`Overdue task reminder sent to user ${userId}`);
      } catch (emailError: any) {
        console.error(`Error sending email to user ${userId}:`, emailError);
        
        await supabase.from("email_logs").insert({
          user_id: userId,
          email_type: "overdue_task_reminder",
          subject: `You have ${taskCount} incomplete task${taskCount > 1 ? 's' : ''} waiting`,
          status: "failed",
          error_message: emailError.message,
        });
      }
    }

    console.log(`Overdue task reminder complete. Sent ${emailsSent} emails.`);

    return new Response(
      JSON.stringify({ success: true, sent: emailsSent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in overdue-task-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
