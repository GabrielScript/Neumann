import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getAllHeaders, checkRateLimit, logSecurityEvent, getIpAddress, isValidUUID } from '../_shared/security.ts';

interface AwardCreationXPRequest {
  type: 'challenge' | 'goal';
  item_id: string;
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
      await logSecurityEvent(supabaseAdmin, null, 'creation_xp_attempt', 'creation', null, ipAddress, userAgent, 'blocked', { reason: 'missing_auth' });
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      await logSecurityEvent(supabaseAdmin, null, 'creation_xp_attempt', 'creation', null, ipAddress, userAgent, 'blocked', { reason: 'invalid_auth' });
      throw new Error('Unauthorized');
    }

    const { type, item_id }: AwardCreationXPRequest = await req.json();

    // Rate limiting: 50 requests per minute
    const rateLimitCheck = await checkRateLimit(supabaseAdmin, user.id, ipAddress, 'award-creation-xp', 50, 1);
    if (!rateLimitCheck.allowed) {
      await logSecurityEvent(supabaseAdmin, user.id, 'rate_limit_exceeded', 'creation', null, ipAddress, userAgent, 'blocked');
      return new Response(
        JSON.stringify({ error: rateLimitCheck.error }),
        { headers, status: 429 }
      );
    }

    // Validate UUID
    if (!isValidUUID(item_id)) {
      await logSecurityEvent(supabaseAdmin, user.id, 'invalid_input', type, item_id, ipAddress, userAgent, 'blocked', { reason: 'invalid_uuid' });
      throw new Error('Invalid item ID');
    }

    console.log(`[${requestId}] Processing ${type} creation XP - User: ${user.id}`);

    // SECURITY: Verify ownership before awarding XP
    if (type === 'challenge') {
      const { data: challenge, error: challengeError } = await supabaseAdmin
        .from('challenges')
        .select('user_id')
        .eq('id', item_id)
        .single();

      if (challengeError || !challenge || challenge.user_id !== user.id) {
        await logSecurityEvent(supabaseAdmin, user.id, 'ownership_violation', type, item_id, ipAddress, userAgent, 'blocked', { reason: 'not_owner' });
        throw new Error('Unauthorized: Challenge not found or access denied');
      }
    } else if (type === 'goal') {
      const { data: goal, error: goalError } = await supabaseAdmin
        .from('life_goals')
        .select('user_id')
        .eq('id', item_id)
        .single();

      if (goalError || !goal || goal.user_id !== user.id) {
        await logSecurityEvent(supabaseAdmin, user.id, 'ownership_violation', type, item_id, ipAddress, userAgent, 'blocked', { reason: 'not_owner' });
        throw new Error('Unauthorized: Goal not found or access denied');
      }
    }

    // Define XP amounts
    let xpAmount = 0;
    let reason = '';

    if (type === 'challenge') {
      xpAmount = 15; // Pouco XP
      reason = 'challenge_created';
    } else if (type === 'goal') {
      xpAmount = 25; // Um pouco mais que desafio
      reason = 'life_goal_created';
    }

    if (xpAmount > 0) {
      console.log(`[${requestId}] Awarding ${xpAmount} XP for ${type} creation...`);

      try {
        const xpResult = await awardXP(
          supabaseAdmin,
          user.id,
          xpAmount,
          reason,
          { item_id, type }
        );

        console.log(`[${requestId}] Success - Awarded ${xpAmount} XP, New level: ${xpResult.newLevel}`);

        await logSecurityEvent(supabaseAdmin, user.id, 'creation_xp_awarded', type, item_id, ipAddress, userAgent, 'success', { xpAwarded: xpAmount });

        return new Response(
          JSON.stringify({
            success: true,
            xpAwarded: xpAmount,
            newLevel: xpResult.newLevel,
            leveledUp: xpResult.newLevel > xpResult.oldLevel,
          }),
          { headers, status: 200 }
        );
      } catch (error) {
        console.error(`[${requestId}] Error awarding XP:`, error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ success: true, xpAwarded: 0 }),
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
