import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the start of today in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    console.log(`Starting cleanup of completed tasks. Today starts at: ${todayStr}`);

    // Get all completed tasks that were CREATED before today (regardless of when completed)
    const { data: completedTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, user_id, title, created_at, updated_at')
      .eq('completed', true)
      .lt('created_at', todayStr);

    if (fetchError) {
      console.error('Error fetching completed tasks:', fetchError);
      throw fetchError;
    }

    if (!completedTasks || completedTasks.length === 0) {
      console.log("No completed tasks from previous days to delete");
      return new Response(
        JSON.stringify({ success: true, deletedCount: 0, message: "No old completed tasks to delete" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${completedTasks.length} completed tasks from previous days to delete:`, completedTasks.map(t => t.title));

    // Delete completed tasks that were created before today
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('completed', true)
      .lt('created_at', todayStr);

    if (deleteError) {
      console.error('Error deleting completed tasks:', deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted ${completedTasks.length} completed tasks`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount: completedTasks.length,
        message: `Deleted ${completedTasks.length} completed tasks from previous days`
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
