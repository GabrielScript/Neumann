import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

interface AwardXPRequest {
  challenge_id: string;
  item_id: string;
  date: string;
  completed: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

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

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Request started`);

  try {
    // Admin client for secure database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[${requestId}] Missing authorization header`);
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: corsHeaders, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error(`[${requestId}] Auth error:`, authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: corsHeaders, status: 401 }
      );
    }

    console.log(`[${requestId}] User authenticated: ${user.id}`);

    const { challenge_id, item_id, date, completed }: AwardXPRequest = await req.json();

    // Validate UUIDs
    if (!isValidUUID(challenge_id) || !isValidUUID(item_id)) {
      console.error(`[${requestId}] Invalid UUIDs`);
      return new Response(
        JSON.stringify({ error: 'Invalid challenge or item ID' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    console.log(`[${requestId}] Processing - Challenge: ${challenge_id}, Item: ${item_id}, Completed: ${completed}`);

    // 1. Verify challenge ownership
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .select('user_id, completed_days, duration_days')
      .eq('id', challenge_id)
      .eq('user_id', user.id)
      .single();

    if (challengeError || !challenge) {
      console.error(`[${requestId}] Challenge not found:`, challengeError);
      return new Response(
        JSON.stringify({ error: 'Challenge not found or unauthorized' }),
        { headers: corsHeaders, status: 404 }
      );
    }

    // 2. Verify item belongs to challenge
    const { data: item, error: itemError } = await supabaseAdmin
      .from('challenge_items')
      .select('id')
      .eq('id', item_id)
      .eq('challenge_id', challenge_id)
      .single();

    if (itemError || !item) {
      console.error(`[${requestId}] Item not found:`, itemError);
      return new Response(
        JSON.stringify({ error: 'Challenge item not found' }),
        { headers: corsHeaders, status: 404 }
      );
    }

    // 3. Get existing progress state before UPSERT
    const { data: existingProgress } = await supabaseAdmin
      .from('challenge_progress')
      .select('completed')
      .eq('challenge_id', challenge_id)
      .eq('item_id', item_id)
      .eq('date', date)
      .maybeSingle();

    const wasAlreadyCompleted = existingProgress?.completed || false;

    // 4. UPSERT progress (insert or update atomically)
    const { error: upsertError } = await supabaseAdmin
      .from('challenge_progress')
      .upsert(
        {
          challenge_id,
          item_id,
          date,
          completed,
        },
        {
          onConflict: 'challenge_id,item_id,date',
        }
      );

    if (upsertError) {
      console.error(`[${requestId}] Upsert error:`, upsertError);
      return new Response(
        JSON.stringify({ error: 'Error updating progress' }),
        { headers: corsHeaders, status: 500 }
      );
    }

    console.log(`[${requestId}] Progress updated successfully`)

    let result = {
      success: true,
      xpAwarded: 0,
      leveledUp: false,
      newLevel: 0,
      dayComplete: false,
    };

    // 5. Award XP if completing (not uncompleting)
    if (completed && !wasAlreadyCompleted) {
      const xpAmount = 10;

      console.log(`[${requestId}] Awarding ${xpAmount} XP for item completion...`);

      try {
        const xpResult = await awardXP(
          supabaseAdmin,
          user.id,
          xpAmount,
          'challenge_item_completed',
          { challenge_id, item_id, date }
        );

        result.xpAwarded = xpAmount;
        result.newLevel = xpResult.newLevel;
        result.leveledUp = xpResult.newLevel > xpResult.oldLevel;

        console.log(`[${requestId}] XP awarded: ${xpAmount}, New level: ${xpResult.newLevel}`);
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
        
        // Day complete bonus - award 100 XP
        const bonusAmount = 100;

        try {
          await awardXP(
            supabaseAdmin,
            user.id,
            bonusAmount,
            'day_complete_bonus',
            { challenge_id, date, total_items: totalItems }
          );

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
            
            // Award challenge completion bonus - (duration_days * 100) / 2
            const challengeBonus = Math.floor((challenge.duration_days * 100) / 2);

            try {
              await awardXP(
                supabaseAdmin,
                user.id,
                challengeBonus,
                'challenge_completed',
                { challenge_id, completed_days: newCompletedDays }
              );

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
    if (completed && !wasAlreadyCompleted) {
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

    return new Response(JSON.stringify(result), { headers: corsHeaders, status: 200 });
  } catch (error) {
    console.error(`[${requestId}] ERROR:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: corsHeaders, status: 400 }
    );
  }
});
