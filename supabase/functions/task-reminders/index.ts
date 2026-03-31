import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

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

    if (notifError) throw notifError;

    if (sendEmail) {
      const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("user_id", userId).single();
      const { data: emailPrefs } = await supabase.from("email_preferences").select("task_reminders").eq("user_id", userId).single();

      if (profile?.email && emailPrefs?.task_reminders) {
        const displayName = profile.full_name || profile.email.split('@')[0];

        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'task-reminder',
            recipientEmail: profile.email,
            idempotencyKey: `task-reminder-${taskId}-${Date.now()}`,
            templateData: { name: displayName, taskTitle, dueDate },
          },
        });

        await supabase.from("email_logs").insert({
          user_id: userId,
          email_type: "task_reminder",
          subject: `Task Reminder: ${taskTitle}`,
          status: "sent",
        });
      }
    }

    return new Response(JSON.stringify({ success: true, data: notification }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in task-reminders:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
