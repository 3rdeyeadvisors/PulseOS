import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-INACTIVE] ${step}${detailsStr}`);
};

// Inactivity threshold: 1 year (365 days)
const INACTIVITY_DAYS = 365;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting inactive account cleanup");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_DAYS);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    logStep("Cutoff date for inactivity", { cutoffDate: cutoffDateStr, days: INACTIVITY_DAYS });

    // Find inactive free users:
    // 1. last_active_date is older than cutoff OR null (never active)
    // 2. created_at is older than cutoff (to not delete brand new accounts)
    // 3. NOT subscribed (status = 'inactive' or no subscription record)
    // 4. NOT grandfathered
    const { data: inactiveProfiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select(`
        user_id,
        email,
        last_active_date,
        created_at
      `)
      .or(`last_active_date.lt.${cutoffDateStr},last_active_date.is.null`)
      .lt("created_at", cutoffDate.toISOString());

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    logStep("Found potentially inactive profiles", { count: inactiveProfiles?.length ?? 0 });

    if (!inactiveProfiles || inactiveProfiles.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No inactive accounts found",
        deleted: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const deletedUsers: string[] = [];
    const skippedUsers: { userId: string; reason: string }[] = [];

    for (const profile of inactiveProfiles) {
      // Check subscription status
      const { data: subscription } = await supabaseAdmin
        .from("user_subscriptions")
        .select("status, is_grandfathered, trial_ends_at, subscription_ends_at")
        .eq("user_id", profile.user_id)
        .single();

      // Skip if grandfathered
      if (subscription?.is_grandfathered) {
        skippedUsers.push({ userId: profile.user_id, reason: "grandfathered" });
        continue;
      }

      // Skip if has active subscription
      if (subscription?.status === "active" || subscription?.status === "trialing") {
        skippedUsers.push({ userId: profile.user_id, reason: "active_subscription" });
        continue;
      }

      // Skip if subscription_ends_at is in the future (paid but subscription ended)
      if (subscription?.subscription_ends_at) {
        const subEndDate = new Date(subscription.subscription_ends_at);
        if (subEndDate > new Date()) {
          skippedUsers.push({ userId: profile.user_id, reason: "subscription_not_ended" });
          continue;
        }
      }

      // This user is inactive and free - delete their account
      logStep("Deleting inactive free account", { 
        userId: profile.user_id, 
        lastActive: profile.last_active_date,
        createdAt: profile.created_at
      });

      // Delete user from auth (this will cascade to all related tables due to foreign keys)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(profile.user_id);

      if (deleteError) {
        logStep("Error deleting user", { userId: profile.user_id, error: deleteError.message });
        skippedUsers.push({ userId: profile.user_id, reason: `delete_error: ${deleteError.message}` });
      } else {
        deletedUsers.push(profile.user_id);
        logStep("Successfully deleted user", { userId: profile.user_id });
      }
    }

    const summary = {
      success: true,
      deleted: deletedUsers.length,
      skipped: skippedUsers.length,
      deletedUserIds: deletedUsers,
      skippedDetails: skippedUsers,
      cutoffDate: cutoffDateStr,
      inactivityDays: INACTIVITY_DAYS
    };

    logStep("Cleanup completed", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
