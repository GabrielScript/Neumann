import { supabase } from "@/integrations/supabase/client";

export type TreeStage = "seed" | "sprout" | "young" | "flourish" | "splendid";

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getXPForNextLevel(level: number): number {
  return level * 100;
}

export function getTreeStage(level: number): TreeStage {
  if (level <= 5) return "seed";
  if (level <= 15) return "sprout";
  if (level <= 30) return "young";
  if (level <= 50) return "flourish";
  return "splendid";
}

export async function awardXP(userId: string, amount: number): Promise<{
  newXP: number;
  newLevel: number;
  leveledUp: boolean;
  newTreeStage: TreeStage;
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
  const oldTreeStage = currentStats.tree_stage as TreeStage;

  const newXP = oldXP + amount;
  const newLevel = calculateLevel(newXP);
  const newTreeStage = getTreeStage(newLevel);

  const leveledUp = newLevel > oldLevel;
  const stageChanged = newTreeStage !== oldTreeStage;

  // Update stats
  const { error: updateError } = await supabase
    .from("user_stats")
    .update({
      xp: newXP,
      level: newLevel,
      tree_stage: newTreeStage,
    })
    .eq("user_id", userId);

  if (updateError) throw updateError;

  return {
    newXP,
    newLevel,
    leveledUp,
    newTreeStage,
    stageChanged,
  };
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
