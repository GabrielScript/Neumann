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
  return Math.floor(xp / 100) + 1;
}

function getTrophyStage(level: number): string {
  if (level <= 10) return 'municipal';
  if (level <= 25) return 'estadual';
  if (level <= 45) return 'regional';
  if (level <= 70) return 'nacional';
  return 'internacional';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { goal_id }: CompleteGoalRequest = await req.json();

    console.log(`Complete life goal request - User: ${user.id}, Goal: ${goal_id}`);

    // 1. Verify goal ownership and not already completed
    const { data: goal, error: goalError } = await supabase
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

    // 2. Mark goal as completed
    const { error: updateGoalError } = await supabase
      .from('life_goals')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', goal_id);

    if (updateGoalError) throw updateGoalError;

    // 3. Get current stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError) throw statsError;

    // 4. Award 500 XP for life goal completion
    const xpAmount = 500;
    const oldLevel = stats.level;
    const newXP = stats.xp + xpAmount;
    const newLevel = calculateLevel(newXP);
    const newTrophyStage = getTrophyStage(newLevel);
    const leveledUp = newLevel > oldLevel;

    // Check level limit
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    const tier = subscription?.tier || 'free';
    const blocked = tier === 'free' && newLevel > 25;

    if (blocked) {
      // Still mark goal as complete but don't award XP/trophy
      return new Response(
        JSON.stringify({
          success: true,
          blocked: true,
          message: 'Level limit reached for free tier',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // 5. Update user stats with XP and special trophy
    const { error: updateStatsError } = await supabase
      .from('user_stats')
      .update({
        xp: newXP,
        level: newLevel,
        tree_stage: newTrophyStage,
        life_goal_trophies: (stats.life_goal_trophies || 0) + 1,
      })
      .eq('user_id', user.id);

    if (updateStatsError) throw updateStatsError;

    // 6. Log XP award in audit table (important for high-value awards)
    await supabase.from('xp_audit_log').insert({
      user_id: user.id,
      amount: xpAmount,
      reason: 'life_goal_completed',
      metadata: { goal_id, goal_title: goal.title },
    });

    console.log(`Life goal completed - Awarded ${xpAmount} XP, Level ${oldLevel} -> ${newLevel}`);

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
