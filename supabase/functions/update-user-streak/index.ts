import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateStreakRequest {
  date?: string;
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

    const body: UpdateStreakRequest = await req.json().catch(() => ({}));
    const activityDate = body.date || new Date().toISOString().split('T')[0];

    console.log(`[${requestId}] Streak update started`);

    // Get current stats
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError) throw statsError;

    const lastActivity = stats.last_activity_date;
    const currentStreak = stats.current_streak || 0;
    const bestStreak = stats.best_streak || 0;

    let newStreak = currentStreak;

    if (!lastActivity) {
      // First activity ever
      newStreak = 1;
    } else {
      const lastDate = new Date(lastActivity);
      const currentDate = new Date(activityDate);
      const diffTime = currentDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day - keep streak
        newStreak = currentStreak;
      } else if (diffDays === 1) {
        // Next day - increment streak
        newStreak = currentStreak + 1;
      } else {
        // Missed days - reset streak
        newStreak = 1;
      }
    }

    const newBestStreak = Math.max(bestStreak, newStreak);

    // Update user_stats with new streak
    const { error: updateError } = await supabaseAdmin
      .from('user_stats')
      .update({
        current_streak: newStreak,
        best_streak: newBestStreak,
        last_activity_date: activityDate,
      })
      .eq('user_id', user.id);

    if (updateError) throw updateError;
    
    console.log(`[${requestId}] Streak updated - Current: ${newStreak}, Best: ${newBestStreak}`);

    return new Response(
      JSON.stringify({
        success: true,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        streakIncreased: newStreak > currentStreak,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in update-user-streak:', error);
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
