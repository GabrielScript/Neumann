import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getAllHeaders, checkRateLimit, logSecurityEvent, getIpAddress, isValidUUID } from '../_shared/security.ts';

interface AwardCommunityXPRequest {
  community_id: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = getAllHeaders(origin);
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers.get('user-agent');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  const requestId = crypto.randomUUID();

  try {
    // Admin client for secure database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      await logSecurityEvent(supabaseAdmin, null, 'community_xp_attempt', 'community', null, ipAddress, userAgent, 'blocked', { reason: 'invalid_auth' });
      throw new Error('Unauthorized');
    }

    // Rate limiting: 20 requests per minute
    const rateLimitCheck = await checkRateLimit(supabaseAdmin, user.id, ipAddress, 'award-community-creation-xp', 20, 1);
    if (!rateLimitCheck.allowed) {
      await logSecurityEvent(supabaseAdmin, user.id, 'rate_limit_exceeded', 'community', null, ipAddress, userAgent, 'blocked');
      return new Response(
        JSON.stringify({ error: rateLimitCheck.error }),
        { headers, status: 429 }
      );
    }

    const { community_id }: AwardCommunityXPRequest = await req.json();

    // Validate UUID
    if (!isValidUUID(community_id)) {
      await logSecurityEvent(supabaseAdmin, user.id, 'invalid_input', 'community', community_id, ipAddress, userAgent, 'blocked', { reason: 'invalid_uuid' });
      throw new Error('Invalid community ID');
    }

    console.log(`[${requestId}] Processing community creation XP - User: ${user.id}, Community: ${community_id}`);

    // Verify community was created by this user
    const { data: community } = await supabaseAdmin
      .from('communities')
      .select('created_by')
      .eq('id', community_id)
      .single();

    if (!community || community.created_by !== user.id) {
      throw new Error('Community not found or not created by user');
    }

    const xpAmount = 300;
    const reason = 'community_created';

    console.log(`[${requestId}] Awarding ${xpAmount} XP for community creation...`);

    await supabaseAdmin.rpc('award_xp', {
      _user_id: user.id,
      _amount: xpAmount,
      _reason: reason,
      _metadata: { community_id },
      _caller_function: 'award-community-creation-xp'
    });

    // Get updated stats
    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('xp, level')
      .eq('user_id', user.id)
      .single();

    console.log(`[${requestId}] Success - Awarded ${xpAmount} XP`);

    await logSecurityEvent(supabaseAdmin, user.id, 'community_xp_awarded', 'community', community_id, ipAddress, userAgent, 'success', { xpAwarded: xpAmount });

    return new Response(
      JSON.stringify({
        success: true,
        xpAwarded: xpAmount,
        newLevel: stats?.level || 1,
      }),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error(`[${requestId}] ERROR:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers, status: 400 }
    );
  }
});
