import { test, describe } from 'node:test';
import assert from 'node:assert';
import { LeetCodeAdapter } from '../src/adapters/leetcode-adapter.ts';

describe('LeetCode Platform Adapter', () => {
  const adapter = new LeetCodeAdapter();

  test('Matches valid problem URLs', () => {
    assert.strictEqual(adapter.matches('https://leetcode.com/problems/two-sum/'), true);
    assert.strictEqual(adapter.matches('https://leetcode.com/problems/reverse-linked-list/description/'), true);
    assert.strictEqual(adapter.matches('https://www.leetcode.com/problems/contains-duplicate'), true);
  });

  test('Does not match non-problem URLs', () => {
    assert.strictEqual(adapter.matches('https://leetcode.com/explore/'), false);
    assert.strictEqual(adapter.matches('https://leetcode.com/contest/'), false);
    assert.strictEqual(adapter.matches('https://google.com'), false);
  });
});
