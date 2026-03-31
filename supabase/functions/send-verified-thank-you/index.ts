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
    let targetUserId: string | null = null;
    try {
      const body = await req.json();
      targetUserId = body.userId || null;
    } catch { /* no body */ }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let query = supabase.from("profiles").select("user_id, email, full_name, username").eq("verified", true).not("email", "is", null);
    if (targetUserId) query = query.eq("user_id", targetUserId);

    const { data: verifiedUsers, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    const results: { email: string; status: string; error?: string }[] = [];

    for (const user of verifiedUsers || []) {
      if (!user.email) continue;
      const displayName = user.full_name || user.username || "Pulse User";

      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'verified-thank-you',
            recipientEmail: user.email,
            idempotencyKey: `verified-ty-${user.user_id}`,
            templateData: { name: displayName },
          },
        });

        await supabase.from("email_logs").insert({
          user_id: user.user_id,
          email_type: "verified_thank_you",
          subject: "You're Verified! Grandfathered for Life",
          status: "sent",
        });
        results.push({ email: user.email, status: "sent" });
      } catch (emailError: unknown) {
        await supabase.from("email_logs").insert({
          user_id: user.user_id,
          email_type: "verified_thank_you",
          subject: "You're Verified! Grandfathered for Life",
          status: "failed",
          error_message: emailError instanceof Error ? emailError.message : String(emailError),
        });
        results.push({ email: user.email, status: "failed", error: emailError instanceof Error ? emailError.message : String(emailError) });
      }
    }

    const successCount = results.filter(r => r.status === "sent").length;
    return new Response(
      JSON.stringify({ success: true, message: `Sent ${successCount} emails`, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-verified-thank-you:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
