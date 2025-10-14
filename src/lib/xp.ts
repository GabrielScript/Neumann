/**
 * XP Calculation Library
 * 
 * ⚠️ SECURITY NOTE:
 * This file contains ONLY calculation functions for UI/display purposes.
 * All XP awards, level updates, trophy awards, and streak management
 * are now handled SERVER-SIDE via Edge Functions for security.
 * 
 * DO NOT add functions here that modify database values - those must
 * be implemented in Edge Functions to prevent client-side manipulation.
 * 
 * DEPRECATED FUNCTIONS (now server-side):
 * - awardXP() -> use Edge Function: award-challenge-xp or complete-life-goal
 * - awardLifeGoalTrophy() -> use Edge Function: complete-life-goal
 * - awardDailyMedal() -> use Edge Function: award-daily-medal
 * - updateStreak() -> use Edge Function: update-user-streak
 */

export type TrophyStage = "municipal" | "estadual" | "regional" | "nacional" | "internacional";

/**
 * Calculate user level based on XP
 * Formula: level = floor(xp / 100) + 1
 */
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

/**
 * Calculate XP required for next level
 */
export function getXPForNextLevel(level: number): number {
  return level * 100;
}

/**
 * Determine trophy stage based on level
 */
export function getTrophyStage(level: number): TrophyStage {
  if (level <= 10) return "municipal";
  if (level <= 25) return "estadual";
  if (level <= 45) return "regional";
  if (level <= 70) return "nacional";
  return "internacional";
}

/**
 * Get human-readable trophy stage name
 */
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

/**
 * Calculate XP progress within current level (0-100%)
 */
export function getLevelProgress(xp: number): number {
  const currentLevel = calculateLevel(xp);
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpInCurrentLevel = xp - xpForCurrentLevel;
  return (xpInCurrentLevel / 100) * 100;
}

/**
 * Calculate XP needed to reach next level
 */
export function getXPToNextLevel(xp: number): number {
  const currentLevel = calculateLevel(xp);
  const xpForNextLevel = getXPForNextLevel(currentLevel);
  return xpForNextLevel - xp;
}

export type DailyMedalType = "gold" | "silver" | "bronze";
