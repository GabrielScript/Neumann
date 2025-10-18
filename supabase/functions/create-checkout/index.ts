import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { getAllHeaders, checkRateLimit, logSecurityEvent, getIpAddress } from '../_shared/security.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = getAllHeaders(origin);
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers.get('user-agent');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // Client for authentication with user token
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Admin client for security operations
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) {
      await logSecurityEvent(supabaseAdmin, null, 'checkout_attempt', 'subscription', null, ipAddress, userAgent, 'blocked', { reason: 'invalid_auth' });
      throw new Error(`Authentication error: ${userError.message}`);
    }
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Rate limiting: 5 checkout attempts per minute
    const rateLimitCheck = await checkRateLimit(supabaseAdmin, user.id, ipAddress, 'create-checkout', 5, 1);
    if (!rateLimitCheck.allowed) {
      await logSecurityEvent(supabaseAdmin, user.id, 'rate_limit_exceeded', 'subscription', null, ipAddress, userAgent, 'blocked');
      return new Response(
        JSON.stringify({ error: rateLimitCheck.error }),
        { headers, status: 429 }
      );
    }

    const { priceId } = await req.json();
    if (!priceId) throw new Error("Price ID is required");

    // Log without sensitive user data
    console.log(`[CREATE-CHECKOUT] Creating session for price ${priceId}`);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log(`[CREATE-CHECKOUT] Found existing customer`);
    } else {
      console.log(`No existing customer found for ${user.email}`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscriptions?success=true`,
      cancel_url: `${req.headers.get("origin")}/subscriptions?canceled=true`,
    });

    console.log(`[CREATE-CHECKOUT] Session created successfully`);

    // Log successful checkout creation
    await logSecurityEvent(supabaseAdmin, user.id, 'checkout_created', 'subscription', null, ipAddress, userAgent, 'success', { priceId });

    return new Response(JSON.stringify({ url: session.url }), { headers, status: 200 });
  } catch (error) {
    console.error("Error in create-checkout:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), { headers, status: 500 });
  }
});
