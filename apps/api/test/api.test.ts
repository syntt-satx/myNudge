import { test, describe } from 'node:test';
import assert from 'node:assert';
import { AntiLeakValidator } from '../src/validator/anti-leak-validator.ts';
import { LadderGeneratorEngine } from '../src/engine/ladder-generator.ts';
import { handleHealth } from '../src/routes/health.ts';

describe('Health Route', () => {
  test('Returns ok status and metadata', () => {
    const health = handleHealth();
    assert.strictEqual(health.status, 'ok');
    assert.strictEqual(health.service, 'nudge-hint-engine-api');
    assert.ok(health.timestamp);
  });
});

describe('Anti-Leak Validator Safety Gates', () => {
  test('Level 0-3: Rejects code fences', () => {
    const badHint = "Here is the idea: ```python\ndef solve(): return True\n```";
    const res = AntiLeakValidator.validate(1, badHint);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.reason?.includes('must not contain code blocks'));
  });

  test('Level 0-3: Rejects inline code statements', () => {
    const badInline = "You should do def twoSum(nums): and return result";
    const res = AntiLeakValidator.validate(1, badInline);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.reason?.includes('Suspicious code statements'));
  });

  test('Level 0-3: Accepts purely conceptual text', () => {
    const safeHint = "Think about how a hash map allows instantaneous constant time lookups for complementary values.";
    const res = AntiLeakValidator.validate(2, safeHint);
    assert.strictEqual(res.isValid, true);
  });

  test('Level 4: Rejects pseudocode blocks exceeding 4 lines', () => {
    const longPseudo = "```\nline 1\nline 2\nline 3\nline 4\nline 5\nline 6\n```";
    const res = AntiLeakValidator.validate(4, longPseudo);
    assert.strictEqual(res.isValid, false);
  });

  test('Level 5: Allows full explanation', () => {
    const fullExplanation = "```python\ndef twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen: return [seen[target-n], i]\n        seen[n] = i\n```";
    const res = AntiLeakValidator.validate(5, fullExplanation);
    assert.strictEqual(res.isValid, true);
  });
});

describe('Hint Ladder Generation & Persona Adaptation', () => {
  test('Generates policy-compliant Level 0 hint with Cheerleader tone', async () => {
    const hint = await LadderGeneratorEngine.getHint({
      problemId: 'lc:two-sum',
      level: 0,
      studentLevel: 'beginner',
      personality: 'cheerleader'
    });

    assert.strictEqual(hint.level, 0);
    assert.strictEqual(hint.levelName, 'Understand Problem First');
    assert.ok(hint.hintText.includes("You've got this!"));
    assert.ok(hint.hintText.includes("Keep that momentum going!"));
    assert.strictEqual(hint.cached, true);
  });

  test('Generates Level 2 hint with Zen Master tone', async () => {
    const hint = await LadderGeneratorEngine.getHint({
      problemId: 'lc:two-sum',
      level: 2,
      studentLevel: 'beginner',
      personality: 'zen_master'
    });

    assert.ok(hint.hintText.includes('Take a calm breath'));
    assert.ok(hint.hintText.includes('Solutions arrive with patient clarity'));
  });

  test('Level 5 blocks without confirmLastResort flag', async () => {
    await assert.rejects(
      async () => {
        await LadderGeneratorEngine.getHint({
          problemId: 'lc:two-sum',
          level: 5,
          studentLevel: 'beginner',
          personality: 'mentor',
          confirmLastResort: false
        });
      },
      /Level 5 full explanation requires explicit confirmation/
    );
  });

  test('Level 5 unlocks successfully when confirmed', async () => {
    const hint = await LadderGeneratorEngine.getHint({
      problemId: 'lc:two-sum',
      level: 5,
      studentLevel: 'beginner',
      personality: 'mentor',
      confirmLastResort: true
    });

    assert.strictEqual(hint.level, 5);
    assert.ok(hint.hintText.includes('Full Solution') || Boolean(hint.fullCode));
    assert.strictEqual(hint.complexityNote?.time, 'O(N)');
  });
});
