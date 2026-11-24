import { test, describe } from 'node:test';
import assert from 'node:assert';
import { 
  HINT_POLICY, 
  calculateXpEarned, 
  BASE_DIFFICULTY_XP,
  HINT_LEVEL_XP_MULTIPLIERS,
  getRandomAffirmation,
  MOTIVATION_AFFIRMATIONS
} from '../src/index.ts';

describe('Hint Policy Rules', () => {
  test('Strict ladder has exactly levels 0 through 6', () => {
    const levels = Object.keys(HINT_POLICY).map(Number);
    assert.deepStrictEqual(levels, [0, 1, 2, 3, 4, 5, 6]);
  });

  test('Levels 0 to 3 prohibit any code', () => {
    for (let l = 0; l <= 3; l++) {
      assert.strictEqual(HINT_POLICY[l as 0 | 1 | 2 | 3].maxCodeLinesAllowed, 0);
    }
  });

  test('Level 4 allows only fragmented skeleton pseudocode', () => {
    assert.strictEqual(HINT_POLICY[4].maxCodeLinesAllowed, 4);
  });

  test('Level 5 is the full explanation', () => {
    assert.ok(HINT_POLICY[5].maxCodeLinesAllowed > 100);
  });
});

describe('XP & Anti-Gaming Calculations', () => {
  test('Levels 0-2 award 100% base XP without penalty', () => {
    assert.strictEqual(calculateXpEarned('Easy', 0, 0), 50);
    assert.strictEqual(calculateXpEarned('Easy', 1, 0), 50);
    assert.strictEqual(calculateXpEarned('Easy', 2, 0), 50);
    assert.strictEqual(calculateXpEarned('Medium', 2, 0), 100);
    assert.strictEqual(calculateXpEarned('Hard', 2, 0), 200);
  });

  test('Level 5 explanation applies 70% penalty (30% XP remaining)', () => {
    const xp = calculateXpEarned('Medium', 5, 0);
    assert.strictEqual(xp, 30); // 100 * 0.30
  });

  test('Streak bonus increments XP up to 30% cap', () => {
    const xpStreak0 = calculateXpEarned('Medium', 1, 0);
    const xpStreak2 = calculateXpEarned('Medium', 1, 2); // +10%
    const xpStreak10 = calculateXpEarned('Medium', 1, 10); // capped at +30%

    assert.strictEqual(xpStreak0, 100);
    assert.strictEqual(xpStreak2, 110);
    assert.strictEqual(xpStreak10, 130);
  });
});

describe('Affirmations', () => {
  test('Returns non-empty friendly message from pool', () => {
    const aff = getRandomAffirmation();
    assert.ok(aff.length > 10);
    assert.ok(MOTIVATION_AFFIRMATIONS.includes(aff));
  });
});
