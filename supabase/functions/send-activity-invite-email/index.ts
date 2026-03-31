import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivityInviteEmailRequest {
  receiverId: string;
  senderName: string;
  activityName: string;
  activityType: string;
  proposedTime: string;
  message?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { receiverId, senderName, activityName, activityType, proposedTime, message }: ActivityInviteEmailRequest = await req.json();
    console.log(`Sending activity invite email to user ${receiverId}`);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", receiverId)
      .single();

    if (!profile?.email) {
      return new Response(JSON.stringify({ skipped: true, reason: "No email" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const displayName = profile.full_name || profile.email.split('@')[0];

    const { error } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'activity-invite',
        recipientEmail: profile.email,
        idempotencyKey: `activity-invite-${receiverId}-${Date.now()}`,
        templateData: { name: displayName, senderName, activityName, activityType, proposedTime, message },
      },
    });

    if (error) throw error;

    await supabase.from("email_logs").insert({
      user_id: receiverId,
      email_type: "activity_invite",
      subject: `${senderName} invited you to ${activityName}!`,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending activity invite email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
