import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AwardXPRequest {
  challenge_id: string;
  item_id: string;
  date: string;
  completed: boolean;
}

// XP calculation logic (moved from client)
function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function getXPForNextLevel(level: number): number {
  return level * 100;
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

    const { challenge_id, item_id, date, completed }: AwardXPRequest = await req.json();

    console.log(`Award XP request - User: ${user.id}, Challenge: ${challenge_id}, Item: ${item_id}, Completed: ${completed}`);

    // 1. Verify challenge ownership
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('user_id')
      .eq('id', challenge_id)
      .eq('user_id', user.id)
      .single();

    if (challengeError || !challenge) {
      throw new Error('Challenge not found or unauthorized');
    }

    // 2. Verify item belongs to challenge
    const { data: item, error: itemError } = await supabase
      .from('challenge_items')
      .select('id')
      .eq('id', item_id)
      .eq('challenge_id', challenge_id)
      .single();

    if (itemError || !item) {
      throw new Error('Challenge item not found');
    }

    // 3. Check if progress already exists
    const { data: existing, error: fetchError } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('challenge_id', challenge_id)
      .eq('item_id', item_id)
      .eq('date', date)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // 4. Update or insert progress
    if (existing) {
      const { error: updateError } = await supabase
        .from('challenge_progress')
        .update({ completed })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('challenge_progress')
        .insert({
          challenge_id,
          item_id,
          date,
          completed,
        });

      if (insertError) throw insertError;
    }

    let result = {
      success: true,
      xpAwarded: 0,
      leveledUp: false,
      newLevel: 0,
      dayComplete: false,
    };

    // 5. Award XP if completing (not uncompleting)
    if (completed && (!existing || !existing.completed)) {
      const xpAmount = 10;

      // Get current stats
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsError) throw statsError;

      const oldLevel = stats.level;
      const newXP = stats.xp + xpAmount;
      const newLevel = calculateLevel(newXP);
      const newTrophyStage = getTrophyStage(newLevel);
      const leveledUp = newLevel > oldLevel;

      // Check level limit based on subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      const tier = subscription?.tier || 'free';
      const blocked = tier === 'free' && newLevel > 25;

      if (!blocked) {
        // Update user stats
        const { error: updateStatsError } = await supabase
          .from('user_stats')
          .update({
            xp: newXP,
            level: newLevel,
            tree_stage: newTrophyStage,
          })
          .eq('user_id', user.id);

        if (updateStatsError) throw updateStatsError;

        // Log XP award in audit table
        await supabase.from('xp_audit_log').insert({
          user_id: user.id,
          amount: xpAmount,
          reason: 'challenge_item_completed',
          metadata: { challenge_id, item_id, date },
        });

        result.xpAwarded = xpAmount;
        result.leveledUp = leveledUp;
        result.newLevel = newLevel;
      }

      // 6. Check if all items for the day are complete
      const { data: allItems } = await supabase
        .from('challenge_items')
        .select('id')
        .eq('challenge_id', challenge_id);

      const { data: allProgress } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('challenge_id', challenge_id)
        .eq('date', date);

      const totalItems = allItems?.length || 0;
      const completedItems = allProgress?.filter((p) => p.completed).length || 0;

      if (totalItems > 0 && completedItems === totalItems && !blocked) {
        // Day complete bonus - award 50 XP
        const bonusAmount = 50;
        const bonusXP = newXP + bonusAmount;
        const bonusLevel = calculateLevel(bonusXP);
        const bonusTrophyStage = getTrophyStage(bonusLevel);

        await supabase
          .from('user_stats')
          .update({
            xp: bonusXP,
            level: bonusLevel,
            tree_stage: bonusTrophyStage,
          })
          .eq('user_id', user.id);

        // Log bonus in audit
        await supabase.from('xp_audit_log').insert({
          user_id: user.id,
          amount: bonusAmount,
          reason: 'day_complete_bonus',
          metadata: { challenge_id, date, total_items: totalItems },
        });

        result.dayComplete = true;
        result.xpAwarded += bonusAmount;
        result.newLevel = bonusLevel;
        result.leveledUp = bonusLevel > oldLevel;

        // Check if this day was already completed before (to track completed days)
        const { data: challengeData } = await supabase
          .from('challenges')
          .select('completed_days, duration_days')
          .eq('id', challenge_id)
          .single();

        // Count unique completed days
        const { data: completedDays } = await supabase
          .from('challenge_progress')
          .select('date')
          .eq('challenge_id', challenge_id)
          .eq('completed', true);

        // Group by date to get unique days
        const uniqueDays = new Set(completedDays?.map(d => d.date));
        const newCompletedDays = uniqueDays.size;

        if (challengeData && newCompletedDays !== challengeData.completed_days) {
          // Update completed_days count
          await supabase
            .from('challenges')
            .update({ completed_days: newCompletedDays })
            .eq('id', challenge_id);

          // Check if challenge is now complete (all days done)
          if (newCompletedDays >= challengeData.duration_days) {
            await supabase
              .from('challenges')
              .update({ 
                is_active: false, 
                completed_at: new Date().toISOString() 
              })
              .eq('id', challenge_id);
            
            // Award challenge completion bonus - 200 XP
            const challengeBonus = 200;
            const challengeBonusXP = bonusXP + challengeBonus;
            const challengeBonusLevel = calculateLevel(challengeBonusXP);
            const challengeBonusTrophyStage = getTrophyStage(challengeBonusLevel);

            await supabase
              .from('user_stats')
              .update({
                xp: challengeBonusXP,
                level: challengeBonusLevel,
                tree_stage: challengeBonusTrophyStage,
              })
              .eq('user_id', user.id);

            await supabase.from('xp_audit_log').insert({
              user_id: user.id,
              amount: challengeBonus,
              reason: 'challenge_completed',
              metadata: { challenge_id, completed_days: newCompletedDays },
            });

            result.xpAwarded += challengeBonus;
            result.newLevel = challengeBonusLevel;
            result.leveledUp = challengeBonusLevel > oldLevel;
          }
        }

        // Update streak (call the streak function)
        const { error: streakError } = await supabase.functions.invoke('update-user-streak', {
          body: { date },
          headers: {
            Authorization: authHeader,
          },
        });

        if (streakError) {
          console.error('Error updating streak:', streakError);
        }
      }
    }

    console.log('Award XP result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in award-challenge-xp:', error);
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
