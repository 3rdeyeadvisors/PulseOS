import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  userId: string;
  email: string;
  type: "event_reminder" | "task_reminder" | "daily_digest";
  subject: string;
  title: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, type, subject, title, content, ctaText, ctaUrl }: NotificationEmailRequest = await req.json();
    console.log(`Sending ${type} email to ${email}`);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { error } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'notification',
        recipientEmail: email,
        idempotencyKey: `notification-${userId}-${type}-${Date.now()}`,
        templateData: { title, content, ctaText, ctaUrl },
      },
    });

    if (error) throw error;

    await supabase.from("email_logs").insert({
      user_id: userId,
      email_type: type,
      subject,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
