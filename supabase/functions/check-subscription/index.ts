import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check user_subscriptions table first
    const { data: subscriptionData } = await supabaseClient
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Check if user is grandfathered
    if (subscriptionData?.is_grandfathered) {
      logStep("User is grandfathered", { userId: user.id });
      return new Response(JSON.stringify({
        subscribed: true,
        is_grandfathered: true,
        status: "active",
        plan: "Lifetime (Grandfathered)",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check Stripe FIRST for active subscription (this takes priority over database trial)
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });

      // Check for active or trialing subscriptions in Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 10,
      });

      const activeSubscription = subscriptions.data.find(
        (sub: { status: string }) => sub.status === "active" || sub.status === "trialing"
      );

      if (activeSubscription) {
        const isStripeTrialing = activeSubscription.status === "trialing";
        const trialEnd = activeSubscription.trial_end 
          ? new Date(activeSubscription.trial_end * 1000).toISOString()
          : null;
        const subscriptionEnd = new Date(activeSubscription.current_period_end * 1000).toISOString();

        logStep("Active Stripe subscription found", { 
          subscriptionId: activeSubscription.id, 
          status: activeSubscription.status,
          isStripeTrialing,
        });

        // Update subscription record with Stripe data
        await supabaseClient
          .from("user_subscriptions")
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: activeSubscription.id,
            status: activeSubscription.status,
            trial_ends_at: trialEnd,
            subscription_ends_at: subscriptionEnd,
          }, { onConflict: "user_id" });

        return new Response(JSON.stringify({
          subscribed: true,
          is_grandfathered: false,
          status: activeSubscription.status,
          is_trialing: isStripeTrialing,
          trial_ends_at: trialEnd,
          subscription_ends_at: subscriptionEnd,
          has_stripe_subscription: true,
          plan: "Premium",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("No active Stripe subscription found for customer");
    } else {
      logStep("No Stripe customer found");
    }

    // Fall back to database-based trial (set on signup) if no Stripe subscription
    if (subscriptionData && subscriptionData.trial_ends_at && !subscriptionData.stripe_subscription_id) {
      const trialEndsAt = new Date(subscriptionData.trial_ends_at);
      const now = new Date();
      
      if (trialEndsAt > now) {
        logStep("User is in database trial", { 
          userId: user.id, 
          trialEndsAt: subscriptionData.trial_ends_at 
        });
        return new Response(JSON.stringify({
          subscribed: true,
          is_grandfathered: false,
          status: "trialing",
          is_trialing: true,
          trial_ends_at: subscriptionData.trial_ends_at,
          plan: "Premium (Trial)",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        logStep("Database trial has expired", { userId: user.id });
      }
    }

    // No active subscription found
    logStep("No active subscription found");
    
    // Update subscription record to inactive
    await supabaseClient
      .from("user_subscriptions")
      .upsert({
        user_id: user.id,
        status: "inactive",
      }, { onConflict: "user_id" });

    return new Response(JSON.stringify({
      subscribed: false,
      is_grandfathered: false,
      status: "inactive",
    }), {
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
