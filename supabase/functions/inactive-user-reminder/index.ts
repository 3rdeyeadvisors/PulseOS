import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    const { data: inactiveUsers, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, last_active_date')
      .lt('last_active_date', twoDaysAgoStr)
      .not('email', 'is', null);

    if (usersError) throw usersError;
    if (!inactiveUsers || inactiveUsers.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = inactiveUsers.map(u => u.user_id);
    const { data: emailPrefs } = await supabase.from('email_preferences').select('user_id, daily_digest').in('user_id', userIds);
    const prefsMap = new Map(emailPrefs?.map(p => [p.user_id, p]) || []);

    let sentCount = 0;

    for (const user of inactiveUsers) {
      const prefs = prefsMap.get(user.user_id);
      if (prefs && !prefs.daily_digest) continue;

      const firstName = user.full_name?.split(' ')[0] || 'there';
      const daysSinceActive = Math.floor(
        (new Date().getTime() - new Date(user.last_active_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'inactive-reminder',
            recipientEmail: user.email,
            idempotencyKey: `inactive-${user.user_id}-${new Date().toISOString().split('T')[0]}`,
            templateData: { name: firstName, daysSinceActive },
          },
        });

        await supabase.from('email_logs').insert({
          user_id: user.user_id,
          email_type: 'inactive_reminder',
          subject: `We miss you, ${firstName}! 👋`,
          status: 'sent',
        });
        sentCount++;
      } catch (emailError: unknown) {
        await supabase.from('email_logs').insert({
          user_id: user.user_id,
          email_type: 'inactive_reminder',
          subject: `We miss you, ${firstName}! 👋`,
          status: 'failed',
          error_message: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, total: inactiveUsers.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in inactive-user-reminder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
