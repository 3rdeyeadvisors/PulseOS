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

    // Get email preferences for all users
    const { data: emailPrefs, error: prefsError } = await supabase
      .from('email_preferences')
      .select('user_id, daily_digest');

    if (prefsError) {
      console.error('Error fetching email preferences:', prefsError);
      throw prefsError;
    }

    const emailPrefsMap = new Map(emailPrefs?.map(p => [p.user_id, p.daily_digest]) || []);

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
      // Skip if user has no email or has disabled daily digest
      if (!user.email || emailPrefsMap.get(user.user_id) === false) {
        console.log(`Skipping user ${user.user_id}: no email or digest disabled`);
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
          // Get the app URL from environment or use default
          const appUrl = Deno.env.get('APP_URL') || 'https://pulselife.lovable.app';
          
          const emailResponse = await resend.emails.send({
            from: "Pulse <onboarding@resend.dev>",
            to: [user.email],
            subject: `📊 You're ${scoreDiff} points behind ${topFriend.friend_name}!`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
                <h1 style="color: #1a1a2e; margin-bottom: 20px;">Hey ${user.full_name || 'there'}! 👋</h1>
                
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">
                  Your friend <strong style="color: #1a1a2e;">${topFriend.friend_name}</strong> is currently ahead of you on this week's leaderboard!
                </p>
                
                <div style="background-color: #6366f1; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <p style="margin: 0 0 8px 0; color: #e0e0ff; font-size: 14px;">Your Score</p>
                  <p style="margin: 0; font-size: 36px; font-weight: bold; color: #ffffff;">${userScore} pts</p>
                </div>
                
                <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;">Top Friend</p>
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937;">
                    ${topFriend.friend_name}: ${topFriend.total_score} pts
                  </p>
                  <p style="margin: 8px 0 0 0; color: #dc2626; font-weight: 600; font-size: 14px;">
                    You're ${scoreDiff} points behind!
                  </p>
                </div>
                
                ${friendsAhead.length > 1 ? `
                <p style="color: #4b5563; font-size: 14px;">
                  ${friendsAhead.length - 1} other friend${friendsAhead.length > 2 ? 's are' : ' is'} also ahead of you this week.
                </p>
                ` : ''}
                
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">
                  Complete tasks, try recommendations, and engage with friends to climb the leaderboard! 🚀
                </p>
                
                <a href="${appUrl}/app/friends" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                  View Leaderboard
                </a>
                
                <p style="color: #6b7280; font-size: 12px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                  You're receiving this because you have daily digest emails enabled. 
                  <a href="${appUrl}/app/settings" style="color: #6366f1; text-decoration: underline;">Manage preferences</a>
                </p>
              </div>
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

        } catch (emailError: any) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
          errors.push(`${user.email}: ${emailError.message}`);
          
          // Log the failed email
          await supabase.from('email_logs').insert({
            user_id: user.user_id,
            email_type: 'leaderboard_reminder',
            subject: `Leaderboard reminder`,
            status: 'failed',
            error_message: emailError.message,
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

  } catch (error: any) {
    console.error("Error in leaderboard-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
