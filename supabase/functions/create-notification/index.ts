import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid notification types
const VALID_NOTIFICATION_TYPES = [
  "welcome",
  "daily_digest",
  "event_reminder",
  "task_reminder",
  "weather_alert",
  "new_recommendation",
  "system"
] as const;

type NotificationType = typeof VALID_NOTIFICATION_TYPES[number];

interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Sanitize string input
function sanitizeString(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate and sanitize userId
    const userId = String(body.userId || '');
    if (!isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ error: "Invalid user ID format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate notification type
    const type = String(body.type || '');
    if (!VALID_NOTIFICATION_TYPES.includes(type as NotificationType)) {
      return new Response(
        JSON.stringify({ error: "Invalid notification type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize and validate title
    const title = sanitizeString(body.title, 200);
    if (!title || title.length < 1) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize and validate message
    const message = sanitizeString(body.message, 1000);
    if (!message || message.length < 1) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate data object if provided
    let data: Record<string, unknown> | null = null;
    if (body.data !== undefined && body.data !== null) {
      if (typeof body.data !== 'object' || Array.isArray(body.data)) {
        return new Response(
          JSON.stringify({ error: "Data must be an object" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      // Limit data size
      const dataStr = JSON.stringify(body.data);
      if (dataStr.length > 10000) {
        return new Response(
          JSON.stringify({ error: "Data object too large" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      data = body.data;
    }

    console.log(`Creating ${type} notification for user`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user exists before creating notification
    const { data: userExists, error: userError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (userError || !userExists) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: type,
        title: title,
        message: message,
        data: data,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error.message);
      throw new Error("Failed to create notification");
    }

    console.log("Notification created successfully");

    return new Response(JSON.stringify({ success: true, data: notification }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in create-notification function");
    return new Response(
      JSON.stringify({ error: "Failed to create notification" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});