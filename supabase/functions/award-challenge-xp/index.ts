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

    const { challenge_id, item_id, date, completed }: AwardXPRequest = await req.json();

    console.log(`[${requestId}] Processing - Challenge: ${challenge_id}, Item: ${item_id}, Completed: ${completed}`);

    // 1. Verify challenge ownership
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .select('user_id, completed_days, duration_days')
      .eq('id', challenge_id)
      .eq('user_id', user.id)
      .single();

    if (challengeError || !challenge) {
      throw new Error('Challenge not found or unauthorized');
    }

    // 2. Verify item belongs to challenge
    const { data: item, error: itemError } = await supabaseAdmin
      .from('challenge_items')
      .select('id')
      .eq('id', item_id)
      .eq('challenge_id', challenge_id)
      .single();

    if (itemError || !item) {
      throw new Error('Challenge item not found');
    }

    // 3. Check if progress already exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('challenge_progress')
      .select('*')
      .eq('challenge_id', challenge_id)
      .eq('item_id', item_id)
      .eq('date', date)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // 4. Update or insert progress
    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from('challenge_progress')
        .update({ completed })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseAdmin
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

      console.log(`[${requestId}] Awarding ${xpAmount} XP for item completion...`);

      try {
        // Use secure award_xp function
        const { error: awardError } = await supabaseAdmin.rpc('award_xp', {
          _user_id: user.id,
          _amount: xpAmount,
          _reason: 'challenge_item_completed',
          _metadata: { challenge_id, item_id, date },
          _caller_function: 'award-challenge-xp'
        });

        if (awardError) {
          // Check if it's a limit error
          if (awardError.message?.includes('limit')) {
            console.log(`[${requestId}] XP limit reached: ${awardError.message}`);
            return new Response(
              JSON.stringify({
                success: false,
                message: awardError.message,
                xpAwarded: 0,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
          throw awardError;
        }

        result.xpAwarded = xpAmount;

        // Get updated stats
        const { data: stats } = await supabaseAdmin
          .from('user_stats')
          .select('xp, level')
          .eq('user_id', user.id)
          .single();

        if (stats) {
          result.newLevel = stats.level;
          result.leveledUp = true;
        }
      } catch (error) {
        console.error(`[${requestId}] Error awarding XP:`, error);
        throw error;
      }

      // 6. Check if all items for the day are complete
      const { data: allItems } = await supabaseAdmin
        .from('challenge_items')
        .select('id')
        .eq('challenge_id', challenge_id);

      const { data: allProgress } = await supabaseAdmin
        .from('challenge_progress')
        .select('*')
        .eq('challenge_id', challenge_id)
        .eq('date', date);

      const totalItems = allItems?.length || 0;
      const completedItems = allProgress?.filter((p) => p.completed).length || 0;

      if (totalItems > 0 && completedItems === totalItems) {
        console.log(`[${requestId}] Day complete! Awarding bonus...`);
        
        // Day complete bonus - award 50 XP
        const bonusAmount = 50;

        try {
          await supabaseAdmin.rpc('award_xp', {
            _user_id: user.id,
            _amount: bonusAmount,
            _reason: 'day_complete_bonus',
            _metadata: { challenge_id, date, total_items: totalItems },
            _caller_function: 'award-challenge-xp'
          });

          result.dayComplete = true;
          result.xpAwarded += bonusAmount;
        } catch (error) {
          console.error(`[${requestId}] Error awarding day bonus:`, error);
        }

        // Count unique completed days
        const { data: completedDays } = await supabaseAdmin
          .from('challenge_progress')
          .select('date')
          .eq('challenge_id', challenge_id)
          .eq('completed', true);

        const uniqueDays = new Set(completedDays?.map(d => d.date));
        const newCompletedDays = uniqueDays.size;

        if (newCompletedDays !== challenge.completed_days) {
          // Update completed_days count
          await supabaseAdmin
            .from('challenges')
            .update({ completed_days: newCompletedDays })
            .eq('id', challenge_id);

          // Check if challenge is now complete (all days done)
          if (newCompletedDays >= challenge.duration_days) {
            console.log(`[${requestId}] Challenge complete! Awarding completion bonus...`);
            
            await supabaseAdmin
              .from('challenges')
              .update({ 
                is_active: false, 
                completed_at: new Date().toISOString() 
              })
              .eq('id', challenge_id);
            
            // Award challenge completion bonus - 200 XP
            const challengeBonus = 200;

            try {
              await supabaseAdmin.rpc('award_xp', {
                _user_id: user.id,
                _amount: challengeBonus,
                _reason: 'challenge_completed',
                _metadata: { challenge_id, completed_days: newCompletedDays },
                _caller_function: 'award-challenge-xp'
              });

              result.xpAwarded += challengeBonus;
            } catch (error) {
              console.error(`[${requestId}] Error awarding challenge bonus:`, error);
            }
          }
        }

        // Update streak
        try {
          await supabaseAdmin.functions.invoke('update-user-streak', {
            body: { date },
            headers: {
              Authorization: authHeader,
            },
          });
        } catch (streakError) {
          console.error(`[${requestId}] Error updating streak:`, streakError);
        }
      }
    }

    // Update streak for any item completion (not just day complete)
    if (completed && (!existing || !existing.completed)) {
      try {
        await supabaseAdmin.functions.invoke('update-user-streak', {
          body: { date },
          headers: {
            Authorization: authHeader,
          },
        });
      } catch (streakError) {
        console.error(`[${requestId}] Error updating streak:`, streakError);
      }
    }

    console.log(`[${requestId}] Success - Awarded ${result.xpAwarded} XP`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
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