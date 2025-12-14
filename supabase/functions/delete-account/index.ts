import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User client to get the authenticated user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client to delete user data and auth record
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get the authenticated user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Failed to get user:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Starting account deletion for user: ${userId}`);

    // Delete all user data in the correct order to avoid FK violations
    // Order matters due to foreign key relationships

    // 1. Delete activity_invites (sender_id, receiver_id reference profiles)
    const { error: activityInvitesError } = await adminClient
      .from('activity_invites')
      .delete()
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    if (activityInvitesError) console.error('Error deleting activity_invites:', activityInvitesError);
    else console.log('Deleted activity_invites');

    // 2. Delete task_invites (sender_id, receiver_id)
    const { error: taskInvitesError } = await adminClient
      .from('task_invites')
      .delete()
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    if (taskInvitesError) console.error('Error deleting task_invites:', taskInvitesError);
    else console.log('Deleted task_invites');

    // 3. Delete tasks
    const { error: tasksError } = await adminClient
      .from('tasks')
      .delete()
      .eq('user_id', userId);
    if (tasksError) console.error('Error deleting tasks:', tasksError);
    else console.log('Deleted tasks');

    // 4. Delete chat_messages
    const { error: chatMessagesError } = await adminClient
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);
    if (chatMessagesError) console.error('Error deleting chat_messages:', chatMessagesError);
    else console.log('Deleted chat_messages');

    // 5. Delete notifications
    const { error: notificationsError } = await adminClient
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    if (notificationsError) console.error('Error deleting notifications:', notificationsError);
    else console.log('Deleted notifications');

    // 6. Delete daily_action_scores
    const { error: scoresError } = await adminClient
      .from('daily_action_scores')
      .delete()
      .eq('user_id', userId);
    if (scoresError) console.error('Error deleting daily_action_scores:', scoresError);
    else console.log('Deleted daily_action_scores');

    // 7. Delete weekly_leaderboards
    const { error: leaderboardsError } = await adminClient
      .from('weekly_leaderboards')
      .delete()
      .eq('user_id', userId);
    if (leaderboardsError) console.error('Error deleting weekly_leaderboards:', leaderboardsError);
    else console.log('Deleted weekly_leaderboards');

    // 8. Delete friendships (both directions)
    const { error: friendshipsError } = await adminClient
      .from('friendships')
      .delete()
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
    if (friendshipsError) console.error('Error deleting friendships:', friendshipsError);
    else console.log('Deleted friendships');

    // 9. Delete friend_requests (both directions)
    const { error: friendRequestsError } = await adminClient
      .from('friend_requests')
      .delete()
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    if (friendRequestsError) console.error('Error deleting friend_requests:', friendRequestsError);
    else console.log('Deleted friend_requests');

    // 10. Delete email_logs
    const { error: emailLogsError } = await adminClient
      .from('email_logs')
      .delete()
      .eq('user_id', userId);
    if (emailLogsError) console.error('Error deleting email_logs:', emailLogsError);
    else console.log('Deleted email_logs');

    // 11. Delete email_preferences
    const { error: emailPrefsError } = await adminClient
      .from('email_preferences')
      .delete()
      .eq('user_id', userId);
    if (emailPrefsError) console.error('Error deleting email_preferences:', emailPrefsError);
    else console.log('Deleted email_preferences');

    // 12. Delete preferences
    const { error: preferencesError } = await adminClient
      .from('preferences')
      .delete()
      .eq('user_id', userId);
    if (preferencesError) console.error('Error deleting preferences:', preferencesError);
    else console.log('Deleted preferences');

    // 13. Delete user_roles
    const { error: rolesError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    if (rolesError) console.error('Error deleting user_roles:', rolesError);
    else console.log('Deleted user_roles');

    // 14. Delete avatar from storage
    try {
      const { data: files } = await adminClient.storage
        .from('avatars')
        .list(userId);
      
      if (files && files.length > 0) {
        const filePaths = files.map(f => `${userId}/${f.name}`);
        await adminClient.storage.from('avatars').remove(filePaths);
        console.log('Deleted avatar files');
      }
    } catch (storageError) {
      console.error('Error deleting storage files:', storageError);
      // Continue even if storage deletion fails
    }

    // 15. Delete profiles (last because it's referenced by other tables)
    const { error: profilesError } = await adminClient
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    if (profilesError) console.error('Error deleting profiles:', profilesError);
    else console.log('Deleted profiles');

    // 16. Delete the user from auth.users using admin API
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete authentication record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Account deletion completed for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error during account deletion:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
