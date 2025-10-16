import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AwardCommunityXPRequest {
  community_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
      throw new Error('Unauthorized');
    }

    const { community_id }: AwardCommunityXPRequest = await req.json();

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

    return new Response(
      JSON.stringify({
        success: true,
        xpAwarded: xpAmount,
        newLevel: stats?.level || 1,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`[${requestId}] ERROR:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
