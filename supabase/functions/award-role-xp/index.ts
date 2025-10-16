import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AwardRoleXPRequest {
  user_id: string;
  role: string;
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

    const { user_id, role, community_id }: AwardRoleXPRequest = await req.json();

    console.log(`[${requestId}] Processing role promotion - User: ${user_id}, Role: ${role}`);

    // Verify user is community leader or admin
    const { data: membership } = await supabaseAdmin
      .from('community_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('community_id', community_id)
      .single();

    if (!membership || membership.role !== 'challenger_leader') {
      throw new Error('Only leaders can promote members');
    }

    // Award XP based on role
    let xpAmount = 0;
    let reason = '';

    if (role === 'champion') {
      xpAmount = 100;
      reason = 'promoted_to_champion';
    } else if (role === 'challenger_leader') {
      xpAmount = 200;
      reason = 'promoted_to_leader';
    }

    if (xpAmount > 0) {
      console.log(`[${requestId}] Awarding ${xpAmount} XP for role promotion...`);

      await supabaseAdmin.rpc('award_xp', {
        _user_id: user_id,
        _amount: xpAmount,
        _reason: reason,
        _metadata: { community_id, role },
        _caller_function: 'award-role-xp'
      });

      // Get updated stats
      const { data: stats } = await supabaseAdmin
        .from('user_stats')
        .select('xp, level')
        .eq('user_id', user_id)
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
    }

    return new Response(
      JSON.stringify({ success: true, xpAwarded: 0 }),
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
