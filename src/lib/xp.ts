import { supabase } from "@/integrations/supabase/client";

export type TrophyStage = "municipal" | "estadual" | "regional" | "nacional" | "internacional";

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getXPForNextLevel(level: number): number {
  return level * 100;
}

export function getTrophyStage(level: number): TrophyStage {
  if (level <= 10) return "municipal";
  if (level <= 25) return "estadual";
  if (level <= 45) return "regional";
  if (level <= 70) return "nacional";
  return "internacional";
}

export function getTrophyStageName(stage: TrophyStage): string {
  const names: Record<TrophyStage, string> = {
    municipal: "Troféu Municipal",
    estadual: "Troféu Estadual",
    regional: "Troféu Regional",
    nacional: "Troféu Nacional",
    internacional: "Troféu Internacional",
  };
  return names[stage];
}

export async function awardXP(userId: string, amount: number): Promise<{
  newXP: number;
  newLevel: number;
  leveledUp: boolean;
  newTrophyStage: TrophyStage;
  stageChanged: boolean;
}> {
  // Get current stats
  const { data: currentStats, error: fetchError } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;

  const oldXP = currentStats.xp;
  const oldLevel = currentStats.level;
  const oldTrophyStage = currentStats.tree_stage as TrophyStage;

  const newXP = oldXP + amount;
  const newLevel = calculateLevel(newXP);
  const newTrophyStage = getTrophyStage(newLevel);

  const leveledUp = newLevel > oldLevel;
  const stageChanged = newTrophyStage !== oldTrophyStage;

  // Update stats
  const { error: updateError } = await supabase
    .from("user_stats")
    .update({
      xp: newXP,
      level: newLevel,
      tree_stage: newTrophyStage,
    })
    .eq("user_id", userId);

  if (updateError) throw updateError;

  return {
    newXP,
    newLevel,
    leveledUp,
    newTrophyStage,
    stageChanged,
  };
}

export async function awardLifeGoalTrophy(userId: string): Promise<void> {
  const { data: currentStats } = await supabase
    .from("user_stats")
    .select("life_goal_trophies")
    .eq("user_id", userId)
    .single();
  
  if (currentStats) {
    await supabase
      .from("user_stats")
      .update({ life_goal_trophies: (currentStats.life_goal_trophies || 0) + 1 })
      .eq("user_id", userId);
  }
}

export type DailyMedalType = "gold" | "silver" | "bronze";

export async function awardDailyMedal(
  userId: string,
  challengesCompleted: number,
  totalChallenges: number
): Promise<DailyMedalType> {
  let medalType: DailyMedalType;
  
  if (challengesCompleted === totalChallenges && totalChallenges > 0) {
    medalType = "gold";
  } else if (challengesCompleted > 0) {
    medalType = "silver";
  } else {
    medalType = "bronze";
  }

  const today = new Date().toISOString().split('T')[0];

  // Insert or update daily medal
  await supabase
    .from("daily_medals")
    .upsert({
      user_id: userId,
      date: today,
      medal_type: medalType,
      challenges_completed: challengesCompleted,
      total_challenges: totalChallenges,
    }, {
      onConflict: 'user_id,date'
    });

  // Update medal count in user_stats
  const columnName = `daily_medals_${medalType}`;
  const { data: currentStats } = await supabase
    .from("user_stats")
    .select(columnName)
    .eq("user_id", userId)
    .single();

  if (currentStats) {
    await supabase
      .from("user_stats")
      .update({ [columnName]: (currentStats[columnName] || 0) + 1 })
      .eq("user_id", userId);
  }

  return medalType;
}

export async function updateStreak(userId: string, lastActivityDate: string | null): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  if (lastActivityDate === today) {
    // Already updated today
    return;
  }

  const { data: currentStats, error: fetchError } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;

  let newStreak = currentStats.current_streak;
  
  if (lastActivityDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastActivityDate === yesterdayStr) {
      // Consecutive day
      newStreak += 1;
    } else {
      // Streak broken
      newStreak = 1;
    }
  } else {
    // First activity
    newStreak = 1;
  }

  const newBestStreak = Math.max(currentStats.best_streak, newStreak);

  const { error: updateError } = await supabase
    .from("user_stats")
    .update({
      current_streak: newStreak,
      best_streak: newBestStreak,
      last_activity_date: today,
    })
    .eq("user_id", userId);

  if (updateError) throw updateError;
}
