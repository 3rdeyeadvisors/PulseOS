import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const sanitizeString = (str: string, maxLength: number = 100): string => {
  return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { inviterName, inviterEmail, inviteeEmail } = body as InviteEmailRequest;

    if (!inviterName || !inviterEmail || !inviteeEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!isValidEmail(inviteeEmail) || !isValidEmail(inviterEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const sanitizedInviterName = sanitizeString(inviterName, 100);

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.3");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { error } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'app-invite',
        recipientEmail: inviteeEmail,
        idempotencyKey: `invite-${inviteeEmail}-${Date.now()}`,
        templateData: { inviterName: sanitizedInviterName },
      },
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
