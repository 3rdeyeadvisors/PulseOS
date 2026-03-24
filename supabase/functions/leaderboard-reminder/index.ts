import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserScore {
  user_id: string;
  email: string;
  full_name: string;
  total_score: number;
}

interface FriendScore {
  friend_id: string;
  friend_name: string;
  total_score: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    console.log(`Checking leaderboard for week starting ${weekStartStr}`);

    // Get all users with their weekly scores and email preferences
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Get email preferences for all users - check leaderboard_reminders specifically
    const { data: emailPrefs, error: prefsError } = await supabase
      .from('email_preferences')
      .select('user_id, leaderboard_reminders');

    if (prefsError) {
      console.error('Error fetching email preferences:', prefsError);
      throw prefsError;
    }

    // Map user_id to whether they have leaderboard_reminders enabled (default false)
    const emailPrefsMap = new Map(emailPrefs?.map(p => [p.user_id, p.leaderboard_reminders === true]) || []);

    // Get all weekly scores
    const { data: weeklyScores, error: scoresError } = await supabase
      .from('weekly_leaderboards')
      .select('user_id, total_score')
      .eq('week_start', weekStartStr);

    if (scoresError) {
      console.error('Error fetching weekly scores:', scoresError);
      throw scoresError;
    }

    const scoresMap = new Map(weeklyScores?.map(s => [s.user_id, s.total_score]) || []);

    // Get all friendships
    const { data: friendships, error: friendsError } = await supabase
      .from('friendships')
      .select('user_id, friend_id');

    if (friendsError) {
      console.error('Error fetching friendships:', friendsError);
      throw friendsError;
    }

    // Build friendship map
    const friendsMap = new Map<string, string[]>();
    friendships?.forEach(f => {
      if (!friendsMap.has(f.user_id)) {
        friendsMap.set(f.user_id, []);
      }
      friendsMap.get(f.user_id)!.push(f.friend_id);
    });

    // Build user info map
    const userInfoMap = new Map(users?.map(u => [u.user_id, { email: u.email, full_name: u.full_name }]) || []);

    let emailsSent = 0;
    const errors: string[] = [];

    // Check each user
    for (const user of users || []) {
      // Skip if user has no email or has NOT explicitly enabled leaderboard reminders
      if (!user.email || emailPrefsMap.get(user.user_id) !== true) {
        console.log(`Skipping user ${user.user_id}: no email or leaderboard reminders disabled`);
        continue;
      }

      const userScore = scoresMap.get(user.user_id) || 0;
      const userFriends = friendsMap.get(user.user_id) || [];

      if (userFriends.length === 0) {
        console.log(`User ${user.user_id} has no friends, skipping`);
        continue;
      }

      // Find friends who are ahead
      const friendsAhead: FriendScore[] = [];
      for (const friendId of userFriends) {
        const friendScore = scoresMap.get(friendId) || 0;
        if (friendScore > userScore) {
          const friendInfo = userInfoMap.get(friendId);
          friendsAhead.push({
            friend_id: friendId,
            friend_name: friendInfo?.full_name || 'A friend',
            total_score: friendScore,
          });
        }
      }

      // If user is behind at least one friend, send reminder
      if (friendsAhead.length > 0) {
        // Sort by score descending
        friendsAhead.sort((a, b) => b.total_score - a.total_score);
        const topFriend = friendsAhead[0];
        const scoreDiff = topFriend.total_score - userScore;

        console.log(`User ${user.full_name} is behind ${friendsAhead.length} friends. Sending email...`);

        try {
          const emailResponse = await resend.emails.send({
            from: "PulseOS <support@notifications.pulseos.tech>",
            to: [user.email],
            subject: `📊 You're ${scoreDiff} points behind ${topFriend.friend_name}!`,
            html: `
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
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
              <div style="display: inline-block; padding: 16px; background: rgba(255, 255, 255, 0.2); border-radius: 16px;">
                <span style="font-size: 48px;">📊</span>
              </div>
              <h1 style="margin: 20px 0 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                Leaderboard Update
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px 40px;">
              <p style="color: #1e293b; font-size: 18px; line-height: 1.6; margin: 0 0 20px;">
                Hey ${user.full_name || 'there'}! 👋
              </p>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Your friend <strong style="color: #4f46e5;">${topFriend.friend_name}</strong> is currently ahead of you on this week's leaderboard!
              </p>
              
              <!-- Score Cards -->
              <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                <div style="flex: 1; padding: 20px; background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border-radius: 12px; border: 2px solid #c7d2fe; text-align: center;">
                  <p style="color: #6366f1; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Your Score</p>
                  <p style="font-size: 36px; font-weight: 800; margin: 0; color: #4f46e5;">${userScore}</p>
                  <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">points</p>
                </div>
              </div>
              
              <div style="padding: 20px; background-color: #fef2f2; border-radius: 12px; border: 2px solid #fecaca; margin-bottom: 24px;">
                <p style="color: #dc2626; font-size: 14px; font-weight: 600; margin: 0 0 8px;">🏆 ${topFriend.friend_name}'s Score</p>
                <p style="font-size: 28px; font-weight: 700; margin: 0; color: #b91c1c;">${topFriend.total_score} pts</p>
                <p style="margin: 8px 0 0; color: #dc2626; font-size: 14px;">
                  You're <strong>${scoreDiff} points</strong> behind!
                </p>
              </div>
              
              ${friendsAhead.length > 1 ? `
              <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">
                ${friendsAhead.length - 1} other friend${friendsAhead.length > 2 ? 's are' : ' is'} also ahead of you this week.
              </p>
              ` : ''}
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Complete tasks, try recommendations, and engage with friends to climb the leaderboard! 🚀
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://pulseos.tech/app/friends" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px;">
                      View Leaderboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
              <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
                You're receiving this because you have leaderboard reminders enabled.<br>
                <a href="https://pulseos.tech/app/settings" style="color: #6366f1; text-decoration: underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `,
          });

          console.log(`Email sent to ${user.email}:`, emailResponse);
          emailsSent++;

          // Log the email
          await supabase.from('email_logs').insert({
            user_id: user.user_id,
            email_type: 'leaderboard_reminder',
            subject: `You're ${scoreDiff} points behind ${topFriend.friend_name}!`,
            status: 'sent',
          });

        } catch (emailError: unknown) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
          errors.push(`${user.email}: ${emailError instanceof Error ? emailError.message : String(emailError)}`);
          
          // Log the failed email
          await supabase.from('email_logs').insert({
            user_id: user.user_id,
            email_type: 'leaderboard_reminder',
            subject: `Leaderboard reminder`,
            status: 'failed',
            error_message: emailError instanceof Error ? emailError.message : String(emailError),
          });
        }
      }
    }

    console.log(`Leaderboard reminder complete. Sent ${emailsSent} emails.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors: errors.length > 0 ? errors : undefined 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    console.error("Error in leaderboard-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
