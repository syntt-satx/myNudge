import { test, describe } from 'node:test';
import assert from 'node:assert';
import { handleHealth } from '../src/routes/health.ts';
import { handleHintRoute } from '../src/routes/hint.ts';

describe('API Route Handlers (Sandboxed In-Memory)', () => {
  test('handleHealth returns valid status payload', async () => {
    const data = handleHealth();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.service, 'nudge-hint-engine-api');
    assert.strictEqual(data.version, '1.0.0');
  });

  test('handleHintRoute returns Level 0 hint with policy compliance', async () => {
    const data = await handleHintRoute({
      problemId: 'lc:two-sum',
      level: 0,
      studentLevel: 'beginner',
      personality: 'cheerleader'
    });

    assert.strictEqual(data.level, 0);
    assert.strictEqual(data.levelName, 'Understand Problem First');
    assert.ok(data.hintText.length > 20);
    assert.strictEqual(data.cached, true);
  });

  test('handleHintRoute blocks Level 5 when confirmLastResort is false', async () => {
    await assert.rejects(
      async () => {
        await handleHintRoute({
          problemId: 'lc:two-sum',
          level: 5,
          studentLevel: 'beginner',
          personality: 'mentor',
          confirmLastResort: false
        });
      },
      /explicit confirmation/
    );
  });

  test('handleHintRoute succeeds for Level 5 when confirmLastResort is true', async () => {
    const data = await handleHintRoute({
      problemId: 'lc:two-sum',
      level: 5,
      studentLevel: 'beginner',
      personality: 'mentor',
      confirmLastResort: true
    });

    assert.strictEqual(data.level, 5);
    assert.ok(data.hintText.includes('Full Solution') || Boolean(data.fullCode));
  });

  test('handleHintRoute rejects invalid level (< 0 or > 6)', async () => {
    await assert.rejects(
      async () => {
        await handleHintRoute({
          problemId: 'lc:two-sum',
          // @ts-ignore
          level: 99,
          studentLevel: 'beginner',
          personality: 'mentor'
        });
      },
      /Invalid hint level/
    );
  });
});
