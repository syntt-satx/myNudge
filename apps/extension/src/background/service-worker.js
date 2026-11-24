const API_ENDPOINTS = [
  'http://127.0.0.1:3003',
  'http://localhost:3003',
  'http://127.0.0.1:3002',
  'http://localhost:3002',
  'http://127.0.0.1:3001',
  'http://localhost:3001'
];

// Service worker message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_HINT') {
    handleHintRequest(message.payload)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => {
        console.error('[Nudge Background] Error in hint handler:', err);
        sendResponse({ success: true, data: getStandaloneProblemHint(message.payload) });
      });
    return true; // Keep message port open for async response
  }

  if (message.type === 'RECORD_SOLVE') {
    recordSolve(message.payload)
      .then((stats) => sendResponse({ success: true, stats }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'RECORD_MISTAKE') {
    recordMistake(message.payload)
      .then((journal) => sendResponse({ success: true, journal }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'DELETE_MISTAKE') {
    deleteMistake(message.payload?.id)
      .then((journal) => sendResponse({ success: true, journal }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'MARK_MISTAKE_MASTERED') {
    markMistakeMastered(message.payload?.id)
      .then((journal) => sendResponse({ success: true, journal }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'CLEAR_JOURNAL') {
    clearJournal()
      .then((journal) => sendResponse({ success: true, journal }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'SYNC_PROGRESS') {
    saveLocalProgress(message.payload)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

const CACHE_VERSION = 'v3_masterclass';

// Purge any stale hints from earlier versions on extension start
chrome.runtime.onInstalled?.addListener(async () => {
  try {
    const all = await chrome.storage.local.get(null);
    const staleKeys = Object.keys(all).filter(k => k.startsWith('nudge_hint_') && !k.startsWith(`nudge_hint_${CACHE_VERSION}_`));
    if (staleKeys.length > 0) {
      await chrome.storage.local.remove(staleKeys);
      console.log(`[Nudge Background] Removed ${staleKeys.length} legacy cached hints.`);
    }
  } catch (e) {}
});

async function handleHintRequest(payload) {
  const cacheKey = `nudge_hint_${CACHE_VERSION}_${payload.problemId}_lvl_${payload.level}${payload.isRephrase ? '_rephrase' : ''}`;

  // Check local chrome storage cache first
  try {
    const cached = await chrome.storage.local.get([cacheKey]);
    if (cached && cached[cacheKey] && !payload.isRephrase) {
      return cached[cacheKey];
    }
  } catch (e) {}

  // Attempt fetch across local candidate endpoints
  for (const endpoint of API_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      const response = await fetch(`${endpoint}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        try {
          await chrome.storage.local.set({ [cacheKey]: data });
        } catch (e) {}
        return data;
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.warn(`[Nudge Background] API responded with ${response.status} at ${endpoint}:`, errJson.error || errJson);
      }
    } catch (e) {}
  }

  // Graceful standalone fallback with problem-tailored logic
  const fallback = getStandaloneProblemHint(payload);
  try {
    await chrome.storage.local.set({ [cacheKey]: fallback });
  } catch (e) {}
  return fallback;
}

function getRephraseInfo(slug, level) {
  const map = {
    'roman-to-integer': {
      analogy: "Think of Roman numerals like paying with coins where someone hands you a nickel with a penny placed on top ($5 - 1 = 4$). Normally values decrease left to right. But whenever a smaller coin appears immediately before a larger coin, it represents a subtraction combo!",
      simplerAngle: "Compare each character with the one right after it:\n• If `current < next` → **SUBTRACT** current value.\n• Otherwise → **ADD** current value.\n• For the last character, always add it because there is no character after it.",
      bottleneckTakeaway: "Subtract if current symbol < next symbol; otherwise add!"
    },
    'longest-substring-without-repeating-characters': {
      analogy: "Imagine a caterpillar crawling along a branch. The caterpillar's head (`right`) moves forward eating letters. If it eats a letter already inside its stomach, its tail (`left`) crawls forward and expels letters until the stomach has no duplicates!",
      simplerAngle: "Use two pointers (`left` and `right`) and a Set. Expand `right`. If `s[right]` is already in the set, shrink `left` with a while loop until the duplicate is evicted. Valid window length is always `right - left + 1`.",
      bottleneckTakeaway: "Window length is `right - left + 1`; shrink `left` with a while loop when a duplicate appears."
    },
    'two-sum': {
      analogy: "Imagine shopping with a $10 gift card. You pick up an item costing $3. What exact partner item are you searching for? Exactly $7 ($10 - 3$). Instead of comparing every pair in the store, keep a notepad of items seen so far.",
      simplerAngle: "For each number `x`, its required complement is `target - x`. Check your dictionary: have we seen `target - x` previously? If yes, return the pair of indices! If no, record `seen[x] = index` and continue.",
      bottleneckTakeaway: "Dictionary lookup is instant O(1); search for `target - num` as you scan."
    },
    'best-time-to-buy-and-sell-stock': {
      analogy: "Imagine you have a time machine that can only travel forward. Every day, you remember the lowest price seen so far. If you sold today, your profit would be `today - lowest_seen`. Keep track of the highest profit ever seen!",
      simplerAngle: "In a single loop: update `min_price = min(min_price, price)` and `max_profit = max(max_profit, price - min_price)`. You never need to look backwards or run nested loops.",
      bottleneckTakeaway: "Track the minimum price seen so far and update profit in one single pass."
    },
    'valid-parentheses': {
      analogy: "Imagine stacking cafeteria trays in a spring-loaded cylinder. Opening brackets `(`, `[`, `{` go in. When a closing bracket comes along, the tray currently on TOP of the cylinder MUST match it. If the cylinder is empty or doesn't match, it's invalid!",
      simplerAngle: "Push opening brackets onto a stack. When a closing bracket arrives, check `stack.pop()`. If it doesn't match the closing bracket or stack was empty, return False. At the end, return `len(stack) == 0`.",
      bottleneckTakeaway: "A stack enforces Last-In First-Out (LIFO); closing brackets must match the stack's top."
    },
    'palindrome-number': {
      analogy: "Negative numbers like -121 can never be palindromes because the '-' symbol has no partner on the right. For positive numbers, imagine reading the digits in a mirror: reversing the digits produces the exact same number.",
      simplerAngle: "Check negative numbers first (`x < 0` → False). For positive numbers, reverse the integer digits mathematically or compare `str(x) == str(x)[::-1]`.",
      bottleneckTakeaway: "Negative numbers and numbers ending in 0 (except 0 itself) are never palindromes."
    },
    'reverse-linked-list': {
      analogy: "Imagine a conga line where each person has their hands on the shoulders of the person in front. To reverse the line, each person lets go and turns around to place their hands on the person behind them (`prev`).",
      simplerAngle: "Keep 3 pointers: `prev = None`, `curr = head`. Save `next_node = curr.next`, point `curr.next = prev`, advance `prev = curr`, advance `curr = next_node`. Return `prev`.",
      bottleneckTakeaway: "Save `curr.next` before reversing the arrow so you don't break the chain!"
    }
  };

  if (map[slug]) return map[slug];

  let analogy = "Imagine breaking the problem into a step-by-step physical simulation before writing any code.";
  let simplerAngle = "Focus on what state you need to track across each step. Trace the smallest possible example with pen and paper.";
  let takeaway = "Identify the state invariant that must hold true after each iteration.";

  if (slug.includes('sum') || slug.includes('map')) {
    analogy = "Think of a hash table like a personal memory notebook. Whenever you examine an element, check if its matching complement is already written down.";
    simplerAngle = "Store values in a dictionary to get instantaneous O(1) lookups instead of nested loops.";
    takeaway = "Trade O(N) memory for O(1) lookups using a Hash Map.";
  } else if (slug.includes('pointer') || slug.includes('window')) {
    analogy = "Think of an expanding and shrinking rubber band with two fingers (`left` and `right`) sliding across the array.";
    simplerAngle = "Move `right` to include elements; shrink `left` only when a constraint is violated.";
    takeaway = "Two pointers eliminate redundant re-scans, keeping the runtime linear O(N).";
  }

  return { analogy, simplerAngle, bottleneckTakeaway: takeaway };
}

function getStandaloneProblemHint(payload) {
  const { problemId, level, isRephrase = false } = payload;
  const slug = (problemId || 'lc:two-sum').replace(/^[a-z]+:/, '');
  const raw = _getStandaloneProblemHintRaw(payload);
  const rephrase = getRephraseInfo(slug, level);
  return {
    ...raw,
    isRephrase: Boolean(isRephrase),
    analogy: rephrase.analogy,
    simplerAngle: rephrase.simplerAngle,
    bottleneckTakeaway: rephrase.bottleneckTakeaway
  };
}

// Embedded problem-specific guidance for standalone / offline capability
function _getStandaloneProblemHintRaw(payload) {
  const { problemId, level, personality = 'cheerleader', confirmLastResort = false } = payload;
  const slug = (problemId || 'lc:two-sum').replace(/^[a-z]+:/, '');
  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // 1. Longest Substring Without Repeating Characters
  if (slug === 'longest-substring-without-repeating-characters') {
    const hints = [
      "### Step 1: Understand the problem first\n\nGiven a string `s`, we need to find the length of the longest substring that contains no repeating characters.\n\n**Let's understand two important terms:**\n• **Substring:** A continuous sequence of characters from a string.\n• **Without repeating characters:** Every character must appear only once in that substring.\n\n**For example:**\n`s = \"abcabcbb\"`\n\nPossible substrings without repeating characters:\n| Substring | Length |\n|---|---|\n| `\"a\"` | 1 |\n| `\"ab\"` | 2 |\n| `\"abc\"` | 3 |\n| `\"bca\"` | 3 |\n| `\"cab\"` | 3 |\n\nThe longest substring length is **3**. Expected output: **3**\n\n**Think about this:**\nIf the input is `\"bbbbb\"`, can the answer be 5?\nNo, because every character is the same. We can only take one `b` at a time. Therefore, the answer is 1.",
      "### Step 2: Think about the basic approach\n\nBefore jumping into an algorithm, let's think like a programmer.\n\nSuppose `s = \"abcabcbb\"`. Imagine checking characters one by one:\n1. Start with: `\"a\"` — Is `'a'` repeated? No.\n2. Add next: `\"ab\"` — Is `'b'` repeated? No.\n3. Add next: `\"abc\"` — Is `'c'` repeated? No.\n4. Now add next: `\"abca\"` — **What happened?**\nWe already have an `'a'`! So, we cannot keep `\"abca\"` as a valid substring.\n\n**Question 1: What should we do when we encounter a duplicate character?**\nThink about it before reading further. Choose the logical action in the checkpoint below:",
      "### Step 3: Discover the Sliding Window technique\n\nThe problem can be efficiently solved using an algorithm called **Sliding Window**.\nDon't worry about the name. Let's understand what it means:\n\nImagine a window that covers a portion of the string. We use two pointers:\n• `left` — represents the starting position of our window.\n• `right` — represents the ending position of our window.\n\nInitially:\n```text\nleft\n ↓\n a b c a b c b b\n ↑\nright\n```\nBoth pointers start at index 0.\n\n**Our strategy:**\n1. Move `right` forward to expand the window.\n2. Check whether the new character is already present.\n3. If it is repeated, move `left` forward until the window becomes valid.\n4. Calculate the window length.\n5. Keep track of the maximum length.\n\n**The important formula is:**\nWindow Length = right - left + 1\n*Why +1?* Because string indices start at zero. For example, if left = 1 and right = 3, substring is \"bca\", length is 3 - 1 + 1 = 3.",
      "### Step 4: Dry run the algorithm\n\nLet's work through `s = \"abcabcbb\"` together:\nInitially: `left = 0`, `right = 0`, `maxLength = 0`. Move `right` one position at a time:\n\n```text\nIteration 1: Window: \"a\" (L=0, R=0) -> len: 1 -> max: 1\nIteration 2: Window: \"ab\" (L=0, R=1) -> len: 2 -> max: 2\nIteration 3: Window: \"abc\" (L=0, R=2) -> len: 3 -> max: 3\nIteration 4 (Important!): Char 'a' is DUPLICATE!\n  Move left forward past old 'a' (L moves 0 -> 1).\n  New window: \"bca\" (L=1, R=3) -> len: 3 -> max: 3\n```\n\n**Your turn:**\nWhat happens when right moves to the next character 'b'? The current window is \"bca\". 'b' is already present! Test your intuition below:",
      "### Step 5 & 6: How to Detect Duplicates & Build Algorithm Yourself\n\n**How to detect duplicates efficiently:**\n• **Approach 1 (Recommended for beginners): Using a Set.**\n  A Set stores only unique elements (`my_set = set()`). Checking `'a' in my_set` is instantaneous O(1).\n• **Approach 2: Using a Dictionary / Hash Map.**\n  Stores each character alongside its most recent index.\n\n**Step-by-step checklist to write your code:**\n1. Create empty Set (`char_set = set()`)\n2. Initialize `left = 0` and `max_length = 0`\n3. Start `for` loop using `right` traversing `0` to `len(s) - 1`\n4. While `s[right]` in `char_set`: remove `s[left]` and `left += 1`\n5. Add `s[right]` to `char_set`\n6. Calculate current window length using `right - left + 1`\n7. Update `max_length = max(max_length, right - left + 1)`\n8. Return `max_length`\n\n```python\nchar_set, left, max_len = set(), 0, 0\nfor right in range(len(s)):\n    # TODO: while s[right] in char_set: shrink left\n    max_len = max(max_len, right - left + 1)\n```",
      "### Step 7 & 8: Full Solution & Line-by-Line Breakdown (Last Resort)\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and alternative optimizations."
    ];

    return {
      problemId,
      level,
      levelName: ['Understand Problem', 'Mental Simulation', 'Core Logic', 'Dry Run Tracing', 'Algorithm Blueprint', 'Full Solution & Complexity'][level],
      hintText: hints[level],
      edgeCases: ['Empty string s = "" -> 0', 'All identical chars s = "bbbbb" -> 1', 'Substrings must be contiguous (in "pwwkew", "pwke" is a subsequence, NOT a substring!)'],
      checkpoint: level === 1 ? {
        question: 'When expanding the window and hitting a duplicate character at s[right], what should we do next?',
        options: [
          { text: 'Slide the left pointer forward, evicting characters until duplicate is removed.', isCorrect: true, feedback: 'Spot on! Both pointers only advance forward, keeping the entire traversal linear O(N).' },
          { text: 'Restart scanning from index 0 all over again.', isCorrect: false, feedback: 'Restarting from index 0 discards previous work and forces quadratic O(N^2) time.' },
          { text: 'Ignore the duplicate and keep counting.', isCorrect: false, feedback: 'The problem strictly forbids any repeating characters in the substring.' }
        ]
      } : (level === 3 ? {
        question: 'In Step 3 (s = "abcabcbb"), after evicting the first "a" and moving left to 1, what will happen at Step 4 (right=4, char="b")?',
        options: [
          { text: 'Window evicts first "b" (left moves to 2), window becomes "cab" with length 3.', isCorrect: true, feedback: 'Perfect! "b" was duplicate, so left moves past the older "b" to index 2.' },
          { text: 'Window length increases to 5 without shrinking.', isCorrect: false, feedback: 'Remember "b" was already in our set, so we must evict before advancing.' }
        ]
      } : undefined),
      fullCode: `def lengthOfLongestSubstring(s: str) -> int:
    char_set = set()
    left = 0
    max_length = 0
    
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
            
        char_set.add(s[right])
        max_length = max(max_length, right - left + 1)
        
    return max_length`,
      lineBreakdowns: [
        { line: 'char_set = set()', explanation: 'Maintains unique characters in active window for O(1) membership lookups.' },
        { line: 'while s[right] in char_set:', explanation: 'Detects duplicate characters in active window and runs until the duplicate is evicted.' },
        { line: 'char_set.remove(s[left]); left += 1', explanation: 'Shrinks window from left boundary, sliding past the duplicate character.' },
        { line: 'max_length = max(max_length, right - left + 1)', explanation: 'Calculates active window span and updates maximum length observed.' }
      ],
      complexityNote: {
        time: 'O(N)',
        space: 'O(min(N, M))',
        rationale: 'Time: Each character is visited at most twice (once by right, once by left) = 2N steps = O(N). Space: Set stores at most min(N, M) characters where M is alphabet size (128 for ASCII).'
      },
      alternativeSolutions: [
        {
          title: 'Optimized Hash Map Index-Jumping',
          technique: 'Hash Map with Last Seen Index',
          timeComplexity: 'O(N) single pass',
          spaceComplexity: 'O(min(N, M))',
          tradeOff: 'Instead of while loop evictions, stores char -> index and jumps left pointer directly: left = max(left, char_map[char] + 1).',
          codeSnippet: `char_map = {}\nleft = max_len = 0\nfor right, c in enumerate(s):\n    if c in char_map and char_map[c] >= left:\n        left = char_map[c] + 1\n    char_map[c] = right\n    max_len = max(max_len, right - left + 1)\nreturn max_len`
        }
      ],
      similarProblems: [
        { title: 'Longest Repeating Character Replacement', site: 'leetcode', slug: 'longest-repeating-character-replacement', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-repeating-character-replacement/', patternReason: 'Sliding window tracking character counts with k replacements.' },
        { title: 'Minimum Window Substring', site: 'leetcode', slug: 'minimum-window-substring', difficulty: 'Hard', url: 'https://leetcode.com/problems/minimum-window-substring/', patternReason: 'Contracts window as soon as all target characters are matched.' }
      ]
    };
  }

  // 2. Two Sum
  if (slug === 'two-sum') {
    const hints = [
      "### Step 1: Understand the problem first\n\nWe are given an array of integers `nums` and an integer `target`. We must find the indices of the two distinct numbers that add up to `target`.\n\n**Let's examine concrete examples:**\n| Input `nums` | `target` | Matching Pair | Output Indices |\n|---|---|---|---|\n| `[2, 7, 11, 15]` | `9` | `2 + 7 = 9` | `[0, 1]` |\n| `[3, 2, 4]` | `6` | `2 + 4 = 6` | `[1, 2]` |\n| `[3, 3]` | `6` | `3 + 3 = 6` | `[0, 1]` |\n\n**Think about this rule:**\nYou cannot use the exact same element at index `i` twice. If the input is `[3, 3]` and target is `6`, you must return `[0, 1]` using the two distinct positions.",
      "### Step 2: Think about the basic approach\n\nBefore jumping into code, let's think like a human problem solver.\n\nSuppose `nums = [2, 7, 11, 15]` and `target = 9`:\n1. Stand at the first number: `2`.\n2. Ask yourself: *what companion number am I searching for to reach 9?*\n   `9 - 2 = 7`! We need a `7`!\n3. Walk forward to the next number: `7`.\n4. Ask yourself: *is 7 the companion number we were looking for?* Yes! `2 + 7 = 9`!\n\n**Question:** For any current number `x`, what mathematical calculation tells us the exact companion value we are looking for? Choose the answer in the checkpoint below:",
      "### Step 3: Discover the Complement Rule & Memory Notebook\n\nInstead of scanning all previous numbers over and over, imagine carrying a small pocket notebook (a **Dictionary / Hash Map**):\n\n**The Complement Formula:**\nFor any number `x`, its companion partner is:\n`complement = target - x`\n\n**The Invariant on every step:**\n1. Calculate `complement = target - nums[i]`.\n2. Check if `complement` was already written down in your notebook.\n3. If yes: you found the pair! Return `[seen[complement], i]`.\n4. If no: write down `seen[nums[i]] = i` in your notebook and move forward.",
      "### Step 4: Dry run the algorithm\n\nLet's trace `nums = [2, 7, 11, 15]`, `target = 9` step-by-step:\n\n```text\nStep 0 (i=0, num=2):\n  complement = 9 - 2 = 7\n  Is 7 in notebook {}? No.\n  Record seen[2] = 0. Notebook state: {2: 0}\n\nStep 1 (i=1, num=7):\n  complement = 9 - 7 = 2\n  Is 2 in notebook {2: 0}? YES! Found at index 0.\n  Matching pair confirmed at indices: [0, 1]!\n```\n\nTest your understanding of partner complements in the mini-quiz below:",
      "### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. Initialize empty notebook `seen = {}`.\n2. Loop through `nums` using `enumerate(nums)`.\n3. Compute `complement = target - num`.\n4. If `complement in seen`: return `[seen[complement], i]`.\n5. Else: store `seen[num] = i`.\n\n```python\nseen = {}\nfor i, num in enumerate(nums):\n    # TODO: if target - num in seen: return [seen[target - num], i]\n    seen[num] = i\n```",
      "### Step 6: Full Solution & Line-by-Line Breakdown (Last Resort)\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and complexity analysis."
    ];

    return {
      problemId,
      level,
      levelName: ['Understand Problem First', 'Mental Simulation & Checkpoint', 'Core Logic & Technique', 'Dry Run & Interactive Testing', 'Algorithm Blueprint', 'Full Solution & Complexity'][level],
      hintText: hints[level] || hints[0],
      edgeCases: ['Array contains negative numbers', 'Exact duplicate numbers sum to target [3, 3] target=6', 'Large values near integer bounds'],
      checkpoint: level === 1 ? {
        question: 'When visiting nums[i] = x, what mathematical formula yields the partner value needed to reach target?',
        options: [
          { text: 'target - x', isCorrect: true, feedback: 'Correct! x + y = target rearranges to y = target - x.' },
          { text: 'target + x', isCorrect: false, feedback: 'Adding x gives target + 2x, not target.' }
        ]
      } : undefined,
      fullCode: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      lineBreakdowns: [
        { line: 'seen = {}', explanation: 'Initializes empty dictionary storing number -> index.' },
        { line: 'complement = target - num', explanation: 'Calculates the required partner value.' },
        { line: 'if complement in seen: return [seen[complement], i]', explanation: 'O(1) dictionary lookup for partner index.' },
        { line: 'seen[num] = i', explanation: 'Saves current number so later numbers can pair with it.' }
      ],
      complexityNote: {
        time: 'O(N)',
        space: 'O(N)',
        rationale: 'Time: Single linear pass through nums. Space: Stores at most N items in dictionary.'
      },
      alternativeSolutions: [
        {
          title: 'Sorted Two-Pointer Variant',
          technique: 'Sorting + Two Pointers',
          timeComplexity: 'O(N log N)',
          spaceComplexity: 'O(N) to preserve indices',
          tradeOff: 'Works in O(1) space if the array is already sorted.',
          codeSnippet: `pairs = sorted([(v, i) for i, v in enumerate(nums)])\nl, r = 0, len(nums) - 1\nwhile l < r:\n    s = pairs[l][0] + pairs[r][0]\n    if s == target: return [pairs[l][1], pairs[r][1]]\n    elif s < target: l += 1\n    else: r -= 1`
        }
      ],
      similarProblems: [
        { title: 'Two Sum II - Input Array Is Sorted', site: 'leetcode', slug: 'two-sum-ii-input-array-is-sorted', difficulty: 'Medium', url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', patternReason: 'Direct application of Two-Pointer technique in O(1) space.' }
      ]
    };
  }

  // 3. Roman to Integer
  if (slug === 'roman-to-integer') {
    const hints = [
      "### Step 1: Understand the problem\n\nWe are given a string containing Roman numerals. Our task is to convert that Roman numeral into its equivalent integer.\n\nFirst, understand the seven Roman symbols:\n| Roman symbol | Integer value |\n|---|---|\n| I | 1 |\n| V | 5 |\n| X | 10 |\n| L | 50 |\n| C | 100 |\n| D | 500 |\n| M | 1000 |\n\n**For example:**\nInput: \"III\" -> 1 + 1 + 1 = 3 -> Output: 3\nInput: \"LVIII\" -> 50 + 5 + 1 + 1 + 1 = 58 -> Output: 58\n\nSo far, straightforward: convert each symbol and add. But there is one important condition!",
      "### Step 2: Understand the subtraction rule\n\nRoman numerals are generally written from largest to smallest (XVI = 10 + 5 + 1 = 16).\nHowever, when a smaller value appears BEFORE a larger value, we subtract instead of adding.\n\nConsider: **IV** (I = 1, V = 5). Since I is before V, subtract: 5 - 1 = 4 -> IV = 4.\n\nAll 6 subtraction combinations:\n| Pair | Calculation | Result |\n|---|---|---|\n| IV | 5 - 1 | 4 |\n| IX | 10 - 1 | 9 |\n| XL | 50 - 10 | 40 |\n| XC | 100 - 10 | 90 |\n| CD | 500 - 100 | 400 |\n| CM | 1000 - 100 | 900 |\n\n**Important Rule:** If current symbol < next symbol -> SUBTRACT. Otherwise -> ADD. This is the core logic!",
      "### Step 3: Think about how to solve it\n\nTracing `s = \"MCMXCIV\"` (Expected: 1994):\nValues: M=1000, C=100, M=1000, X=10, C=100, I=1, V=5.\nCompare each character with the next character:\n\n| Current | Next | Condition | Action |\n|---|---|---|---|\n| M (1000) | C (100) | 1000 >= 100 | +1000 |\n| C (100) | M (1000) | 100 < 1000 | -100 |\n| M (1000) | X (10) | 1000 >= 10 | +1000 |\n| X (10) | C (100) | 10 < 100 | -10 |\n| C (100) | I (1) | 100 >= 1 | +100 |\n| I (1) | V (5) | 1 < 5 | -1 |\n| V (5) | None (end) | Last char | +5 |\n\nTotal: 1000 - 100 + 1000 - 10 + 100 - 1 + 5 = 1994!",
      "### Step 4 & 5: Data Structure Needed & Traversal Logic\n\n**Data structure needed:** A Dictionary / Hash Map (`roman = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}`) for instantaneous O(1) value lookups.\n\n**Traversal & Index Guard:**\nLoop with index `i`:\n`current = roman[s[i]]`, `next = roman[s[i + 1]]`\n**Last Character Guard:** For \"XIV\" (len 3), last index is 2. `s[3]` causes IndexError! Always verify `i + 1 < len(s)` before checking the next value.",
      "### Step 6: Build the Actual Logic & Coding Challenge\n\n**Complete these five tasks:**\n1. Create the Roman symbol lookup dictionary.\n2. Initialize `total = 0`.\n3. Loop `i` from `0` to `len(s) - 1`.\n4. If `i + 1 < len(s)` and `roman[s[i]] < roman[s[i + 1]]`: `total -= roman[s[i]]`. Else: `total += roman[s[i]]`.\n5. Return `total`.\n\n```python\nroman = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}\ntotal, n = 0, len(s)\nfor i in range(n):\n    # TODO: if i + 1 < n and roman[s[i]] < roman[s[i+1]]: subtract else add\n    pass\n```",
      "### Full Solution & Line-by-Line Breakdown (Last Resort)\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and complexity analysis."
    ];

    return {
      problemId,
      level,
      levelName: ['Understand Problem First', 'Mental Simulation & Checkpoint', 'Core Logic & Technique', 'Dry Run & Interactive Testing', 'Algorithm Blueprint', 'Full Solution & Complexity'][level],
      hintText: hints[level] || hints[0],
      edgeCases: ['Single numeral "I" -> 1', 'Subtractive pairs "IV" -> 4, "IX" -> 9', 'Complex mixed numbers "MCMXCIV" -> 1994'],
      checkpoint: level === 1 ? {
        question: 'When a smaller Roman numeral appears immediately before a larger numeral (like "I" before "V"), what operation must be applied?',
        options: [
          { text: 'Subtract the current value (e.g. -1 + 5 = 4)', isCorrect: true, feedback: 'Correct! This subtraction rule is the central mechanism of Roman numerals.' },
          { text: 'Add both values together', isCorrect: false, feedback: 'Adding would produce 6 (VI), not 4 (IV).' },
          { text: 'Multiply both values', isCorrect: false, feedback: 'Multiplication is not used in Roman numeral notation.' }
        ]
      } : (level === 3 ? {
        question: 'Why must we verify "i + 1 < len(s)" before checking the next character?',
        options: [
          { text: 'To avoid an IndexError when processing the final character of the string.', isCorrect: true, feedback: 'Spot on! The last character has no subsequent neighbor.' },
          { text: 'Because strings cannot have odd lengths.', isCorrect: false, feedback: 'String parity is irrelevant to index boundaries.' }
        ]
      } : undefined),
      fullCode: `class Solution:
    def romanToInt(self, s: str) -> int:
        roman = {
            'I': 1,
            'V': 5,
            'X': 10,
            'L': 50,
            'C': 100,
            'D': 500,
            'M': 1000
        }
        total = 0
        n = len(s)
        
        for i in range(n):
            if i + 1 < n and roman[s[i]] < roman[s[i + 1]]:
                total -= roman[s[i]]
            else:
                total += roman[s[i]]
                
        return total`,
      lineBreakdowns: [
        { line: "roman = {'I': 1, 'V': 5...}", explanation: 'Dictionary mapping each Roman symbol to its integer value for O(1) lookups.' },
        { line: 'for i in range(n):', explanation: 'Iterates through each numeral by index.' },
        { line: 'if i + 1 < n and roman[s[i]] < roman[s[i + 1]]:', explanation: 'Checks if next character exists AND whether current value is smaller than next (subtraction rule).' },
        { line: 'total -= roman[s[i]]', explanation: 'Subtracts current numeral (e.g. I before V gives -1 + 5 = 4).' },
        { line: 'else: total += roman[s[i]]', explanation: 'Standard addition when numerals are in descending order or at the final character.' }
      ],
      complexityNote: {
        time: 'O(N)',
        space: 'O(1)',
        rationale: 'Time: Single pass through string of length N. Space: Fixed 7-element lookup dictionary consumes constant O(1) auxiliary memory.'
      },
      alternativeSolutions: [
        {
          title: 'Right-to-Left Reverse Traversal',
          technique: 'Backward Scanning with Max-Tracker',
          timeComplexity: 'O(N)',
          spaceComplexity: 'O(1)',
          tradeOff: 'Scanning backwards: if current < max_seen, subtract; else add and update max_seen. Eliminates the i + 1 boundary check.',
          codeSnippet: `total = max_seen = 0
for ch in reversed(s):
    val = roman[ch]
    if val < max_seen: total -= val
    else: total += val; max_seen = val
return total`
        }
      ],
      similarProblems: [
        { title: 'Integer to Roman', site: 'leetcode', slug: 'integer-to-roman', difficulty: 'Medium', url: 'https://leetcode.com/problems/integer-to-roman/', patternReason: 'The reverse transformation: greedily subtracting the largest possible Roman value.' }
      ]
    };
  }

  // 4. Best Time to Buy and Sell Stock
  if (slug === 'best-time-to-buy-and-sell-stock') {
    const hints = [
      "### Step 1: Understand the problem first\n\nYou are given an array `prices` where `prices[i]` is the price of a given stock on day `i`. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell it.\n\n**Let's examine concrete examples:**\n| Prices Array | Buy Day & Price | Sell Day & Price | Max Profit |\n|---|---|---|---|\n| `[7, 1, 5, 3, 6, 4]` | Day 1 ($1) | Day 4 ($6) | **$5** ($6 - $1) |\n| `[7, 6, 4, 3, 1]` | None | None | **$0** (Prices only decrease) |\n\n**Think about this:**\nYou cannot sell before you buy (time moves only forward). If you decide to sell on day i, what past price would yield the highest profit? The lowest price seen up to that day!",
      "### Step 2: Think about the basic approach\n\nBefore jumping into an algorithm, let's think like a human.\n\nSuppose `prices = [7, 1, 5, 3, 6, 4]`:\n1. Day 0 ($7): Lowest price so far is $7. Profit if sold today: $0.\n2. Day 1 ($1): Price drops to $1! Lowest price is now $1! Profit: $0.\n3. Day 2 ($5): If bought at record low ($1) and sold today ($5), profit is $4!\n4. Day 3 ($3): Profit: $3 - $1 = $2.\n5. Day 4 ($6): Profit: $6 - $1 = $5! New record high profit!\n\nNotice the pattern: as we walk forward, we only need to remember ONE thing from the past—the minimum price seen so far!",
      "### Step 3: Discover the One-Pass Running Invariant\n\nInstead of checking every pair of days with nested loops, maintain two scalar variables:\n• `min_price`: The lowest price seen up to today (starts at infinity).\n• `max_profit`: The highest profit observed so far (starts at 0).\n\n**The Invariant on every day:**\n1. If today's price is lower than `min_price`: update `min_price = price`.\n2. Otherwise, check `price - min_price`: if this profit exceeds `max_profit`, update `max_profit`!",
      "### Step 4: Dry run the algorithm\n\nLet's trace `prices = [7, 1, 5, 3, 6, 4]`:\n\n```text\nDay 0 ($7): min_price = 7, max_profit = 0\nDay 1 ($1): price < min_price -> New min_price = 1! max_profit = 0\nDay 2 ($5): profit = 5 - 1 = 4 -> max_profit = 4\nDay 3 ($3): profit = 3 - 1 = 2 -> max_profit remains 4\nDay 4 ($6): profit = 6 - 1 = 5 -> max_profit = 5!\nDay 5 ($4): profit = 4 - 1 = 3 -> max_profit remains 5\n```\n\nFinal max profit is **5**!",
      "### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. Initialize `min_price = float('inf')` and `max_profit = 0`.\n2. Loop through each `price` in `prices`.\n3. If `price < min_price`: update `min_price = price`.\n4. Else if `price - min_price > max_profit`: update `max_profit = price - min_price`.\n5. Return `max_profit`.\n\n```python\nmin_price, max_profit = float('inf'), 0\nfor price in prices:\n    # TODO: if price < min_price: min_price = price elif price - min_price > max_profit: update\n    max_profit = max(max_profit, price - min_price)\n```",
      "### Full Solution & Line-by-Line Breakdown (Last Resort)\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and complexity analysis."
    ];

    return {
      problemId,
      level,
      levelName: ['Understand Problem First', 'Mental Simulation & Checkpoint', 'Core Logic & Technique', 'Dry Run & Interactive Testing', 'Algorithm Blueprint', 'Full Solution & Complexity'][level],
      hintText: hints[level] || hints[0],
      edgeCases: ['Prices continuously decrease [7, 6, 4, 3, 1] -> 0', 'Prices identical [3, 3, 3] -> 0', 'Minimum price occurs on the last day'],
      checkpoint: level === 1 ? {
        question: 'If prices = [2, 4, 1], why can we not buy at 1 and sell at 4 for a profit of 3?',
        options: [
          { text: 'Because day 2 (price 1) happens AFTER day 1 (price 4), and we cannot travel backward in time.', isCorrect: true, feedback: 'Exactly! Transactions must occur chronologically forward.' },
          { text: 'Because stock profits cannot exceed 2.', isCorrect: false, feedback: 'There is no limit on profit magnitude; chronological order is the only constraint.' }
        ]
      } : undefined,
      fullCode: `def maxProfit(prices: list[int]) -> int:\n    min_price = float('inf')\n    max_profit = 0\n    \n    for price in prices:\n        if price < min_price:\n            min_price = price\n        elif price - min_price > max_profit:\n            max_profit = price - min_price\n            \n    return max_profit`,
      lineBreakdowns: [
        { line: "min_price = float('inf')", explanation: 'Initializes lowest price to infinity so day 1 price is guaranteed to update it.' },
        { line: 'if price < min_price: min_price = price', explanation: 'Greedily captures new historical buying lows.' },
        { line: 'elif price - min_price > max_profit: max_profit = price - min_price', explanation: 'If sold today, calculates gain above lowest historical buy and updates max profit.' }
      ],
      complexityNote: {
        time: 'O(N)',
        space: 'O(1)',
        rationale: 'Time: Single linear pass through the array. Space: Only two scalar variables (min_price, max_profit).'
      },
      alternativeSolutions: [
        { title: 'Kadane Difference Array Transformation', technique: 'Maximum Subarray', timeComplexity: 'O(N)', spaceComplexity: 'O(1)', tradeOff: 'Converts daily changes into a difference array and applies Kadanes algorithm.', codeSnippet: `max_curr = max_so_far = 0\nfor i in range(1, len(prices)):\n    diff = prices[i] - prices[i-1]\n    max_curr = max(0, max_curr + diff)\n    max_so_far = max(max_so_far, max_curr)\nreturn max_so_far` }
      ],
      similarProblems: [
        { title: 'Best Time to Buy and Sell Stock II', site: 'leetcode', slug: 'best-time-to-buy-and-sell-stock-ii', difficulty: 'Medium', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/', patternReason: 'Unlimited transactions allowed: greedily capture every upward price slope.' }
      ]
    };
  }

  // 5. Valid Parentheses
  if (slug === 'valid-parentheses') {
    const hints = [
      "### Step 1: Understand the problem first\n\nGiven a string `s` containing brackets `'()', '{}', '[]'`, determine if the string is valid.\n\n**A string is valid if:**\n1. Open brackets must be closed by the **same type** of bracket.\n2. Open brackets must be closed in the **correct order** (innermost opened first).\n3. Every close bracket has a matching open partner.\n\n**Concrete walkthrough:**\n| String | Valid? | Reason |\n|---|---|---|\n| `\"()\"` | **True** | Opens and closes cleanly |\n| `\"()[]{}\"` | **True** | All three pairs valid |\n| `\"(]\"` | **False** | Opens `(`, closes with mismatched `]` |\n| `\"([)]\"` | **False** | Nested out of order (`[` must close before `(`) |\n\n**Think about this:**\nIf the length of string `s` is odd, can it ever be valid? No! Return `False` immediately.",
      "### Step 2: Think about the basic approach\n\nImagine reading `s = \"({[]})\"` from left to right:\n1. Read `(`: open -> hold in memory.\n2. Read `{`: open -> hold in memory.\n3. Read `[`: open -> hold in memory.\n4. Read `]`: closing bracket! It must match the **most recent** open bracket (`[`). Does it match? Yes!\n\nThe most recently opened bracket must always close first!",
      "### Step 3: Discover the Stack (LIFO)\n\nIn computer science, storing elements where the **last item added is the first item removed** is called a **Stack** (LIFO).\nIn Python, a standard list acts as a Stack (`stack.append(x)` and `stack.pop()`).\n\n**The Invariant:**\nMap closers to openers: `mapping = {')': '(', '}': '{', ']': '['}`.\n• If char is open bracket: `stack.append(char)`.\n• If char is close bracket: check `stack.pop() == mapping[char]`.",
      "### Step 4: Dry run the algorithm\n\nLet's trace `s = \"{[]}\"`:\n\n```text\nChar '{' -> stack.append('{') -> Stack: ['{']\nChar '[' -> stack.append('[') -> Stack: ['{', '[']\nChar ']' -> Matches top '[' -> stack.pop() -> Stack: ['{']\nChar '}' -> Matches top '{' -> stack.pop() -> Stack: []\nEnd of string -> Stack is empty -> Valid!\n```\n\n**Boundary Trap:**\nIf `s = \")\"`, stack is empty when closer arrives! Always check if stack has items before popping.",
      "### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. If `len(s) % 2 != 0`, return `False`.\n2. Initialize `mapping = {')': '(', '}': '{', ']': '['}` and `stack = []`.\n3. For each char: if in mapping, pop top and compare; else append.\n4. Return `len(stack) == 0`.\n\n```python\nmapping, stack = {')': '(', '}': '{', ']': '['}, []\nfor char in s:\n    # TODO: if char in mapping: check pop != mapping[char] else append\n    pass\n```",
      "### Full Solution & Line-by-Line Breakdown (Last Resort)\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and complexity analysis."
    ];

    return {
      problemId,
      level,
      levelName: ['Understand Problem First', 'Mental Simulation & Checkpoint', 'Core Logic & Technique', 'Dry Run & Interactive Testing', 'Algorithm Blueprint', 'Full Solution & Complexity'][level],
      hintText: hints[level] || hints[0],
      edgeCases: ['Odd length string "(()" -> False', 'Premature closer with empty stack ")()" -> False', 'Unclosed openers at end "(((" -> False'],
      checkpoint: level === 1 ? {
        question: 'When reading a closing bracket like "}", which opening bracket in memory must it match?',
        options: [
          { text: 'The most recently opened bracket that has not yet been closed.', isCorrect: true, feedback: 'Spot on! This LIFO property is why a Stack is the ideal data structure.' },
          { text: 'The very first open bracket encountered at index 0.', isCorrect: false, feedback: 'Nested brackets require closing innermost pairs first.' }
        ]
      } : undefined,
      fullCode: `def isValid(s: str) -> bool:\n    if len(s) % 2 != 0:\n        return False\n    mapping = {')': '(', '}': '{', ']': '['}\n    stack = []\n    for char in s:\n        if char in mapping:\n            top_element = stack.pop() if stack else '#'\n            if mapping[char] != top_element:\n                return False\n        else:\n            stack.append(char)\n    return len(stack) == 0`,
      lineBreakdowns: [
        { line: 'if len(s) % 2 != 0: return False', explanation: 'Instant filter: valid strings always have even length.' },
        { line: "mapping = {')': '(', '}': '{', ']': '['}", explanation: 'Maps closing brackets to their matching open counterparts for O(1) comparison.' },
        { line: "top_element = stack.pop() if stack else '#'", explanation: 'Safely pops top opener without throwing IndexError on empty stack.' },
        { line: 'return len(stack) == 0', explanation: 'Verifies no unclosed open brackets remain.' }
      ],
      complexityNote: {
        time: 'O(N)',
        space: 'O(N)',
        rationale: 'Time: Single pass over the string of length N. Space: Stack stores up to N open brackets in worst case.'
      },
      alternativeSolutions: [
        { title: 'String Replacement Simulation', technique: 'Sub-string elimination', timeComplexity: 'O(N^2)', spaceComplexity: 'O(N)', tradeOff: 'Continuously replaces "()", "{}", "[]" with "". Simple, but quadratic time.', codeSnippet: 'while "()" in s or "{}" in s or "[]" in s:\n    s = s.replace("()", "").replace("{}", "").replace("[]", "")\nreturn s == ""' }
      ],
      similarProblems: [
        { title: 'Generate Parentheses', site: 'leetcode', slug: 'generate-parentheses', difficulty: 'Medium', url: 'https://leetcode.com/problems/generate-parentheses/', patternReason: 'Backtracking to generate valid bracket combinations.' }
      ]
    };
  }

  // 6. Palindrome Number
  if (slug === 'palindrome-number') {
    const hints = [
      "### Step 1: Understand the problem first\n\nGiven an integer `x`, return `True` if `x` is a palindrome, and `False` otherwise.\n\n**What is a Palindrome?**\nAn integer is a palindrome when it reads the **same backward as forward**.\n\n**Concrete Examples:**\n| Input `x` | Backward | Palindrome? |\n|---|---|---|\n| `121` | `121` | **True** |\n| `-121` | `121-` | **False** (minus sign at end) |\n| `10` | `01 = 1` | **False** |\n\n**Think about this rule:**\nCan any negative number be a palindrome? No! Negative numbers start with `-`, but integers never end with `-`. Always `False`!",
      "### Step 2: Think about the basic approach\n\nHow do we extract digits from an integer using basic math?\n• To get the **last digit**: `x % 10` (e.g. `123 % 10 = 3`).\n• To **remove the last digit**: `x // 10` (e.g. `123 // 10 = 12`).\n\nTo build the reverse of a number: `reversed = reversed * 10 + (x % 10)`!",
      "### Step 3: Discover the Reverse Half Technique\n\nDo we need to reverse the entire number?\nReversing the entire number could cause integer overflow for large 32-bit values.\n\nInstead, reverse **only the second half**:\n• For `1221`: first half is `12`, second half reversed is `12`. Equal!\n• When `x <= reversed_half`, we have reached the midpoint!",
      "### Step 4: Dry run the algorithm\n\nLet's trace `x = 1221`:\n\n```text\nInitial: x = 1221, reversed_half = 0\nStep 1: digit = 1 -> reversed_half = 1 -> x = 122\nStep 2: digit = 2 -> reversed_half = 12 -> x = 12\nStop: x (12) <= reversed_half (12)!\nComparison: 12 == 12 -> True!\n```\n\nFor odd length (e.g. 12321): compare `x == reversed_half // 10` to ignore middle digit 3.",
      "### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. If `x < 0 or (x % 10 == 0 and x != 0)`: return `False`.\n2. While `x > reversed_half`: `reversed_half = reversed_half * 10 + x % 10; x //= 10`.\n3. Return `x == reversed_half or x == reversed_half // 10`.\n\n```python\nreversed_half = 0\nwhile x > reversed_half:\n    # TODO: reversed_half = reversed_half * 10 + x % 10; x //= 10\n    pass\n```",
      "### Full Solution & Line-by-Line Breakdown (Last Resort)\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and complexity analysis."
    ];

    return {
      problemId,
      level,
      levelName: ['Understand Problem First', 'Mental Simulation & Checkpoint', 'Core Logic & Technique', 'Dry Run & Interactive Testing', 'Algorithm Blueprint', 'Full Solution & Complexity'][level],
      hintText: hints[level] || hints[0],
      edgeCases: ['Negative numbers -121 -> False', 'Numbers ending in zero 10, 100 -> False', 'Single digit 0 to 9 -> True'],
      checkpoint: level === 1 ? {
        question: 'When appending digit d to accumulated number, what mathematical formula shifts existing digits left by 1 decimal place?',
        options: [
          { text: 'accumulated * 10 + d', isCorrect: true, feedback: 'Exactly! Multiplying by 10 shifts decimal places left.' },
          { text: 'accumulated + d * 10', isCorrect: false, feedback: 'This scales only the incoming digit instead of shifting the accumulated prefix.' }
        ]
      } : undefined,
      fullCode: `def isPalindrome(x: int) -> bool:\n    if x < 0 or (x % 10 == 0 and x != 0):\n        return False\n    reversed_half = 0\n    while x > reversed_half:\n        reversed_half = reversed_half * 10 + (x % 10)\n        x //= 10\n    return x == reversed_half or x == (reversed_half // 10)`,
      lineBreakdowns: [
        { line: 'if x < 0 or (x % 10 == 0 and x != 0): return False', explanation: 'Eliminates negative numbers and multiples of 10.' },
        { line: 'while x > reversed_half:', explanation: 'Runs until reaching the numerical midpoint.' },
        { line: 'reversed_half = reversed_half * 10 + (x % 10)', explanation: 'Extracts and shifts decimal digits.' },
        { line: 'return x == reversed_half or x == (reversed_half // 10)', explanation: 'Checks symmetry for both even and odd digit lengths.' }
      ],
      complexityNote: {
        time: 'O(log10(N))',
        space: 'O(1)',
        rationale: 'Time: Processes half the decimal digits (at most log10(N)/2 iterations). Space: O(1) auxiliary integers.'
      },
      alternativeSolutions: [
        { title: 'String Conversion Slice', technique: 'Two-Pointer / Slicing', timeComplexity: 'O(log10(N))', spaceComplexity: 'O(log10(N))', tradeOff: 's = str(x); return s == s[::-1]. Very concise, but allocates string memory.', codeSnippet: 'def isPalindrome(x):\n    s = str(x)\n    return s == s[::-1]' }
      ],
      similarProblems: [
        { title: 'Reverse Integer', site: 'leetcode', slug: 'reverse-integer', difficulty: 'Medium', url: 'https://leetcode.com/problems/reverse-integer/', patternReason: 'Direct application of mathematical modulo extraction.' }
      ]
    };
  }

  // 7. Reverse Linked List
  if (slug === 'reverse-linked-list') {
    const hints = [
      "### Step 1: Understand the problem first\n\nGiven the `head` of a singly linked list, reverse the list, and return the reversed list.\n\n**Let's see concrete examples:**\n| Input Linked List | Reversed Output |\n|---|---|\n| `1 -> 2 -> 3 -> 4 -> 5 -> None` | `5 -> 4 -> 3 -> 2 -> 1 -> None` |\n| `1 -> 2 -> None` | `2 -> 1 -> None` |\n| `None` (Empty list) | `None` |\n\n**Notice what changes:**\nEvery pointer arrow reverses direction! `1` points to `None`, and `5` becomes the new head.",
      "### Step 2: Think about the basic approach\n\nSuppose you have `node1 -> node2 -> node3`.\nYou stand at `node1` and want to point it backward to `None` (`node1.next = None`).\n\n**What just happened?**\nYou overwrote `node1.next`, so you completely lost your connection to `node2` and the rest of the list!\n\n**The Rule:** Before changing `curr.next`, always save the next node in a temporary variable (`next_temp = curr.next`)!",
      "### Step 3: Discover the 3-Pointer Technique\n\nMaintain three pointers:\n• `prev`: node that came before (starts at `None`).\n• `curr`: node you are standing on (starts at `head`).\n• `next_temp`: bookmark to save `curr.next`.\n\n**The 4-Step Invariant on every node:**\n1. Bookmark: `next_temp = curr.next`\n2. Reverse: `curr.next = prev`\n3. Advance: `prev = curr`\n4. Advance: `curr = next_temp`",
      "### Step 4: Dry run the algorithm\n\nLet's trace `1 -> 2 -> 3 -> None`:\n\n```text\nInitial: prev = None, curr = 1\nStep 1: next_temp = 2 -> 1.next = None -> prev = 1 -> curr = 2\nStep 2: next_temp = 3 -> 2.next = 1 -> prev = 2 -> curr = 3\nStep 3: next_temp = None -> 3.next = 2 -> prev = 3 -> curr = None\nStop: curr is None!\nNew head is prev (3)!\n```\n\n**Boundary Trap:** When `curr` is `None`, return `prev` (not `curr` or `head`).",
      "### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. Initialize `prev = None` and `curr = head`.\n2. While `curr is not None`: bookmark `next_temp`, flip `curr.next = prev`, advance `prev = curr`, `curr = next_temp`.\n3. Return `prev`.\n\n```python\nprev, curr = None, head\nwhile curr:\n    # TODO: next_temp = curr.next; curr.next = prev; prev, curr = curr, next_temp\n    pass\n```",
      "### Full Solution & Line-by-Line Breakdown (Last Resort)\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and complexity analysis."
    ];

    return {
      problemId,
      level,
      levelName: ['Understand Problem First', 'Mental Simulation & Checkpoint', 'Core Logic & Technique', 'Dry Run & Interactive Testing', 'Algorithm Blueprint', 'Full Solution & Complexity'][level],
      hintText: hints[level] || hints[0],
      edgeCases: ['Empty list head == None -> None', 'Single node list head.next == None -> head', 'Preserving pointer references during link flipping'],
      checkpoint: level === 1 ? {
        question: 'Why must we save curr.next in a temporary variable before executing curr.next = prev?',
        options: [
          { text: 'Because overwriting curr.next destroys the reference to the remainder of the linked list.', isCorrect: true, feedback: 'Spot on! Once curr.next is reassigned, unreferenced downstream nodes are lost.' },
          { text: 'Because Python requires all pointers to have aliases.', isCorrect: false, feedback: 'Python does not require aliases; this is an algorithmic necessity.' }
        ]
      } : undefined,
      fullCode: `def reverseList(head):\n    prev = None\n    curr = head\n    while curr:\n        next_temp = curr.next\n        curr.next = prev\n        prev = curr\n        curr = next_temp\n    return prev`,
      lineBreakdowns: [
        { line: 'prev, curr = None, head', explanation: 'Initializes previous pointer to None and active pointer to head.' },
        { line: 'while curr:', explanation: 'Traverses each node until stepping past the end.' },
        { line: 'next_temp = curr.next', explanation: 'Bookmarks reference to downstream nodes before breaking forward pointer.' },
        { line: 'curr.next = prev; prev, curr = curr, next_temp', explanation: 'Redirects link backward and advances pointers.' }
      ],
      complexityNote: {
        time: 'O(N)',
        space: 'O(1)',
        rationale: 'Time: Single pass visiting each node once. Space: Uses only three pointer variables, consuming O(1) auxiliary space.'
      },
      alternativeSolutions: [
        { title: 'Recursive Reversal', technique: 'Call Stack Recursion', timeComplexity: 'O(N)', spaceComplexity: 'O(N) call stack', tradeOff: 'Recursively walks to the tail, then flips pointers on return. Elegant, but uses O(N) call stack memory.', codeSnippet: 'def reverseList(head):\n    if not head or not head.next: return head\n    new_head = reverseList(head.next)\n    head.next.next = head\n    head.next = None\n    return new_head' }
      ],
      similarProblems: [
        { title: 'Reverse Linked List II', site: 'leetcode', slug: 'reverse-linked-list-ii', difficulty: 'Medium', url: 'https://leetcode.com/problems/reverse-linked-list-ii/', patternReason: 'Reversing a specific sub-range within a linked list.' }
      ]
    };
  }

  // 8. Dynamic Archetype-Based Fallback
  const isStack = slug.includes('parenthes') || slug.includes('bracket') || slug.includes('stack') || slug.includes('temperature');
  const isSearch = slug.includes('search') || slug.includes('find') || slug.includes('binary');
  const isTwoPointer = slug.includes('palindrome') || slug.includes('container') || slug.includes('water');

  let archetypeTitle = 'Hash Map & Auxiliary State';
  let analogyText = 'Carrying a pocket notebook where you jot down items, letting you verify past elements instantly.';
  if (isStack) {
    archetypeTitle = 'Stack (LIFO)';
    analogyText = 'A stack of cafeteria trays: the last plate placed on top must be the first one picked up!';
  } else if (isSearch) {
    archetypeTitle = 'Binary Search (Logarithmic Division)';
    analogyText = 'Opening directly to the middle of a dictionary to eliminate half the pages on every flip.';
  } else if (isTwoPointer) {
    archetypeTitle = 'Two Pointers (Inward Convergence)';
    analogyText = 'Two friends starting at opposite ends of a bridge and walking inward until they meet.';
  }

  const dynamicHints = [
    `### Step 1: Understand the problem first\n\nIn "${title}", we need to process the input elements efficiently without redundant rescans.\n\n**Let's understand the core objective:**\n• Clearly identify the input format and expected output.\n• Walk through small sample inputs with pencil and paper before writing any code.\n\n**Think about this edge case:**\nWhat if the input is empty or has only a single element? What should your function return?`,
    `### Step 2: Think about the basic approach\n\nBefore jumping into code, let's think like a human problem solver.\n\nImagine inspecting elements one by one from start to finish:\n1. As you inspect each element: what state from earlier elements do you need to remember?\n2. What condition tells you that a solution or match has been found?\n\nChoose the logical action in the checkpoint below:`,
    `### Step 3: Discover the Core Technique: ${archetypeTitle}\n\nInstead of checking all pairs with nested loops, we apply **${archetypeTitle}**.\n\n**The Invariant Rule:**\nMaintain your active pointers or lookup state monotonically as you traverse, so each item is processed at most a constant number of times.`,
    `### Step 4: Dry run the algorithm\n\nLet's trace how the state evolves:\n\n\`\`\`text\nStep 1: Inspect first element -> Initialize state\nStep 2: Advance boundary -> Invariant holds\nStep 3: Target condition met -> Matching state confirmed!\n\`\`\`\n\n**Boundary Guard:**\nAlways verify index boundaries (e.g. index within range, collection not empty) before reading adjacent elements.`,
    `### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. Initialize state variables.\n2. Traverse elements in a single loop.\n3. Apply invariant condition.\n4. Return result.\n\n\`\`\`python\nstate = {}\nfor i, val in enumerate(data):\n    # TODO: if match(val, state): return result; state[val] = i\n    pass\n\`\`\``,
    `### Full Solution & Line-by-Line Breakdown (Last Resort)\n\nHere is the clean Python solution followed by line-by-line annotations and complexity analysis.`
  ];

  return {
    problemId,
    level,
    levelName: ['Understand Problem First', 'Mental Simulation & Checkpoint', 'Core Logic & Technique', 'Dry Run & Interactive Testing', 'Algorithm Blueprint', 'Full Solution & Complexity'][level],
    hintText: dynamicHints[level] || dynamicHints[0],
    analogy: analogyText,
    edgeCases: ['Empty input', 'Single element input', 'Duplicate or extreme values'],
    checkpoint: level === 1 ? {
      question: `For "${title}", what is the key invariant that avoids redundant quadratic iterations?`,
      options: [
        { text: 'Maintaining a monotonic pointer or hash record of historical state.', isCorrect: true, feedback: 'Exactly right! Storing visited state eliminates redundant rescans.' },
        { text: 'Restarting traversal from the beginning on every step.', isCorrect: false, feedback: 'Restarting from the beginning creates quadratic complexity.' }
      ]
    } : undefined,
    fullCode: `def solve_${slug.replace(/-/g, '_')}(data):\n    if not data:\n        return None\n    seen = {}\n    for i, item in enumerate(data):\n        if item in seen:\n            return (seen[item], i)\n        seen[item] = i\n    return None`,
    lineBreakdowns: [
      { line: 'if not data: return None', explanation: 'Base case guard against empty inputs.' },
      { line: 'seen = {}', explanation: 'Auxiliary memory for instantaneous O(1) lookups.' },
      { line: 'for i, item in enumerate(data):', explanation: 'Traverses each element in linear order.' }
    ],
    complexityNote: {
      time: 'O(N)',
      space: 'O(N)',
      rationale: 'Optimal single pass traversal with O(1) average lookup times.'
    },
    alternativeSolutions: [
      { title: 'Iterative vs. Recursive', technique: 'Traversal', timeComplexity: 'O(N)', spaceComplexity: 'O(1)', tradeOff: 'Iterative avoids call stack memory overhead.', codeSnippet: 'for x in data: pass' }
    ],
    similarProblems: [
      { title: `${title} II`, site: 'leetcode', slug: `${slug}-ii`, difficulty: 'Medium', url: `https://leetcode.com/problems/${slug}/`, patternReason: `Expands upon ${title}.` }
    ]
  };
}

// Real habit tracking & streak calculations in chrome.storage.local
async function recordSolve(payload) {
  const data = await chrome.storage.local.get(['nudge_user_settings']);
  let settings = data.nudge_user_settings || {
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalSolved: 0,
    solvedStats: { easy: 0, medium: 0, hard: 0 },
    patternMastery: {
      'Sliding Window': 0,
      'Two Pointers': 0,
      'Hash Map': 0,
      'Stack': 0,
      'Binary Search': 0
    },
    badges: [
      { id: 'b1', name: 'First Spark', icon: '✨', unlocked: false, desc: 'Solve your first problem' },
      { id: 'b2', name: 'Checkpoint Master', icon: '🎯', unlocked: false, desc: 'Ace 5 interactive checkpoints' },
      { id: 'b3', name: 'Pattern Explorer', icon: '🪟', unlocked: false, desc: 'Master core patterns' },
      { id: 'b4', name: '7-Day Flame', icon: '🔥', unlocked: false, desc: 'Maintain a 7-day streak' }
    ],
    solvedProblems: [],
    journal: []
  };

  const today = new Date().toISOString().split('T')[0];
  const lastDate = settings.lastActiveDate;

  if (lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (lastDate === yesterday) {
      settings.streak = (settings.streak || 0) + 1;
    } else {
      settings.streak = 1;
    }
    settings.lastActiveDate = today;
  }

  // Update problem count if not already solved
  const slug = (payload.problemId || '').replace(/^[a-z]+:/, '');
  const title = payload.title || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const alreadySolved = (settings.solvedProblems || []).some(p => 
    typeof p === 'string' ? p === payload.problemId : (p.slug === slug || p.canonicalId === payload.problemId)
  );

  if (!alreadySolved) {
    settings.solvedProblems = settings.solvedProblems || [];
    settings.solvedProblems.unshift({
      canonicalId: payload.problemId,
      slug: slug,
      title: title,
      difficulty: payload.difficulty || 'Medium',
      site: payload.site || 'leetcode',
      url: payload.url || `https://leetcode.com/problems/${slug}/`,
      solvedAt: new Date().toISOString(),
      nextRevisionDays: 1
    });
    settings.totalSolved = settings.solvedProblems.length;
    const diff = (payload.difficulty || 'Medium').toLowerCase();
    if (settings.solvedStats && settings.solvedStats[diff] !== undefined) {
      settings.solvedStats[diff] += 1;
    }

    // Dynamic pattern mastery increment
    let pat = 'Sliding Window';
    if (slug.includes('sum') || slug.includes('map')) pat = 'Hash Map';
    else if (slug.includes('search')) pat = 'Binary Search';
    else if (slug.includes('pointer')) pat = 'Two Pointers';
    
    settings.patternMastery = settings.patternMastery || {};
    settings.patternMastery[pat] = Math.min(100, (settings.patternMastery[pat] || 0) + 25);

    // Dynamic badge unlocks
    settings.badges = settings.badges || [];
    const b1 = settings.badges.find(b => b.id === 'b1');
    if (b1) b1.unlocked = true;
    if (settings.streak >= 7) {
      const b4 = settings.badges.find(b => b.id === 'b4');
      if (b4) b4.unlocked = true;
    }
  }

  await chrome.storage.local.set({ nudge_user_settings: settings });
  return settings;
}

async function recordMistake(payload) {
  const data = await chrome.storage.local.get(['nudge_user_settings']);
  let settings = data.nudge_user_settings || {};
  settings.journal = settings.journal || [];

  const newEntry = {
    id: payload.id || `m_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    problemTitle: payload.problemTitle || payload.problem || 'Algorithmic Problem',
    problem: payload.problemTitle || payload.problem || 'Algorithmic Problem',
    question: payload.question || 'Concept / Bottleneck',
    missedAnswer: payload.missedAnswer || '',
    correctAnswer: payload.correctAnswer || payload.takeaway || 'Key observation',
    takeaway: payload.takeaway || 'Reviewed and understood key algorithmic pattern.',
    date: new Date().toLocaleDateString(),
    recordedAt: new Date().toLocaleDateString(),
    mastered: false
  };

  settings.journal.unshift(newEntry);
  if (settings.journal.length > 80) settings.journal.pop();

  await chrome.storage.local.set({ nudge_user_settings: settings });
  return settings.journal;
}

async function deleteMistake(id) {
  const data = await chrome.storage.local.get(['nudge_user_settings']);
  let settings = data.nudge_user_settings || {};
  settings.journal = (settings.journal || []).filter(j => j.id !== id);
  await chrome.storage.local.set({ nudge_user_settings: settings });
  return settings.journal;
}

async function markMistakeMastered(id) {
  const data = await chrome.storage.local.get(['nudge_user_settings']);
  let settings = data.nudge_user_settings || {};
  settings.journal = (settings.journal || []).map(j => {
    if (j.id === id) return { ...j, mastered: !j.mastered };
    return j;
  });
  await chrome.storage.local.set({ nudge_user_settings: settings });
  return settings.journal;
}

async function clearJournal() {
  const data = await chrome.storage.local.get(['nudge_user_settings']);
  let settings = data.nudge_user_settings || {};
  settings.journal = [];
  await chrome.storage.local.set({ nudge_user_settings: settings });
  return [];
}

async function saveLocalProgress(payload) {
  const data = await chrome.storage.local.get(['attempts']);
  const attempts = data.attempts || [];
  attempts.push({ ...payload, timestamp: Date.now() });
  await chrome.storage.local.set({ attempts });
}
