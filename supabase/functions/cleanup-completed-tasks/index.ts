import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get the start of today in a specific timezone
function getStartOfDayInTimezone(timezone: string): Date {
  try {
    const now = new Date();
    // Format the date in the user's timezone to get local date parts
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '2025');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1;
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
    
    // Create a date string for midnight in that timezone
    const midnightLocal = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`);
    
    // Convert to UTC by calculating the offset
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const offset = utcDate.getTime() - tzDate.getTime();
    
    return new Date(midnightLocal.getTime() + offset);
  } catch (error) {
    console.error(`Invalid timezone ${timezone}, falling back to UTC:`, error);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  }
}

// Check if it's currently between midnight and 1am in a timezone
function isJustAfterMidnight(timezone: string): boolean {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(formatter.format(now));
    return hour === 0; // Only run during the midnight hour (0:00 - 0:59)
  } catch (error) {
    console.error(`Error checking time for timezone ${timezone}:`, error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if this is a forced cleanup (manual trigger)
    const url = new URL(req.url);
    const forceCleanup = url.searchParams.get('force') === 'true';
    
    console.log(`Starting cleanup. Force mode: ${forceCleanup}`);

    // Get all users with their timezones
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, timezone');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    let totalDeleted = 0;
    const processedUsers: string[] = [];

    for (const profile of profiles || []) {
      const timezone = profile.timezone || 'America/Chicago';
      
      // Only process users if it's just after midnight in their timezone (or forced)
      if (!forceCleanup && !isJustAfterMidnight(timezone)) {
        continue;
      }

      const startOfTodayUTC = getStartOfDayInTimezone(timezone);
      const startOfTodayStr = startOfTodayUTC.toISOString();
      
      console.log(`Processing user ${profile.user_id} (timezone: ${timezone}). Start of their today (UTC): ${startOfTodayStr}`);

      // Get ALL completed tasks - they should be cleared at midnight
      const { data: tasksToDelete, error: fetchError } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', profile.user_id)
        .eq('completed', true);

      if (fetchError) {
        console.error(`Error fetching tasks for user ${profile.user_id}:`, fetchError);
        continue;
      }

      if (tasksToDelete && tasksToDelete.length > 0) {
        console.log(`Found ${tasksToDelete.length} completed tasks to delete for user ${profile.user_id}`);
        
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('user_id', profile.user_id)
          .eq('completed', true);

        if (deleteError) {
          console.error(`Error deleting tasks for user ${profile.user_id}:`, deleteError);
          continue;
        }

        totalDeleted += tasksToDelete.length;
        processedUsers.push(profile.user_id);
      }
    }

    console.log(`Cleanup complete. Deleted ${totalDeleted} tasks for ${processedUsers.length} users`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount: totalDeleted,
        usersProcessed: processedUsers.length,
        message: `Deleted ${totalDeleted} completed tasks for ${processedUsers.length} users`
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in cleanup-completed-tasks function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
