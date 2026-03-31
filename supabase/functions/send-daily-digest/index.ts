import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { userId }: DigestEmailRequest = await req.json();
    console.log(`Preparing daily digest for user ${userId}`);

    const { data: profile } = await supabase.from('profiles').select('email, full_name, city').eq('user_id', userId).single();
    if (!profile?.email) throw new Error('User email not found');

    const { data: emailPrefs } = await supabase.from('email_preferences').select('daily_digest').eq('user_id', userId).single();
    if (!emailPrefs?.daily_digest) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Daily digest disabled' }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: yesterdayScore } = await supabase.from('daily_action_scores').select('*').eq('user_id', userId).eq('score_date', yesterdayStr).maybeSingle();
    const { data: tasks } = await supabase.from('tasks').select('title, due_date, completed').eq('user_id', userId).eq('completed', false).limit(5);

    const displayName = profile.full_name || profile.email.split('@')[0];
    const score = yesterdayScore?.daily_score || 0;
    const tasksCompleted = yesterdayScore?.tasks_completed || 0;
    const tasksTotal = yesterdayScore?.tasks_total || 0;

    const pendingTasks = (tasks || []).map(t => ({ title: t.title, dueDate: t.due_date }));

    const { error } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'daily-digest',
        recipientEmail: profile.email,
        idempotencyKey: `daily-digest-${userId}-${yesterdayStr}`,
        templateData: { name: displayName, score, tasksCompleted, tasksTotal, pendingTasks },
      },
    });

    if (error) throw error;

    await supabase.from("email_logs").insert({
      user_id: userId,
      email_type: "daily_digest",
      subject: `Your Daily Pulse - Score: ${score}/100`,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending daily digest:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
