export const MOTIVATION_AFFIRMATIONS: string[] = [
  "Mistakes are just clues we haven't solved yet. We got this!",
  "Rome wasn't built in a day, and neither was a perfect DP solution. Keep going!",
  "The simpler the solution, the more elegant the code. Aim for clarity!",
  "Every red test case is just one step closer to green.",
  "You're not just solving a problem, you're training your problem-solving muscle.",
  "Don't worry about speed right now. First make it work, then make it clean.",
  "Even senior engineers get stuck on pointer arithmetic. Take a breath!",
  "Focus on the pattern, not memorizing the code. Patterns stay forever.",
  "Small daily consistency beats frantic weekend cramming every single time."
];

export function getRandomAffirmation(): string {
  const index = Math.floor(Math.random() * MOTIVATION_AFFIRMATIONS.length);
  return MOTIVATION_AFFIRMATIONS[index];
}
