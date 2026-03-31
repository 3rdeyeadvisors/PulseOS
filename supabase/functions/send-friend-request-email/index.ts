import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FriendRequestEmailRequest {
  receiverId: string;
  senderName: string;
  senderUsername?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { receiverId, senderName, senderUsername }: FriendRequestEmailRequest = await req.json();
    console.log(`Sending friend request email to user ${receiverId} from ${senderName}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const senderDisplay = senderUsername ? `${senderName} (@${senderUsername})` : senderName;

    const { error } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'friend-request',
        recipientEmail: profile.email,
        idempotencyKey: `friend-req-${receiverId}-${Date.now()}`,
        templateData: { name: displayName, senderName: senderDisplay },
      },
    });

    if (error) throw error;

    await supabase.from("email_logs").insert({
      user_id: receiverId,
      email_type: "friend_request",
      subject: `${senderName} wants to be your friend on PulseOS!`,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending friend request email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
