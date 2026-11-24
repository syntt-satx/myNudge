import type { HintLevel } from '../types/index.ts';

export const BASE_DIFFICULTY_XP: Record<'Easy' | 'Medium' | 'Hard', number> = {
  Easy: 50,
  Medium: 100,
  Hard: 200
};

// Solving with hints 0-2 gives 100% XP; level 3 gives 85%; level 4 gives 65%; level 5 gives 30%
export const HINT_LEVEL_XP_MULTIPLIERS: Record<HintLevel, number> = {
  0: 1.0,
  1: 1.0,
  2: 1.0,
  3: 0.85,
  4: 0.65,
  5: 0.30,
  6: 1.0
};

export function calculateXpEarned(
  difficulty: 'Easy' | 'Medium' | 'Hard',
  highestHintLevelUsed: HintLevel,
  currentStreakDays: number = 0
): number {
  const base = BASE_DIFFICULTY_XP[difficulty] || 50;
  const multiplier = HINT_LEVEL_XP_MULTIPLIERS[highestHintLevelUsed] ?? 1.0;
  
  // Streak bonus: +5% per active streak day, capped at +30%
  const streakBonusMultiplier = 1.0 + Math.min(0.30, currentStreakDays * 0.05);

  return Math.round(base * multiplier * streakBonusMultiplier);
}
