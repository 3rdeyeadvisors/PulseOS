import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const generateEmailHtml = (userName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Verified! 🎉</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0b;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.4);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 16px 24px; border-radius: 12px; margin-bottom: 20px;">
                <span style="font-size: 32px;">⚡</span>
                <span style="color: #ffffff; font-size: 28px; font-weight: 700; margin-left: 8px; vertical-align: middle;">PulseOS</span>
              </div>
            </td>
          </tr>
          
          <!-- Verified Badge -->
          <tr>
            <td style="padding: 0 40px 20px 40px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 12px 24px; border-radius: 50px; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);">
                <span style="color: #ffffff; font-size: 16px; font-weight: 600;">✓ Verified Member</span>
              </div>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; text-align: center; line-height: 1.3;">
                You're Officially Verified! 🎉
              </h1>
              
              <p style="color: #e2e8f0; font-size: 17px; line-height: 1.7; margin: 0 0 20px 0; text-align: center;">
                Hey ${userName || 'there'},
              </p>
              
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                We wanted to personally thank you for being one of our <strong style="color: #a5b4fc;">early adopters</strong>. Your support during these early days means everything to us.
              </p>
              
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                <strong style="color: #ffffff;">Big news:</strong> PulseOS is growing fast, and we'll soon be transitioning to a paid model to keep building amazing features.
              </p>
            </td>
          </tr>
          
          <!-- Highlight Box -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 24px; text-align: center;">
                <p style="color: #c4b5fd; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; font-weight: 600;">
                  Your Reward
                </p>
                <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 12px 0;">
                  🏆 Grandfathered for Life
                </h2>
                <p style="color: #a5b4fc; font-size: 15px; line-height: 1.6; margin: 0;">
                  As a founding member, you'll <strong style="color: #ffffff;">never pay</strong> for PulseOS. Your verified status and full access are locked in forever.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- What This Means -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <h3 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
                What you get forever:
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 15px;">
                    <span style="color: #22c55e; margin-right: 10px;">✓</span> Verified blue checkmark
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 15px;">
                    <span style="color: #22c55e; margin-right: 10px;">✓</span> Full access to all features
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 15px;">
                    <span style="color: #22c55e; margin-right: 10px;">✓</span> Priority support
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 15px;">
                    <span style="color: #22c55e; margin-right: 10px;">✓</span> Early access to new features
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 15px;">
                    <span style="color: #22c55e; margin-right: 10px;">✓</span> Founding member recognition
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="https://da82dfe4-27e3-438a-a7ae-849ba31da71a.lovableproject.com/app" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);">
                Open PulseOS →
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Thank you for believing in us from the start.<br>
                <strong style="color: #94a3b8;">— The PulseOS Team</strong>
              </p>
              <p style="color: #475569; font-size: 12px; margin: 16px 0 0 0; text-align: center;">
                © 2025 PulseOS. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting verified thank-you email send...");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all verified users with their emails
    const { data: verifiedUsers, error: fetchError } = await supabase
      .from("profiles")
      .select("user_id, email, full_name, username")
      .eq("verified", true)
      .not("email", "is", null);

    if (fetchError) {
      console.error("Error fetching verified users:", fetchError);
      throw new Error(`Failed to fetch verified users: ${fetchError.message}`);
    }

    console.log(`Found ${verifiedUsers?.length || 0} verified users to email`);

    const results: { email: string; status: string; error?: string }[] = [];

    // Send emails to each verified user
    for (const user of verifiedUsers || []) {
      if (!user.email) {
        console.log(`Skipping user ${user.user_id} - no email`);
        continue;
      }

      const displayName = user.full_name || user.username || "Pulse User";
      
      try {
        console.log(`Sending email to ${user.email}...`);
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "PulseOS <onboarding@resend.dev>",
            to: [user.email],
            subject: "🎉 You're Verified! Grandfathered for Life",
            html: generateEmailHtml(displayName),
          }),
        });

        const emailResult = await emailResponse.json();
        
        if (!emailResponse.ok) {
          throw new Error(emailResult.message || "Failed to send email");
        }

        console.log(`Email sent to ${user.email}:`, emailResult);
        
        // Log the email
        await supabase.from("email_logs").insert({
          user_id: user.user_id,
          email_type: "verified_thank_you",
          subject: "You're Verified! Grandfathered for Life",
          status: "sent",
        });

        results.push({ email: user.email, status: "sent" });
      } catch (emailError: any) {
        console.error(`Failed to send email to ${user.email}:`, emailError);
        
        // Log the failure
        await supabase.from("email_logs").insert({
          user_id: user.user_id,
          email_type: "verified_thank_you",
          subject: "You're Verified! Grandfathered for Life",
          status: "failed",
          error_message: emailError.message,
        });

        results.push({ email: user.email, status: "failed", error: emailError.message });
      }
    }

    const successCount = results.filter(r => r.status === "sent").length;
    const failCount = results.filter(r => r.status === "failed").length;

    console.log(`Email send complete. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successCount} emails, ${failCount} failed`,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verified-thank-you function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
