import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { getAllHeaders, checkRateLimit, logSecurityEvent, getIpAddress } from '../_shared/security.ts';

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = getAllHeaders(origin);
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers.get('user-agent');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");
    
    const token = authHeader.replace("Bearer ", "");
    logStep("Extracted token from header");
    
    // Use service role client and pass token explicitly
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      await logSecurityEvent(supabaseClient, null, 'check_subscription_failed', 'subscription', null, ipAddress, userAgent, 'blocked', { reason: 'invalid_auth' });
      throw new Error(`Authentication error: ${userError.message}`);
    }
    if (!user?.email) throw new Error("User not authenticated or email not available");
    const user = userData.user;
    // Log without exposing PII
    logStep("User authenticated");

    // Rate limiting: 10 requests per minute
    const rateLimitCheck = await checkRateLimit(supabaseClient, user.id, ipAddress, 'check-subscription', 10, 1);
    if (!rateLimitCheck.allowed) {
      await logSecurityEvent(supabaseClient, user.id, 'rate_limit_exceeded', 'subscription', null, ipAddress, userAgent, 'blocked');
      return new Response(
        JSON.stringify({ error: rateLimitCheck.error }),
        { headers, status: 429 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning free tier");
      
      // Update user subscription to free tier
      await supabaseClient
        .from('user_subscriptions')
        .update({ 
          tier: 'free', 
          status: 'active',
          stripe_customer_id: null,
          stripe_subscription_id: null
        })
        .eq('user_id', user.id);
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        tier: 'free' 
      }), { headers, status: 200 });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer");

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let tier = 'free';
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      
      // Validar e converter o timestamp do Stripe com segurança
      try {
        const periodEnd = subscription.current_period_end;
        logStep("Raw period_end from Stripe", { periodEnd, type: typeof periodEnd });
        
        if (periodEnd && typeof periodEnd === 'number') {
          const date = new Date(periodEnd * 1000);
          if (!isNaN(date.getTime())) {
            subscriptionEnd = date.toISOString();
          } else {
            logStep("Invalid date after conversion", { periodEnd });
            subscriptionEnd = null;
          }
        } else {
          logStep("Invalid period_end format", { periodEnd });
          subscriptionEnd = null;
        }
      } catch (dateError) {
        logStep("Error converting date", { error: dateError instanceof Error ? dateError.message : String(dateError) });
        subscriptionEnd = null;
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      productId = subscription.items.data[0].price.product as string;
      const priceId = subscription.items.data[0].price.id;
      logStep("Subscription details retrieved");

      // Map product to tier based on price ID
      if (priceId === 'price_1QkxdMAi9dCfWAipC3MaIc6a' || priceId === 'price_1SIBXMPzwST7RaKh5ePjbrBw') {
        tier = 'plus_monthly';
      } else if (priceId === 'price_1QkxdpAi9dCfWAipYWnNHGhf') {
        tier = 'plus_annual';
      }
      
      logStep("Determined subscription tier", { tier });

      // Update user subscription in database
      await supabaseClient
        .from('user_subscriptions')
        .update({ 
          tier, 
          status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscriptionId,
          expires_at: subscriptionEnd
        })
        .eq('user_id', user.id);
      
      logStep("Database updated with subscription info");
    } else {
      logStep("No active subscription found, updating to free tier");
      
      await supabaseClient
        .from('user_subscriptions')
        .update({ 
          tier: 'free', 
          status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: null
        })
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
