import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isEightAM(timezone: string | null): boolean {
  try {
    const tz = timezone || "America/New_York";
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false });
    return parseInt(formatter.format(now), 10) === 8;
  } catch {
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false });
    return parseInt(formatter.format(new Date()), 10) === 8;
  }
}

function getTodayStartInTimezone(timezone: string | null): string {
  const tz = timezone || "America/New_York";
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
    const dateStr = formatter.format(new Date());
    return new Date(`${dateStr}T00:00:00Z`).toISOString();
  } catch {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString();
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const { data: overdueTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, user_id, created_at, due_date")
      .eq("completed", false)
      .lt("created_at", yesterday.toISOString());

    if (tasksError) throw tasksError;
    if (!overdueTasks || overdueTasks.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const tasksByUser: Record<string, typeof overdueTasks> = {};
    for (const task of overdueTasks) {
      if (!tasksByUser[task.user_id]) tasksByUser[task.user_id] = [];
      tasksByUser[task.user_id].push(task);
    }

    let emailsSent = 0;

    for (const [userId, tasks] of Object.entries(tasksByUser)) {
      const { data: profile } = await supabase.from("profiles").select("email, full_name, timezone").eq("user_id", userId).single();
      if (!isEightAM(profile?.timezone)) continue;

      const todayStart = getTodayStartInTimezone(profile?.timezone);
      const { data: existingLog } = await supabase.from("email_logs").select("id").eq("user_id", userId).eq("email_type", "overdue_task_reminder").gte("sent_at", todayStart).limit(1);
      if (existingLog && existingLog.length > 0) continue;

      const { data: emailPrefs } = await supabase.from("email_preferences").select("task_reminders").eq("user_id", userId).single();
      if (!profile?.email || !emailPrefs?.task_reminders) continue;

      const displayName = profile.full_name || profile.email.split("@")[0];
      const taskCount = tasks.length;
      const taskList = tasks.slice(0, 5).map(t => ({ title: t.title, dueDate: t.due_date }));

      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'overdue-task-reminder',
            recipientEmail: profile.email,
            idempotencyKey: `overdue-${userId}-${new Date().toISOString().split('T')[0]}`,
            templateData: { name: displayName, taskCount, tasks: taskList },
          },
        });

        await supabase.from("email_logs").insert({
          user_id: userId,
          email_type: "overdue_task_reminder",
          subject: `Your incomplete tasks from yesterday (${taskCount})`,
          status: "sent",
        });
        emailsSent++;
      } catch (emailError: unknown) {
        await supabase.from("email_logs").insert({
          user_id: userId,
          email_type: "overdue_task_reminder",
          subject: `Overdue tasks (${taskCount})`,
          status: "failed",
          error_message: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }
    }

    return new Response(JSON.stringify({ success: true, sent: emailsSent }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in overdue-task-reminder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
