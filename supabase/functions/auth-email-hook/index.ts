import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    console.log("Auth hook payload:", JSON.stringify(payload, null, 2));

    const { user, email_data } = payload;
    
    if (!user?.email || !email_data) {
      console.error("Missing user email or email_data");
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { token_hash, redirect_to, email_action_type } = email_data;
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    
    // Build the action link
    const actionLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    let subject = "";
    let emailHtml = "";

    switch (email_action_type) {
      case "recovery":
        subject = "Reset Your Password - PulseOS";
        emailHtml = generatePasswordResetEmail(user.email, actionLink);
        break;
      case "signup":
      case "email_confirmation":
        subject = "Confirm Your Email - PulseOS";
        emailHtml = generateConfirmationEmail(user.email, actionLink);
        break;
      case "magiclink":
        subject = "Your Magic Link - PulseOS";
        emailHtml = generateMagicLinkEmail(user.email, actionLink);
        break;
      case "email_change":
        subject = "Confirm Email Change - PulseOS";
        emailHtml = generateEmailChangeEmail(user.email, actionLink);
        break;
      default:
        console.log(`Unhandled email type: ${email_action_type}`);
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
    }

    const { error } = await resend.emails.send({
      from: "PulseOS <support@notifications.pulseos.tech>",
      to: [user.email],
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log(`Email sent successfully to ${user.email} for ${email_action_type}`);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Auth hook error:", errorMessage);
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: errorMessage,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

function generatePasswordResetEmail(email: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
              <div style="display: inline-block; padding: 16px; background: rgba(255, 255, 255, 0.2); border-radius: 16px;">
                <span style="font-size: 48px;">🔐</span>
              </div>
              <h1 style="margin: 20px 0 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                Reset Your Password
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px 40px;">
              <p style="color: #1e293b; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                We received a request to reset your password for your PulseOS account. Click the button below to create a new password.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
                This link will expire in 1 hour for security reasons.
              </p>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
              <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
                This is an automated message from PulseOS.<br>
                Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateConfirmationEmail(email: string, confirmLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
              <div style="display: inline-block; padding: 16px; background: rgba(255, 255, 255, 0.2); border-radius: 16px;">
                <span style="font-size: 48px;">✉️</span>
              </div>
              <h1 style="margin: 20px 0 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                Confirm Your Email
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px 40px;">
              <p style="color: #1e293b; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                Thanks for signing up for PulseOS! Please confirm your email address by clicking the button below.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${confirmLink}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px;">
                      Confirm Email →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
              <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
                This is an automated message from PulseOS.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateMagicLinkEmail(email: string, magicLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
              <div style="display: inline-block; padding: 16px; background: rgba(255, 255, 255, 0.2); border-radius: 16px;">
                <span style="font-size: 48px;">✨</span>
              </div>
              <h1 style="margin: 20px 0 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                Your Magic Link
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px 40px;">
              <p style="color: #1e293b; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                Click the button below to securely log in to your PulseOS account.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px;">
                      Log In →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                If you didn't request this link, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
              <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
                This is an automated message from PulseOS.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateEmailChangeEmail(email: string, confirmLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
              <div style="display: inline-block; padding: 16px; background: rgba(255, 255, 255, 0.2); border-radius: 16px;">
                <span style="font-size: 48px;">📧</span>
              </div>
              <h1 style="margin: 20px 0 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                Confirm Email Change
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px 40px;">
              <p style="color: #1e293b; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                You requested to change your email address. Please confirm this change by clicking the button below.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${confirmLink}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px;">
                      Confirm Change →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                If you didn't request this change, please secure your account immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
              <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
                This is an automated message from PulseOS.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
