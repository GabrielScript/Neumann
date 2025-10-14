import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-fastspring-signature',
};

interface FastSpringEvent {
  id: string;
  type: string;
  data: {
    subscription?: {
      id: string;
      state: string;
      customer: {
        email: string;
      };
    };
    order?: {
      id: string;
      customer: {
        email: string;
      };
      items: Array<{
        product: string;
        subscription: {
          id: string;
        };
      }>;
    };
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-fastspring-signature');
    const hmacSecret = Deno.env.get('FASTSPRING_HMAC_SECRET');
    
    // Validate HMAC signature
    if (signature && hmacSecret) {
      const body = await req.text();
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(hmacSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signatureBytes = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(body)
      );
      
      const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
      
      if (signature !== expectedSignature) {
        console.error('Invalid HMAC signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const event: FastSpringEvent = JSON.parse(body);
      console.log('FastSpring webhook event:', event.type);
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      // Handle subscription events
      if (event.type === 'subscription.activated' || event.type === 'order.completed') {
        const subscription = event.data.subscription || event.data.order?.items[0]?.subscription;
        const email = event.data.subscription?.customer.email || event.data.order?.customer.email;
        
        if (!subscription || !email) {
          console.error('Missing subscription or email data');
          return new Response(
            JSON.stringify({ error: 'Missing data' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Find user by email
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        const user = users?.find(u => u.email === email);
        
        if (!user) {
          console.error('User not found:', email);
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Determine tier based on product
        const productPath = event.data.order?.items[0]?.product || '';
        let tier: 'plus_monthly' | 'plus_annual' = 'plus_monthly';
        let expiresAt: string | null = null;
        
        if (productPath.includes('annual') || productPath.includes('anual')) {
          tier = 'plus_annual';
          const now = new Date();
          expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
        } else {
          const now = new Date();
          expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
        }
        
        // Update subscription
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            tier,
            status: 'active',
            stripe_subscription_id: subscription.id,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return new Response(
            JSON.stringify({ error: 'Database error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log('Subscription activated for user:', user.id);
      }
      
      // Handle subscription cancellation
      if (event.type === 'subscription.canceled' || event.type === 'subscription.deactivated') {
        const subscription = event.data.subscription;
        
        if (!subscription) {
          return new Response(
            JSON.stringify({ error: 'Missing subscription data' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            tier: 'free',
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        if (updateError) {
          console.error('Error canceling subscription:', updateError);
        }
        
        console.log('Subscription canceled:', subscription.id);
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Missing signature' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
