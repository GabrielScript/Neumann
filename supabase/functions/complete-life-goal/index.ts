import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteGoalRequest {
  goal_id: string;
}

// Removed local XP calculation - now handled by award_xp RPC

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
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

    const { goal_id }: CompleteGoalRequest = await req.json();

    console.log(`[${requestId}] Life goal completion started`);

    // 1. Verify goal ownership and not already completed
    const { data: goal, error: goalError } = await supabaseAdmin
      .from('life_goals')
      .select('*')
      .eq('id', goal_id)
      .eq('user_id', user.id)
      .single();

    if (goalError || !goal) {
      throw new Error('Life goal not found or unauthorized');
    }

    if (goal.is_completed) {
      throw new Error('Goal already completed');
    }

    console.log(`[${requestId}] Goal ownership verified`);

    // 1b. Rate limit goal completions (max 5 per hour)
    const { data: recentGoals } = await supabaseAdmin
      .from('life_goals')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .gte('completed_at', new Date(Date.now() - 3600000).toISOString())
      .limit(10);

    if (recentGoals && recentGoals.length >= 5) {
      throw new Error('Life goal completion rate limit: max 5 per hour');
    }

    // 2. Mark goal as completed
    const { error: updateGoalError } = await supabaseAdmin
      .from('life_goals')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', goal_id);

    if (updateGoalError) throw updateGoalError;

    // 3. Get current stats (for level comparison)
    const { data: statsBefore, error: statsError } = await supabaseAdmin
      .from('user_stats')
      .select('level, life_goal_trophies')
      .eq('user_id', user.id)
      .single();

    if (statsError) throw statsError;

    const oldLevel = statsBefore.level;

    // 4. Award 500 XP via secure award_xp RPC
    const xpAmount = 500;
    console.log(`[${requestId}] Awarding ${xpAmount} XP via award_xp RPC`);

    const { error: xpError } = await supabaseAdmin.rpc('award_xp', {
      _user_id: user.id,
      _amount: xpAmount,
      _reason: 'life_goal_completed',
      _metadata: { 
        goal_id, 
        goal_title: goal.title,
        awarded_trophy: true,
        request_id: requestId
      },
      _caller_function: 'complete-life-goal'
    });

    if (xpError) {
      // Check if it's a tier limit error
      if (xpError.message?.includes('limit')) {
        console.log(`[${requestId}] XP limit reached for user's tier`);

        return new Response(
          JSON.stringify({
            success: true,
            blocked: true,
            message: 'Level limit reached for tier',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      throw xpError;
    }

    // 5. Update life goal trophy count
    const { data: updatedStats, error: updateStatsError } = await supabaseAdmin
      .from('user_stats')
      .update({ 
        life_goal_trophies: (statsBefore.life_goal_trophies || 0) + 1 
      })
      .eq('user_id', user.id)
      .select('level, xp')
      .single();

    if (updateStatsError) throw updateStatsError;

    const newLevel = updatedStats.level;
    const leveledUp = newLevel > oldLevel;

    console.log(`[${requestId}] Life goal completed - Awarded ${xpAmount} XP, Level ${oldLevel} -> ${newLevel}`);

    return new Response(
      JSON.stringify({
        success: true,
        xpAwarded: xpAmount,
        leveledUp,
        newLevel,
        oldLevel,
        trophyAwarded: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in complete-life-goal:', error);
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
