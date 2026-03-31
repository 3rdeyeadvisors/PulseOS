import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const { data: users } = await supabase.from('profiles').select('user_id, email, full_name');
    const { data: emailPrefs } = await supabase.from('email_preferences').select('user_id, leaderboard_reminders');
    const emailPrefsMap = new Map(emailPrefs?.map(p => [p.user_id, p.leaderboard_reminders === true]) || []);
    const { data: weeklyScores } = await supabase.from('weekly_leaderboards').select('user_id, total_score').eq('week_start', weekStartStr);
    const scoresMap = new Map(weeklyScores?.map(s => [s.user_id, s.total_score]) || []);
    const { data: friendships } = await supabase.from('friendships').select('user_id, friend_id');
    const friendsMap = new Map<string, string[]>();
    friendships?.forEach(f => {
      if (!friendsMap.has(f.user_id)) friendsMap.set(f.user_id, []);
      friendsMap.get(f.user_id)!.push(f.friend_id);
    });
    const userInfoMap = new Map(users?.map(u => [u.user_id, { email: u.email, full_name: u.full_name }]) || []);

    let emailsSent = 0;

    for (const user of users || []) {
      if (!user.email || emailPrefsMap.get(user.user_id) !== true) continue;
      const userScore = scoresMap.get(user.user_id) || 0;
      const userFriends = friendsMap.get(user.user_id) || [];
      if (userFriends.length === 0) continue;

      const friendsAhead: { name: string; score: number }[] = [];
      for (const friendId of userFriends) {
        const friendScore = scoresMap.get(friendId) || 0;
        if (friendScore > userScore) {
          const info = userInfoMap.get(friendId);
          friendsAhead.push({ name: info?.full_name || 'A friend', score: friendScore });
        }
      }

      if (friendsAhead.length > 0) {
        friendsAhead.sort((a, b) => b.score - a.score);
        const topFriend = friendsAhead[0];
        const scoreDiff = topFriend.score - userScore;

        try {
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'leaderboard-reminder',
              recipientEmail: user.email,
              idempotencyKey: `leaderboard-${user.user_id}-${weekStartStr}`,
              templateData: {
                name: user.full_name || 'there',
                userScore,
                topFriendName: topFriend.name,
                topFriendScore: topFriend.score,
                scoreDiff,
                friendsAheadCount: friendsAhead.length,
              },
            },
          });

          await supabase.from('email_logs').insert({
            user_id: user.user_id,
            email_type: 'leaderboard_reminder',
            subject: `You're ${scoreDiff} points behind ${topFriend.name}!`,
            status: 'sent',
          });
          emailsSent++;
        } catch (emailError: unknown) {
          await supabase.from('email_logs').insert({
            user_id: user.user_id,
            email_type: 'leaderboard_reminder',
            subject: 'Leaderboard reminder',
            status: 'failed',
            error_message: emailError instanceof Error ? emailError.message : String(emailError),
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in leaderboard-reminder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
