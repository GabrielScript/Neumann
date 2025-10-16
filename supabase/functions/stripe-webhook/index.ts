import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const logStep = (step: string, details?: any) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${requestId}] [STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    logStep("ERROR: Missing stripe-signature header");
    return new Response("Unauthorized: Missing signature", { status: 401 });
  }
  
  if (!webhookSecret) {
    logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured");
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    const body = await req.text();
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    logStep(`Webhook received: ${event.type}`, { eventId: event.id });

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer.id;
        
        // Map Stripe price ID to tiers
        const priceId = subscription.items.data[0].price.id;
        let tier: 'free' | 'plus_monthly' | 'plus_annual' = 'free';
        
        // Get actual price IDs from Stripe (these should match your Stripe dashboard)
        const { data: prices } = await stripe.prices.list({ limit: 100 });
        const monthlyPrice = prices.find((p: Stripe.Price) => p.recurring?.interval === 'month' && p.product === subscription.items.data[0].price.product);
        const annualPrice = prices.find((p: Stripe.Price) => p.recurring?.interval === 'year' && p.product === subscription.items.data[0].price.product);
        
        if (priceId === monthlyPrice?.id) tier = 'plus_monthly';
        if (priceId === annualPrice?.id) tier = 'plus_annual';

        logStep("Updating subscription", { customerId, tier, status: subscription.status });

        // Update subscription in database
        const { error } = await supabaseAdmin
          .from("user_subscriptions")
          .update({
            tier,
            status: subscription.status === 'active' ? 'active' : 'inactive',
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          logStep("ERROR updating subscription", { error: error.message });
          throw error;
        }
        
        logStep("Subscription updated successfully", { tier });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer.id;

        logStep("Subscription canceled", { customerId });

        // Downgrade to free tier
        const { error } = await supabaseAdmin
          .from("user_subscriptions")
          .update({
            tier: 'free',
            status: 'canceled',
            expires_at: null,
            updated_at: new Date().toISOString()
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          logStep("ERROR downgrading subscription", { error: error.message });
          throw error;
        }
        
        logStep("User downgraded to free tier");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' 
          ? invoice.customer 
          : invoice.customer?.id;
        
        logStep("Payment failed", { customerId, invoiceId: invoice.id });
        
        // Update subscription status to reflect payment issue
        if (customerId) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' 
          ? invoice.customer 
          : invoice.customer?.id;
        
        logStep("Payment succeeded", { customerId, invoiceId: invoice.id });
        
        // Ensure subscription is active
        if (customerId && invoice.subscription) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      default:
        logStep(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR processing webhook", { error: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
