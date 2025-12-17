import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  token_hash: string;
  new_password: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token_hash, new_password }: VerifyRequest = await req.json();
    
    console.log("Verifying reset token and updating password");

    if (!token_hash || !new_password) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing token or password" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create admin client
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

    // Verify the OTP token server-side
    const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token_hash,
      type: 'recovery',
    });

    if (verifyError) {
      console.error("Token verification error:", verifyError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Reset link is invalid or has expired. Please request a new one." 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!verifyData.user) {
      console.error("No user returned from verification");
      return new Response(
        JSON.stringify({ success: false, error: "Could not verify user" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update the user's password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      verifyData.user.id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Password updated successfully for user:", verifyData.user.id);

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-reset-token function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
