import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteGoalRequest {
  goal_id: string;
}

// XP calculation logic
function calculateLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 100.0)) + 1);
}

// Direct XP award function
async function awardXP(
  supabaseAdmin: any,
  userId: string,
  amount: number,
  reason: string,
  metadata: any
) {
  // Get current stats
  const { data: currentStats, error: statsError } = await supabaseAdmin
    .from('user_stats')
    .select('xp, level')
    .eq('user_id', userId)
    .single();

  if (statsError) throw statsError;

  const currentXP = currentStats?.xp || 0;
  const newXP = Math.max(0, currentXP + amount);
  const newLevel = calculateLevel(newXP);

  // Update user stats
  const { error: updateError } = await supabaseAdmin
    .from('user_stats')
    .update({
      xp: newXP,
      level: newLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) throw updateError;

  // Log XP award
  const { error: logError } = await supabaseAdmin
    .from('xp_audit_log')
    .insert({
      user_id: userId,
      amount: amount,
      reason: reason,
      metadata: metadata,
    });

  if (logError) console.error('Failed to log XP:', logError);

  return { newXP, newLevel, oldLevel: currentStats?.level || 1 };
}

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

    // 3. Get current stats (for level comparison and trophy count)
    const { data: statsBefore, error: statsError } = await supabaseAdmin
      .from('user_stats')
      .select('level, life_goal_trophies')
      .eq('user_id', user.id)
      .single();

    if (statsError) throw statsError;

    const oldLevel = statsBefore.level;

    // 4. Award 1000 XP directly
    const xpAmount = 1000;
    console.log(`[${requestId}] Awarding ${xpAmount} XP for life goal completion`);

    const xpResult = await awardXP(
      supabaseAdmin,
      user.id,
      xpAmount,
      'life_goal_completed',
      { 
        goal_id, 
        goal_title: goal.title,
        awarded_trophy: true,
        request_id: requestId
      }
    );

    console.log(`[${requestId}] XP awarded: ${xpAmount}, New level: ${xpResult.newLevel}`);

    // 5. Update life goal trophy count
    const { error: updateStatsError } = await supabaseAdmin
      .from('user_stats')
      .update({ 
        life_goal_trophies: (statsBefore.life_goal_trophies || 0) + 1 
      })
      .eq('user_id', user.id);

    if (updateStatsError) throw updateStatsError;

    const newLevel = xpResult.newLevel;
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
