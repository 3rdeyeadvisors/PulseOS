import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

function sanitizeInput(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const name = sanitizeInput(String(body.name || ''));
    const email = sanitizeInput(String(body.email || '').toLowerCase());
    const subject = sanitizeInput(String(body.subject || ''));
    const message = sanitizeInput(String(body.message || ''));

    if (!name || name.length < 2 || name.length > 100) {
      return new Response(JSON.stringify({ error: "Name must be between 2 and 100 characters" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!email || !isValidEmail(email) || email.length > 255) {
      return new Response(JSON.stringify({ error: "Please provide a valid email address" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!subject || subject.length < 3 || subject.length > 200) {
      return new Response(JSON.stringify({ error: "Subject must be between 3 and 200 characters" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!message || message.length < 10 || message.length > 5000) {
      return new Response(JSON.stringify({ error: "Message must be between 10 and 5000 characters" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const idKey = crypto.randomUUID();

    // Send notification to support
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'contact-form-notification',
        recipientEmail: 'support@pulseos.tech',
        idempotencyKey: `contact-notif-${idKey}`,
        templateData: { name, email, subject, message },
      },
    });

    // Send confirmation to user
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'contact-form-confirmation',
        recipientEmail: email,
        idempotencyKey: `contact-confirm-${idKey}`,
        templateData: { name, subject },
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in contact-form function");
    return new Response(
      JSON.stringify({ error: "Failed to send message. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
