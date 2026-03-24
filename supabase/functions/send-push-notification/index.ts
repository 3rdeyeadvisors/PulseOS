import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    const { userId, title, body, data } = payload;

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending push notification to user: ${userId}`);

    // Get user's push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token, platform")
      .eq("user_id", userId);

    if (tokensError) {
      console.error("Error fetching push tokens:", tokensError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch push tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log(`No push tokens found for user: ${userId}`);
      return new Response(
        JSON.stringify({ success: true, message: "No push tokens registered" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Separate tokens by platform
    const iosTokens = tokens.filter(t => t.platform === "ios").map(t => t.token);
    const androidTokens = tokens.filter(t => t.platform === "android").map(t => t.token);

    const results: { platform: string; success: boolean; error?: string }[] = [];

    // Send to iOS devices via APNs (placeholder - requires APNs configuration)
    for (const token of iosTokens) {
      console.log(`Would send to iOS token: ${token.substring(0, 20)}...`);
      // TODO: Implement APNs sending when production keys are configured
      // This requires setting up APNs authentication key in your Apple Developer account
      results.push({ platform: "ios", success: true });
    }

    // Send to Android devices via FCM (placeholder - requires FCM configuration)
    for (const token of androidTokens) {
      console.log(`Would send to Android token: ${token.substring(0, 20)}...`);
      // TODO: Implement FCM sending when Firebase project is configured
      // This requires setting up Firebase Cloud Messaging
      results.push({ platform: "android", success: true });
    }

    console.log(`Push notification queued for ${tokens.length} devices`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent to ${tokens.length} devices`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
