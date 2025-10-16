import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AwardMedalRequest {
  date: string;
  challenges_completed: number;
  total_challenges: number;
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

    const { date, challenges_completed, total_challenges }: AwardMedalRequest = await req.json();

    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Processing - Date: ${date}, Completed: ${challenges_completed}/${total_challenges}`);

    // Calculate medal type based on completion percentage
    let medalType: 'gold' | 'silver' | 'bronze' | null = null;
    
    if (total_challenges === 0) {
      return new Response(
        JSON.stringify({ success: true, medalType: null, message: 'No challenges to complete' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const completionPercentage = (challenges_completed / total_challenges) * 100;

    if (completionPercentage === 100) {
      medalType = 'gold';
    } else if (completionPercentage >= 75) {
      medalType = 'silver';
    } else if (completionPercentage >= 50) {
      medalType = 'bronze';
    }

    if (!medalType) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          medalType: null, 
          message: 'Not enough completion for a medal (need 50%+)' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Check if medal already exists for this date
    const { data: existing } = await supabase
      .from('daily_medals')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      // Medal already awarded for this date
      return new Response(
        JSON.stringify({ 
          success: true, 
          medalType: existing.medal_type,
          alreadyAwarded: true 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Insert new medal record
    const { error: insertError } = await supabase
      .from('daily_medals')
      .insert({
        user_id: user.id,
        date,
        medal_type: medalType,
        challenges_completed,
        total_challenges,
      });

    if (insertError) throw insertError;

    // Update user stats medal count
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('daily_medals_gold, daily_medals_silver, daily_medals_bronze')
      .eq('user_id', user.id)
      .single();

    if (statsError) throw statsError;

    const currentCount = (stats[`daily_medals_${medalType}` as keyof typeof stats] as number) || 0;
    const updateData: Record<string, number> = {};
    updateData[`daily_medals_${medalType}`] = currentCount + 1;
    
    const { error: updateError } = await supabase
      .from('user_stats')
      .update(updateData)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    console.log(`[${requestId}] Medal awarded - Type: ${medalType}, Total: ${currentCount + 1}`);

    return new Response(
      JSON.stringify({
        success: true,
        medalType,
        totalMedals: currentCount + 1,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error(`[${requestId}] ERROR in award-daily-medal:`, error);
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
