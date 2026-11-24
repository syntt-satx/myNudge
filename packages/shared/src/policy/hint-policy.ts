import type { HintLevel } from '../types/index.ts';

export interface LevelPolicy {
  level: HintLevel;
  name: string;
  reveals: string;
  mustNotReveal: string;
  maxCodeLinesAllowed: number;
}

export const HINT_POLICY: Record<HintLevel, LevelPolicy> = {
  0: {
    level: 0,
    name: 'Guiding Question',
    reveals: 'A Socratic question that makes the student observe problem invariants or behavior with small inputs.',
    mustNotReveal: 'Any specific data structure, algorithm name, or code.',
    maxCodeLinesAllowed: 0
  },
  1: {
    level: 1,
    name: 'Restatement & Invariants',
    reveals: 'Reformulation of constraints, bounds, edge-case conditions, and what is truly being asked.',
    mustNotReveal: 'Specific algorithmic approaches, complexity trade-offs, or code.',
    maxCodeLinesAllowed: 0
  },
  2: {
    level: 2,
    name: 'Conceptual Direction',
    reveals: 'The category of data structure or intuitive concept to consider (e.g. tracking frequencies, ordered lookup).',
    mustNotReveal: 'Concrete algorithmic steps, step-by-step loops, or code.',
    maxCodeLinesAllowed: 0
  },
  3: {
    level: 3,
    name: 'Pattern Identification',
    reveals: 'The established algorithmic pattern name (e.g. Sliding Window, Two Pointers, Monotonic Stack) and why it fits.',
    mustNotReveal: 'Executable code, line-by-line syntax, or complete algorithm steps.',
    maxCodeLinesAllowed: 0
  },
  4: {
    level: 4,
    name: 'Structural Pseudocode',
    reveals: 'High-level skeleton pseudocode containing unfilled blanks (/* TODO: Fill in condition */) and loop boundaries.',
    mustNotReveal: 'Complete working or copy-pasteable runnable code.',
    maxCodeLinesAllowed: 4 // Only fragmented pseudo-blocks
  },
  5: {
    level: 5,
    name: 'Full Line-by-Line Explanation',
    reveals: 'Complete line-by-line breakdown, time/space complexity, and dry-run with sample test case. Served only after explicit confirmation.',
    mustNotReveal: 'Nothing withheld at this level.',
    maxCodeLinesAllowed: 9999
  },
  6: {
    level: 6,
    name: 'Similar Practice Problems',
    reveals: 'Curated list of 2-3 similar problems on LeetCode/GFG that reinforce the same underlying pattern.',
    mustNotReveal: 'Solutions to the recommended problems.',
    maxCodeLinesAllowed: 0
  }
};

export const LEVEL_NAMES: Record<HintLevel, string> = {
  0: 'Understand Problem First',
  1: 'Mental Simulation & Checkpoint',
  2: 'Core Logic & Technique',
  3: 'Dry Run & Interactive Testing',
  4: 'Algorithm Blueprint',
  5: 'Full Solution & Complexity',
  6: 'Similar Problems'
};
