import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-08-27.basil",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log(`[STRIPE-WEBHOOK] Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: subData } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!subData?.user_id) {
          console.log(`No user found for customer: ${customerId}`);
          break;
        }

        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        await supabase
          .from("user_subscriptions")
          .upsert({
            user_id: subData.user_id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            status: subscription.status,
            trial_ends_at: trialEnd,
            subscription_ends_at: periodEnd,
          }, { onConflict: "user_id" });

        console.log(`Updated subscription for user ${subData.user_id}: ${subscription.status}`);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: subData } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (subData?.user_id) {
          await supabase
            .from("user_subscriptions")
            .update({ status: "past_due" })
            .eq("user_id", subData.user_id);

          console.log(`Marked past_due for user ${subData.user_id}`);
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err: unknown) {
    console.error("Error processing webhook:", err);
    return new Response("Processing error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
