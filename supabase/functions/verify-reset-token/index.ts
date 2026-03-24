import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  code: string;
  new_password: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, new_password }: VerifyRequest = await req.json();
    
    console.log("Verifying reset code");

    if (!code || !new_password) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing code or password" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: "Password must be at least 6 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Normalize code: remove dashes and convert to uppercase
    const normalizedCode = code.replace(/-/g, '').toUpperCase();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Look up the token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', normalizedCode)
      .eq('used', false)
      .maybeSingle();

    if (tokenError) {
      console.error("Token lookup error:", tokenError);
      return new Response(
        JSON.stringify({ success: false, error: "An error occurred. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!tokenData) {
      console.error("Token not found or already used");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired code. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check expiration
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      console.error("Token has expired");
      await supabaseAdmin
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('id', tokenData.id);
      
      return new Response(
        JSON.stringify({ success: false, error: "Code has expired. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user email first
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      tokenData.user_id
    );

    if (userError || !userData.user?.email) {
      console.error("User lookup error:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Could not find user" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenData.user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark token as used
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenData.id);

    console.log("Password updated successfully for user:", tokenData.user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password updated successfully",
        email: userData.user.email 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in verify-reset-token function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
