import type { 
  HintLevel, 
  AlternativeSolution, 
  SimilarProblem,
  InteractiveCheckpoint,
  DiagramStep,
  LineBreakdown,
  ComplexityNote
} from '../../../../packages/shared/src/index.ts';

export interface SeedLadder {
  problemId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  edgeCases: string[];
  ladders: Record<HintLevel, { hintText: string; analogy?: string }>;
  checkpoints?: Partial<Record<HintLevel, InteractiveCheckpoint>>;
  diagrams?: Partial<Record<HintLevel, DiagramStep[]>>;
  fullCode?: string;
  lineBreakdowns?: LineBreakdown[];
  complexityNote?: ComplexityNote;
  alternativeSolutions: AlternativeSolution[];
  similarProblems: SimilarProblem[];
}

export const SEED_PROBLEM_LADDERS: Record<string, SeedLadder> = {
  // -------------------------------------------------------------------------
  // 1. Longest Substring Without Repeating Characters (LeetCode 3)
  // -------------------------------------------------------------------------
  'lc:longest-substring-without-repeating-characters': {
    problemId: 'lc:longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    edgeCases: [
      'Empty string s = "" -> Expected output is 0',
      'String with all identical characters s = "bbbbb" -> Longest unique substring is "b" (length 1)',
      'Substrings must be contiguous (e.g. in "pwwkew", "wke" is length 3; "pwke" is a subsequence, NOT a substring!)'
    ],
    ladders: {
      0: {
        hintText: `### Step 1: Understand the problem first

Given a string \`s\`, we need to find the length of the longest substring that contains no repeating characters.

**Let's understand two important terms:**
• **Substring:** A continuous sequence of characters from a string.
• **Without repeating characters:** Every character must appear only once in that substring.

**For example:**
\`s = "abcabcbb"\`

Possible substrings without repeating characters:
| Substring | Length |
|---|---|
| \`"a"\` | 1 |
| \`"ab"\` | 2 |
| \`"abc"\` | 3 |
| \`"bca"\` | 3 |
| \`"cab"\` | 3 |

The longest substring length is **3**. Expected output: **3**

**Think about this:**
If the input is \`"bbbbb"\`, can the answer be 5?
No, because every character is the same. We can only take one \`b\` at a time.
Therefore, the answer is 1.`
      },
      1: {
        hintText: `### Step 2: Think about the basic approach

Before jumping into an algorithm, let's think like a programmer.

Suppose \`s = "abcabcbb"\`. Imagine checking characters one by one:
1. Start with: \`"a"\` — Is \`'a'\` repeated? No.
2. Add next character: \`"ab"\` — Is \`'b'\` repeated? No.
3. Add next character: \`"abc"\` — Is \`'c'\` repeated? No.
4. Now add next character: \`"abca"\` — **What happened?**
We already have an \`'a'\`! So, we cannot keep \`"abca"\` as a valid substring.

**Question 1: What should we do when we encounter a duplicate character?**
Think about it before reading further. Choose the logical action in the checkpoint below:`,
        analogy: 'Imagine a camera frame expanding over a group photo. When a duplicate person enters from the right, slide the left border until everyone in the frame is unique again.'
      },
      2: {
        hintText: `### Step 3: Discover the Sliding Window technique

The problem can be efficiently solved using an algorithm called **Sliding Window**.
Don't worry about the name. Let's understand what it means:

Imagine a window that covers a portion of the string. We use two pointers:
• \`left\` — represents the starting position of our window.
• \`right\` — represents the ending position of our window.

Initially:
\`\`\`text
left
 ↓
 a b c a b c b b
 ↑
right
\`\`\`
Both pointers start at index 0.

**Our strategy:**
1. Move \`right\` forward to expand the window.
2. Check whether the new character is already present.
3. If it is repeated, move \`left\` forward until the window becomes valid.
4. Calculate the window length.
5. Keep track of the maximum length.

**The important formula is:**
$$\\text{Window Length} = \\text{right} - \\text{left} + 1$$

*Why +1?*
Because string indices start at zero. For example, if \`left = 1\` and \`right = 3\`, the substring is \`"bca"\`. Its length is: $3 - 1 + 1 = 3$.`
      },
      3: {
        hintText: `### Step 4: Dry run the algorithm

Let's work through \`s = "abcabcbb"\` together:
Initially: \`left = 0\`, \`right = 0\`, \`maxLength = 0\`. We move \`right\` one position at a time:

\`\`\`text
Iteration 1:
  Window: "a" (L=0, R=0) -> len: 1 -> max: 1
Iteration 2:
  Window: "ab" (L=0, R=1) -> len: 2 -> max: 2
Iteration 3:
  Window: "abc" (L=0, R=2) -> len: 3 -> max: 3
Iteration 4 (Important!):
  Char 'a' is DUPLICATE!
  Move left forward past the old 'a' (L moves 0 -> 1).
  New window: "bca" (L=1, R=3) -> len: 3 -> max: 3
\`\`\`

**Your turn:**
What happens when \`right\` moves to the next character \`'b'\`?
The current window is \`"bca"\`. The new character is \`'b'\`. \`'b'\` is already present!
Test your understanding in the interactive prediction quiz below:`
      },
      4: {
        hintText: `### Step 5 & 6: How to Detect Duplicates & Build the Algorithm Yourself

**How to detect duplicates efficiently:**
• **Approach 1 (Recommended for beginners): Using a Set.**
  A Set stores only unique elements (\`my_set = set()\`). Checking if a character exists (\`'a' in my_set\`) is instantaneous.
• **Approach 2: Using a Dictionary / Hash Map.**
  Stores each character alongside its most recent index. We recommend mastering the Set approach first!

**Step-by-step checklist to write your code:**
1. Create an empty Set (\`char_set = set()\`) to store characters in the current window.
2. Initialize \`left = 0\` and \`max_length = 0\`.
3. Start a \`for\` loop using \`right\` to traverse the string from index 0 to \`len(s) - 1\`.
4. While \`s[right]\` is in \`char_set\`: remove \`s[left]\` from the set and move \`left += 1\`.
5. Add \`s[right]\` into \`char_set\`.
6. Calculate current window length using \`right - left + 1\`.
7. Update \`max_length = max(max_length, right - left + 1)\`.
8. After the loop completes, return \`max_length\`.

\`\`\`python
char_set, left, max_len = set(), 0, 0
for right in range(len(s)):
    # TODO: while s[right] in char_set: shrink left
    max_len = max(max_len, right - left + 1)
\`\`\`

Test your understanding with the mini logic test below before writing your code!`
      },
      5: {
        hintText: `### Step 7 & 8: Full Solution & Line-by-Line Breakdown (Last Resort)

Here is the clean, simplest accepted Python solution followed by line-by-line annotations and alternative optimizations.`
      },
      6: {
        hintText: 'Mastered Sliding Window on substrings? Practice the related challenges below!'
      }
    },
    checkpoints: {
      1: {
        question: 'Question 1: What should we do when we encounter a duplicate character in our window?',
        options: [
          {
            text: 'A. Ignore the duplicate and continue adding characters.',
            isCorrect: false,
            feedback: 'Ignoring it violates the problem definition because the substring would contain duplicates.'
          },
          {
            text: 'B. Remove characters from the beginning until the duplicate is removed.',
            isCorrect: true,
            feedback: 'Correct! This gives us our first important idea: We need a way to expand and shrink our substring dynamically.'
          },
          {
            text: 'C. Stop the entire program.',
            isCorrect: false,
            feedback: 'Stopping early would lose longer valid substrings that might appear later in the string.'
          }
        ]
      },
      3: {
        question: 'When right points to the second "b" at index 4 (current window "bcab"), what must left do?',
        options: [
          {
            text: 'Move left past the first "b" at index 1 so the window becomes "cab" (length 3).',
            isCorrect: true,
            feedback: 'Spot on! We must keep moving left until the duplicate "b" is completely removed from the window.'
          },
          {
            text: 'Keep left at index 0.',
            isCorrect: false,
            feedback: 'Keeping left at 0 would leave two "b"s inside the window, which is invalid.'
          },
          {
            text: 'Reset left to index 4.',
            isCorrect: false,
            feedback: 'Resetting left to 4 unnecessarily discards valid unique characters "c" and "a".'
          }
        ]
      }
    },
    fullCode: `def lengthOfLongestSubstring(s: str) -> int:
    char_set = set()
    left = 0
    max_length = 0
    
    for right in range(len(s)):
        # If character is already in window, shrink from left
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
            
        char_set.add(s[right])
        max_length = max(max_length, right - left + 1)
        
    return max_length`,
    lineBreakdowns: [
      {
        line: 'char_set = set()',
        explanation: 'Maintains unique characters currently inside the active window for O(1) membership lookups.'
      },
      {
        line: 'while s[right] in char_set:',
        explanation: 'Detects duplicate characters in the active window. Runs until the earlier occurrence is removed.'
      },
      {
        line: 'char_set.remove(s[left]); left += 1',
        explanation: 'Shrinks the window from the left boundary, sliding past the duplicate character.'
      },
      {
        line: 'max_length = max(max_length, right - left + 1)',
        explanation: 'The current valid window spans from left to right inclusive. Updates the maximum window length observed.'
      }
    ],
    complexityNote: {
      time: 'O(N)',
      space: 'O(min(N, M))',
      rationale: 'Time: In the worst case, each character is visited at most twice (once by right pointer, once by left pointer), resulting in 2N steps = O(N). Space: The hash set stores at most min(N, M) elements, where M is the charset size (at most 128 for ASCII or 26 for English letters).'
    },
    alternativeSolutions: [
      {
        title: 'Optimized Hash Map (Direct Index Jumping)',
        technique: 'Hash Map with Index Storing',
        timeComplexity: 'O(N) single pass',
        spaceComplexity: 'O(min(N, M))',
        tradeOff: 'Instead of sliding left one-by-one with a while loop, store the last seen index of each char and jump left directly: left = max(left, char_map[char] + 1). Takes fewer iterations in practice.',
        codeSnippet: `def lengthOfLongestSubstring(s: str) -> int:
    char_map = {} # char -> last seen index
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in char_map and char_map[char] >= left:
            left = char_map[char] + 1
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len`
      }
    ],
    similarProblems: [
      {
        title: 'Longest Repeating Character Replacement',
        site: 'leetcode',
        slug: 'longest-repeating-character-replacement',
        difficulty: 'Medium',
        url: 'https://leetcode.com/problems/longest-repeating-character-replacement/',
        patternReason: 'Sliding window with character frequency tracking allowing at most k changes.'
      },
      {
        title: 'Minimum Window Substring',
        site: 'leetcode',
        slug: 'minimum-window-substring',
        difficulty: 'Hard',
        url: 'https://leetcode.com/problems/minimum-window-substring/',
        patternReason: 'Two-pointer sliding window that contracts when all target characters are matched.'
      },
      {
        title: 'Permutation in String',
        site: 'leetcode',
        slug: 'permutation-in-string',
        difficulty: 'Medium',
        url: 'https://leetcode.com/problems/permutation-in-string/',
        patternReason: 'Fixed-size sliding window comparing letter frequency counts.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // 2. Two Sum (LeetCode 1)
  // -------------------------------------------------------------------------
  'lc:two-sum': {
    problemId: 'lc:two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    edgeCases: [
      'Array contains negative numbers (e.g. nums = [-3, 4, 3, 90], target = 0)',
      'The exact same number appears twice and sums to target (e.g. [3, 3], target = 6)',
      'Large values near integer bounds where overflow must be guarded'
    ],
    ladders: {
      0: {
        hintText: `### Step 1: Understand the problem first

We are given an array of integers \`nums\` and an integer \`target\`. We must find the indices of the two distinct numbers that add up to \`target\`.

**Let's examine concrete examples:**
| Input \`nums\` | \`target\` | Matching Pair | Output Indices |
|---|---|---|---|
| \`[2, 7, 11, 15]\` | \`9\` | \`2 + 7 = 9\` | \`[0, 1]\` |
| \`[3, 2, 4]\` | \`6\` | \`2 + 4 = 6\` | \`[1, 2]\` |
| \`[3, 3]\` | \`6\` | \`3 + 3 = 6\` | \`[0, 1]\` |

**Think about this rule:**
You cannot use the exact same element at index \`i\` twice. If the input is \`[3, 3]\` and target is \`6\`, you must return \`[0, 1]\` using the two distinct positions.`
      },
      1: {
        hintText: `### Step 2: Think about the basic approach

Before jumping into code, let's think like a human problem solver.

Suppose \`nums = [2, 7, 11, 15]\` and \`target = 9\`:
1. Stand at the first number: \`2\`.
2. Ask yourself: *what companion number am I searching for to reach 9?*
   \`9 - 2 = 7\`! We need a \`7\`!
3. Walk forward to the next number: \`7\`.
4. Ask yourself: *is 7 the companion number we were looking for?* Yes! \`2 + 7 = 9\`!

**Question:** For any current number \`x\`, what mathematical calculation tells us the exact companion value we are looking for? Choose the answer in the checkpoint below:`,
        analogy: 'Imagine entering a coat check room where your claim ticket tells you the exact coat number you need to retrieve.'
      },
      2: {
        hintText: `### Step 3: Discover the Complement Rule & Memory Notebook

Instead of scanning all previous numbers over and over, imagine carrying a small pocket notebook (a **Dictionary / Hash Map**):

**The Complement Formula:**
For any number \`x\`, its companion partner is:
\`complement = target - x\`

**The Invariant on every step:**
1. Calculate \`complement = target - nums[i]\`.
2. Check if \`complement\` was already written down in your notebook.
3. If yes: you found the pair! Return \`[seen[complement], i]\`.
4. If no: write down \`seen[nums[i]] = i\` in your notebook and move forward.`
      },
      3: {
        hintText: `### Step 4: Dry run the algorithm

Let's trace \`nums = [2, 7, 11, 15]\`, \`target = 9\` step-by-step:

\`\`\`text
Step 0 (i=0, num=2):
  complement = 9 - 2 = 7
  Is 7 in notebook {}? No.
  Record seen[2] = 0. Notebook state: {2: 0}

Step 1 (i=1, num=7):
  complement = 9 - 7 = 2
  Is 2 in notebook {2: 0}? YES! Found at index 0.
  Matching pair confirmed at indices: [0, 1]!
\`\`\`

Test your understanding of partner complements in the mini-quiz below:`
      },
      4: {
        hintText: `### Step 5: Build the Algorithm Blueprint

**Complete these tasks:**
1. Initialize empty notebook \`seen = {}\`.
2. Loop through \`nums\` using \`enumerate(nums)\`.
3. Compute \`complement = target - num\`.
4. If \`complement in seen\`: return \`[seen[complement], i]\`.
5. Else: store \`seen[num] = i\`.

\`\`\`python
seen = {}
for i, num in enumerate(nums):
    # TODO: if target - num in seen: return [seen[target - num], i]
    seen[num] = i
\`\`\``
      },
      5: {
        hintText: `### Step 6: Full Solution & Line-by-Line Breakdown (Last Resort)

Here is the clean, simplest accepted Python solution followed by line-by-line annotations and complexity analysis.`
      },
      6: {
        hintText: 'Great solve! Practice the related hash-table challenges below.'
      }
    },
    checkpoints: {
      1: {
        question: 'When visiting nums[i] = x, what single mathematical calculation tells us the exact value we need to find?',
        options: [
          {
            text: 'target - x',
            isCorrect: true,
            feedback: 'Correct! Because x + y = target, rearranging gives y = target - x.'
          },
          {
            text: 'target + x',
            isCorrect: false,
            feedback: 'Adding x would find a value that sums to target + 2x, not target.'
          },
          {
            text: 'target / x',
            isCorrect: false,
            feedback: 'Two Sum asks for addition, not multiplication.'
          }
        ]
      },
      3: {
        question: 'If nums = [3, 2, 4] and target = 6, when i=0 (num=3), why does the hash map NOT immediately return [0, 0]?',
        options: [
          {
            text: 'Because we check if the complement (6 - 3 = 3) is in seen BEFORE adding nums[0] to seen.',
            isCorrect: true,
            feedback: 'Exactly right! Checking before insertion guarantees we never accidentally pair an element with itself.'
          },
          {
            text: 'Because 3 is an odd number.',
            isCorrect: false,
            feedback: 'Parity (even/odd) has nothing to do with hash table membership.'
          }
        ]
      }
    },
    fullCode: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {} # num -> index
    
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
        
    return []`,
    lineBreakdowns: [
      {
        line: 'seen = {}',
        explanation: 'Initializes an empty hash table where keys are numbers encountered so far and values are their array indices.'
      },
      {
        line: 'complement = target - num',
        explanation: 'Computes the required partner value such that num + complement == target.'
      },
      {
        line: 'if complement in seen: return [seen[complement], i]',
        explanation: 'Performs an average O(1) dictionary lookup. If found, returns the saved index and the current index.'
      },
      {
        line: 'seen[num] = i',
        explanation: 'Records the current element and its index so subsequent numbers can pair with it.'
      }
    ],
    complexityNote: {
      time: 'O(N)',
      space: 'O(N)',
      rationale: 'Time: We iterate through nums of length N once, with hash map lookups taking O(1) on average. Space: The hash map stores at most N elements in the worst case.'
    },
    alternativeSolutions: [
      {
        title: 'Two-Pointer Technique (Sorted Variant)',
        technique: 'Sorting + Two Pointers',
        timeComplexity: 'O(N log N)',
        spaceComplexity: 'O(N) to preserve indices',
        tradeOff: 'Works in O(1) space if the array is already sorted or if indices are not required, but takes O(N log N) time due to sorting.',
        codeSnippet: `pairs = sorted([(val, i) for i, val in enumerate(nums)])
left, right = 0, len(nums) - 1
while left < right:
    curr = pairs[left][0] + pairs[right][0]
    if curr == target: return [pairs[left][1], pairs[right][1]]
    elif curr < target: left += 1
    else: right -= 1`
      }
    ],
    similarProblems: [
      {
        title: 'Two Sum II - Input Array Is Sorted',
        site: 'leetcode',
        slug: 'two-sum-ii-input-array-is-sorted',
        difficulty: 'Medium',
        url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/',
        patternReason: 'Direct application of the Two-Pointer technique in constant O(1) space.'
      },
      {
        title: '3Sum',
        site: 'leetcode',
        slug: '3sum',
        difficulty: 'Medium',
        url: 'https://leetcode.com/problems/3sum/',
        patternReason: 'Sort array, fix one element, and reduce remaining subproblem to Two Sum.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // 3. Best Time to Buy and Sell Stock (LeetCode 121)
  // -------------------------------------------------------------------------
  'lc:best-time-to-buy-and-sell-stock': {
    problemId: 'lc:best-time-to-buy-and-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    edgeCases: [
      'Prices continuously decrease (e.g., [7, 6, 4, 3, 1]) -> Max profit must be 0, never negative',
      'Prices are identical across all days (e.g., [3, 3, 3, 3]) -> Max profit 0',
      'Minimum price occurs on the very last day (cannot buy in the future to sell in the past)'
    ],
    ladders: {
      0: {
        hintText: `### 1. Understand the Problem First
You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on day \`i\`. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell it. If you cannot make any profit, return 0.

**Concrete Examples:**
| Prices Array | Buy Day & Price | Sell Day & Price | Max Profit |
|---|---|---|---|
| \`[7, 1, 5, 3, 6, 4]\` | Day 1 ($1) | Day 4 ($6) | **$5** ($6 - $1) |
| \`[7, 6, 4, 3, 1]\` | None | None | **$0** (Prices only drop) |

*Thought-provoking question:* You cannot sell before you buy (time moves only forward). If you decide to sell on day $i$, what past price would yield the highest profit?`
      },
      1: {
        hintText: `### 2. Mental Simulation & Bottlenecks
Checking every pair of days $(i, j)$ with $j > i$ takes $O(N^2)$ comparisons. For $100,000$ days, that's $10^{10}$ operations—far too slow!
Instead, as you walk forward day by day, what single piece of historical information is all you need to remember?`,
        analogy: 'Imagine traveling through time keeping track in your pocket notebook of the absolute cheapest price you ever witnessed.'
      },
      2: {
        hintText: `### 3. Discover the Core Logic & Technique: One-Pass Running Invariant
As you iterate through each day:
$$\\text{Potential Profit Today} = \\text{price}[i] - \\text{lowest\\_price\\_seen\\_so\\_far}$$
Keep two simple variables:
1. \`min_price\`: The lowest price seen up to today.
2. \`max_profit\`: The highest profit observed so far.`
      },
      3: {
        hintText: `### 4. Dry Run & Pointer Diagram Tracing
Let's trace \`prices = [7, 1, 5, 3, 6, 4]\`:
\`\`\`text
Day 0 ($7): min_price = 7, max_profit = 0
Day 1 ($1): price < min_price -> New min_price = 1! max_profit = 0
Day 2 ($5): profit = 5 - 1 = 4. max_profit = max(0, 4) = 4
Day 3 ($3): profit = 3 - 1 = 2. max_profit remains 4
Day 4 ($6): profit = 6 - 1 = 5. max_profit = max(4, 5) = 5!
Day 5 ($4): profit = 4 - 1 = 3. max_profit remains 5
\`\`\`
Answer is 5!`
      },
      4: {
        hintText: `### 5. Build the Algorithm Blueprint
Fill in the blanks to write your own clean implementation:

\`\`\`python
min_price, max_profit = float('inf'), 0
for price in prices:
    # TODO: update min_price or calculate profit = price - min_price
    max_profit = max(max_profit, price - min_price)
\`\`\``
      },
      5: {
        hintText: `### 6. Full Solution & Line-by-Line Breakdown (Last Resort)
Here is the clean, simplest accepted Python solution followed by line-by-line annotations and alternative optimizations.`
      },
      6: {
        hintText: 'Great solve! Review multi-transaction stock variations below.'
      }
    },
    checkpoints: {
      1: {
        question: 'If prices = [2, 4, 1], why can we not buy at 1 and sell at 4 for a profit of 3?',
        options: [
          {
            text: 'Because day 2 (price 1) happens AFTER day 1 (price 4), and we cannot travel backward in time.',
            isCorrect: true,
            feedback: 'Exactly! Transactions must occur chronologically forward.'
          },
          {
            text: 'Because stock profits cannot exceed 2.',
            isCorrect: false,
            feedback: 'There is no limit on profit magnitude; chronological order is the only constraint.'
          }
        ]
      }
    },
    fullCode: `def maxProfit(prices: list[int]) -> int:
    min_price = float('inf')
    max_profit = 0
    
    for price in prices:
        if price < min_price:
            min_price = price
        elif price - min_price > max_profit:
            max_profit = price - min_price
            
    return max_profit`,
    lineBreakdowns: [
      {
        line: "min_price = float('inf')",
        explanation: 'Initializes the lowest price to infinity so the first day price is guaranteed to update it.'
      },
      {
        line: 'if price < min_price: min_price = price',
        explanation: 'Greedily captures new historical buying lows.'
      },
      {
        line: 'elif price - min_price > max_profit: max_profit = price - min_price',
        explanation: 'If sold today, calculates gain above the lowest historical buy and updates max profit.'
      }
    ],
    complexityNote: {
      time: 'O(N)',
      space: 'O(1)',
      rationale: 'Time: Single linear pass through the array. Space: Only two scalar variables (min_price, max_profit).'
    },
    alternativeSolutions: [
      {
        title: 'Kadane Difference Array Transformation',
        technique: 'Maximum Subarray',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        tradeOff: 'Converts daily changes (prices[i] - prices[i-1]) into a difference array and applies Kadanes algorithm.',
        codeSnippet: `max_curr = max_so_far = 0
for i in range(1, len(prices)):
    diff = prices[i] - prices[i-1]
    max_curr = max(0, max_curr + diff)
    max_so_far = max(max_so_far, max_curr)
return max_so_far`
      }
    ],
    similarProblems: [
      {
        title: 'Best Time to Buy and Sell Stock II',
        site: 'leetcode',
        slug: 'best-time-to-buy-and-sell-stock-ii',
        difficulty: 'Medium',
        url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/',
        patternReason: 'Unlimited transactions allowed: greedily capture every upward price slope.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // 4. Roman to Integer (LeetCode 13)
  // -------------------------------------------------------------------------
  'lc:roman-to-integer': {
    problemId: 'lc:roman-to-integer',
    title: 'Roman to Integer',
    difficulty: 'Easy',
    edgeCases: [
      'Single numeral e.g. "I" -> 1, "M" -> 1000',
      'Additive string with no subtractions e.g. "LVIII" -> 58',
      'Complex subtractive combinations e.g. "MCMXCIV" -> 1994'
    ],
    ladders: {
      0: {
        hintText: `### Step 1: Understand the problem
We are given a string containing Roman numerals. Our task is to convert that Roman numeral into its equivalent integer.

First, understand the seven Roman symbols:
| Roman symbol | Integer value |
|---|---|
| I | 1 |
| V | 5 |
| X | 10 |
| L | 50 |
| C | 100 |
| D | 500 |
| M | 1000 |

**For example:**
Input: \`"III"\`
\`I + I + I = 1 + 1 + 1 = 3\` -> Output: **3**

Another example:
Input: \`"LVIII"\`
\`L + V + III = 50 + 5 + 1 + 1 + 1 = 58\` -> Output: **58**

So far, this is straightforward: we convert each symbol into its corresponding number and add them.
**But there is one important condition!**`
      },
      1: {
        hintText: `### Step 2: Understand the subtraction rule
Roman numerals are generally written from largest to smallest (e.g. \`XVI = 10 + 5 + 1 = 16\`).

However, sometimes a smaller value appears before a larger value. In that situation, we need to subtract instead of adding.

Consider: **IV**
• \`I = 1\`, \`V = 5\`
Since I comes before V, we subtract: $5 - 1 = 4$. Therefore: \`IV = 4\`.

Let's understand all six subtraction combinations:
| Roman numeral | Calculation | Result |
|---|---|---|
| IV | 5 - 1 | 4 |
| IX | 10 - 1 | 9 |
| XL | 50 - 10 | 40 |
| XC | 100 - 10 | 90 |
| CD | 500 - 100 | 400 |
| CM | 1000 - 100 | 900 |

**Remember this important rule:**
• If current symbol is smaller than next symbol -> **SUBTRACT**.
• Otherwise -> **ADD**.
This is the core logic of the problem! Test your understanding below:`
      },
      2: {
        hintText: `### Step 3: Think about how to solve it
Before writing code, let's trace \`s = "MCMXCIV"\` (Expected answer: 1994).

First, each character's value:
\`M = 1000, C = 100, M = 1000, X = 10, C = 100, I = 1, V = 5\`

Instead of immediately adding everything, we compare each character with the character immediately after it:

| Current | Next | Condition | Action |
|---|---|---|---|
| M (1000) | C (100) | 1000 >= 100 | **+1000** |
| C (100) | M (1000) | 100 < 1000 | **-100** |
| M (1000) | X (10) | 1000 >= 10 | **+1000** |
| X (10) | C (100) | 10 < 100 | **-10** |
| C (100) | I (1) | 100 >= 1 | **+100** |
| I (1) | V (5) | 1 < 5 | **-1** |
| V (5) | None (end) | Last character | **+5** |

Now add everything:
$$1000 - 100 + 1000 - 10 + 100 - 1 + 5 = 1994$$
Expected output: **1994**`
      },
      3: {
        hintText: `### Step 4 & 5: Data Structure Needed & Traversal Logic

**Which data structure stores Roman symbols and their values?**
A **Dictionary / Hash Map**!
\`\`\`text
roman = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
\`\`\`
Why? Because \`roman[s[i]]\` provides instantaneous $O(1)$ value lookup.

**Traversal and Index Guard:**
We loop through each index \`i\`.
Current value: \`roman[s[i]]\`
Next value: \`roman[s[i + 1]]\`

**Wait! What happens at the last index?**
For \`"XIV"\` (length 3), the last index is 2. Accessing \`s[3]\` causes an IndexError!
**Crucial Rule:** Always check \`i + 1 < len(s)\` before comparing with the next character! Test your understanding below:`
      },
      4: {
        hintText: `### Step 6: Build the Actual Logic & Coding Challenge

**Complete these five tasks in your solution:**
1. Create the Roman symbol lookup dictionary.
2. Initialize \`total = 0\`.
3. Loop through indices \`i\` from \`0\` to \`len(s) - 1\`.
4. If \`i + 1 < len(s)\` and \`roman[s[i]] < roman[s[i + 1]]\`: subtract \`roman[s[i]]\`. Else: add \`roman[s[i]]\`.
5. Return \`total\`.

\`\`\`python
roman, total = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}, 0
for i in range(len(s)):
    # TODO: if i + 1 < len(s) and roman[s[i]] < roman[s[i+1]]: subtract else add
    total += ...
\`\`\``
      },
      5: {
        hintText: `### Full Solution & Line-by-Line Breakdown (Last Resort)
Here is the clean, simplest accepted Python solution followed by line-by-line annotations and complexity analysis.`
      },
      6: {
        hintText: 'Great solve! Practice related parsing and conversion challenges below.'
      }
    },
    checkpoints: {
      1: {
        question: 'In Roman numerals, if the current character has a smaller value than the character immediately following it (like "I" before "V"), what operation should be performed?',
        options: [
          {
            text: 'Subtract the current value (e.g. -1 + 5 = 4)',
            isCorrect: true,
            feedback: 'Exactly right! Whenever a smaller numeral precedes a larger numeral, it indicates subtraction.'
          },
          {
            text: 'Add both values together as usual',
            isCorrect: false,
            feedback: 'Adding them would yield 1 + 5 = 6 (which is VI, not IV).'
          },
          {
            text: 'Multiply both values',
            isCorrect: false,
            feedback: 'Roman numerals represent addition and subtraction, not multiplication.'
          }
        ]
      },
      3: {
        question: 'Why must we check "i + 1 < len(s)" before accessing s[i + 1] in our loop?',
        options: [
          {
            text: 'To avoid an IndexError when checking the final character of the string.',
            isCorrect: true,
            feedback: 'Spot on! The last character has no subsequent neighbor, so accessing s[i + 1] would throw an out-of-bounds error.'
          },
          {
            text: 'Because strings cannot have even lengths.',
            isCorrect: false,
            feedback: 'String length parity has nothing to do with index boundaries.'
          }
        ]
      }
    },
    fullCode: `def romanToInt(s: str) -> int:
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
        # If current numeral is smaller than the next, subtract it
        if i + 1 < n and roman[s[i]] < roman[s[i + 1]]:
            total -= roman[s[i]]
        else:
            total += roman[s[i]]
            
    return total`,
    lineBreakdowns: [
      {
        line: "roman = {'I': 1, 'V': 5...}",
        explanation: 'Lookup dictionary providing constant O(1) value lookup for each of the 7 Roman symbols.'
      },
      {
        line: 'for i in range(n):',
        explanation: 'Traverses each character in the string by index.'
      },
      {
        line: 'if i + 1 < n and roman[s[i]] < roman[s[i + 1]]:',
        explanation: 'Checks if next character exists AND whether current value is smaller than next (subtraction rule).'
      },
      {
        line: 'total -= roman[s[i]]',
        explanation: 'Applies subtraction rule (e.g. for IV, subtracts 1 before adding 5, yielding 4).'
      },
      {
        line: 'else: total += roman[s[i]]',
        explanation: 'Standard addition when symbols are non-increasing or at the final character.'
      }
    ],
    complexityNote: {
      time: 'O(N)',
      space: 'O(1)',
      rationale: 'Time: Single pass over string of length N with O(1) hash lookups. Space: Fixed 7-element dictionary consumes O(1) constant auxiliary memory.'
    },
    alternativeSolutions: [
      {
        title: 'Reverse Traversal (Right to Left)',
        technique: 'Backward Scanning',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        tradeOff: 'Scanning backwards: keep track of max_seen. If current < max_seen, subtract; else add and update max_seen. Avoids i + 1 boundary check.',
        codeSnippet: `total = max_val = 0
for ch in reversed(s):
    val = roman[ch]
    if val < max_val:
        total -= val
    else:
        total += val
        max_val = val
return total`
      }
    ],
    similarProblems: [
      {
        title: 'Integer to Roman',
        site: 'leetcode',
        slug: 'integer-to-roman',
        difficulty: 'Medium',
        url: 'https://leetcode.com/problems/integer-to-roman/',
        patternReason: 'The reverse transformation: greedily subtracting the largest possible Roman value.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // 5. Valid Parentheses (LeetCode 20)
  // -------------------------------------------------------------------------
  'lc:valid-parentheses': {
    problemId: 'lc:valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    edgeCases: [
      'Odd length string (e.g., "(()" or ")") -> An odd length can never be fully paired; return False immediately',
      'Closing bracket appears first with an empty stack (e.g., ")()") -> Must guard against popping from an empty stack',
      'Mismatched closing bracket type (e.g., "(]") -> Must return False immediately upon mismatch',
      'Unclosed opening brackets remaining at the end (e.g., "(((") -> Stack must be checked to be completely empty at completion'
    ],
    ladders: {
      0: {
        hintText: `### Step 1: Understand the problem first

Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

**A string is valid if and only if:**
1. Open brackets must be closed by the **same type** of bracket.
2. Open brackets must be closed in the **correct order** (the most recently opened bracket must be closed first!).
3. Every close bracket has a corresponding open bracket of the same type.

**Let's examine concrete examples:**
| Input String | Valid? | Why? |
|---|---|---|
| \`"()"\` | **True** | Opens \`(\`, closes with matching \`)\` |
| \`"()[]{}"\` | **True** | All three pairs open and close cleanly |
| \`"(]"\` | **False** | Opens with \`(\`, but attempts to close with \`]\` |
| \`"([)]"\` | **False** | Nested out of order! \`[\` was opened second, so it must close before \`(\` |
| \`"{[]}"\` | **True** | Correctly nested: \`[\` is inside \`{\` and closes first |

**Think about this:**
If the length of string \`s\` is odd (for example, \`s = "()("\`, length 3), can it ever be valid?
No! Every bracket requires an exact partner. If the length is odd, a pair is guaranteed missing. We can immediately return \`False\`!`
      },
      1: {
        hintText: `### Step 2: Think about the basic approach

Before jumping into code, let's think like a human problem solver.

Suppose \`s = "({[]})"\`.
Imagine reading characters one by one from left to right:
1. First character: \`'('\` — Opening bracket. Hold it in memory.
2. Second character: \`'{'\` — Opening bracket. Hold it in memory.
3. Third character: \`'['\` — Opening bracket. Hold it in memory.
4. Fourth character: \`']'\` — **A closing bracket!**

**What happened?**
When we encounter a closing bracket, which opening bracket does it need to match?
Does it match the first bracket we saw (\`'('\`), or does it match the **most recent** opening bracket we saw (\`'['\`)?

Think about it before reading further:
The most recently opened bracket MUST be closed first!`,
        analogy: 'Imagine a stack of cafeteria trays or plates. The last plate you place on top of the pile must be the first plate someone picks up!'
      },
      2: {
        hintText: `### Step 3: Discover the Stack data structure

In computer science, the principle where the **last item added is the first item removed** is called **LIFO** (Last In, First Out).

The perfect data structure for this is a **Stack**.
In Python, a standard list acts as a Stack:
• \`stack.append(item)\` pushes an item onto the top.
• \`stack.pop()\` removes the top item from the stack.

**The Invariant Rule:**
1. If we see an **open bracket** (\`'('\`, \`'{'\`, \`'['\`): push it onto our stack.
2. If we see a **close bracket** (\`')'\`, \`'}'\`, \`']'\`):
   • If the stack is empty: invalid (no matching opener)!
   • Pop the top item from the stack.
   • If the popped opener doesn't match our closer: invalid!

**Helper Dictionary:**
To make checking matches instant and clean, map each closing bracket to its matching opening bracket:
\`mapping = {')': '(', '}': '{', ']': '['}\``
      },
      3: {
        hintText: `### Step 4: Dry run the algorithm

Let's trace \`s = "{[]}"\` step-by-step:

\`\`\`text
Char 0: '{' -> Opening bracket -> stack.append('{') -> Stack: ['{']
Char 1: '[' -> Opening bracket -> stack.append('[') -> Stack: ['{', '[']
Char 2: ']' -> Closing bracket!
  Top of stack is '['.
  Does mapping[']'] == '['? YES! Matches!
  stack.pop() removes '[' -> Stack: ['{']
Char 3: '}' -> Closing bracket!
  Top of stack is '{'.
  Does mapping['}'] == '{'? YES! Matches!
  stack.pop() removes '{' -> Stack: []

End of string reached!
Stack is empty -> Result: True!
\`\`\`

**Two Critical Boundary Traps:**
1. What if \`s = ")"\`? We see a closing bracket, but the stack is empty! Trying to pop from an empty list crashes the program. We must check if the stack has items first.
2. What if \`s = "((("\`? We finish the entire string, but 3 openers were never closed. The stack still has items! The string is only valid if the stack is completely empty at the end (\`len(stack) == 0\`).`
      },
      4: {
        hintText: `### Step 5: Build the Algorithm Blueprint

**Complete these 5 tasks:**
1. If \`len(s) % 2 != 0\`, return \`False\` immediately.
2. Create matching dictionary \`mapping = {')': '(', '}': '{', ']': '['}\` and empty \`stack = []\`.
3. Loop through each character \`char\` in \`s\`.
4. If \`char in mapping\`: pop the top element (or a dummy value if empty) and check if it equals \`mapping[char]\`. If not, return \`False\`.
5. Else (it is an open bracket): \`stack.append(char)\`.
6. At the end, return \`len(stack) == 0\`.

\`\`\`python
mapping, stack = {')': '(', '}': '{', ']': '['}, []
for char in s:
    # TODO: if char in mapping: match stack.pop() else append
    pass
\`\`\``
      },
      5: {
        hintText: `### Step 6: Full Solution & Line-by-Line Breakdown (Last Resort)

Here is the clean, simplest accepted Python solution followed by line-by-line annotations and complexity analysis.`
      },
      6: {
        hintText: 'Well done! Mastered bracket matching? Practice similar stack problems below.'
      }
    },
    checkpoints: {
      1: {
        question: 'When reading a closing bracket like "}", which opening bracket in memory must it match?',
        options: [
          {
            text: 'The most recently opened bracket that has not yet been closed.',
            isCorrect: true,
            feedback: 'Spot on! This Last-In-First-Out (LIFO) property is why a Stack is the ideal data structure.'
          },
          {
            text: 'The very first open bracket encountered at index 0.',
            isCorrect: false,
            feedback: 'Nested brackets require closing innermost pairs first, not outermost first.'
          },
          {
            text: 'Any open bracket anywhere in the string.',
            isCorrect: false,
            feedback: 'Order matters strictly: "{ [ } ]" has matching pairs, but is invalid due to improper nesting order.'
          }
        ]
      },
      3: {
        question: 'If traversal finishes and the stack still contains ["("], what should our function return?',
        options: [
          {
            text: 'False, because an open bracket was left unclosed without a partner.',
            isCorrect: true,
            feedback: 'Correct! A valid string must have every open bracket closed, leaving the stack completely empty.'
          },
          {
            text: 'True, because all characters were traversed without throwing an error.',
            isCorrect: false,
            feedback: 'Traversing without an error is not enough—all opened brackets must be matched.'
          }
        ]
      }
    },
    fullCode: `def isValid(s: str) -> bool:
    # Quick guard: odd length strings can never be fully paired
    if len(s) % 2 != 0:
        return False
        
    # Map closing bracket to its required opening companion
    mapping = {')': '(', '}': '{', ']': '['}
    stack = []
    
    for char in s:
        # If the character is a closing bracket
        if char in mapping:
            # Pop the top opener if stack is not empty, otherwise assign dummy '#'
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            # It is an opening bracket: push onto stack
            stack.append(char)
            
    # Valid only if all opened brackets were successfully matched and closed
    return len(stack) == 0`,
    lineBreakdowns: [
      {
        line: 'if len(s) % 2 != 0: return False',
        explanation: 'Instant O(1) mathematical filter: every opener needs a closer, so valid strings always have even length.'
      },
      {
        line: "mapping = {')': '(', '}': '{', ']': '['}",
        explanation: 'Dictionary mapping closing brackets to their matching open counterparts for instantaneous O(1) comparison.'
      },
      {
        line: 'stack = []',
        explanation: 'Initializes an empty list used as a LIFO stack to remember unclosed opening brackets in arrival order.'
      },
      {
        line: "top_element = stack.pop() if stack else '#'",
        explanation: 'Pops the most recent open bracket. If stack is empty (e.g. string starts with ")"), safely defaults to dummy "#" to prevent IndexError.'
      },
      {
        line: 'if mapping[char] != top_element: return False',
        explanation: 'Verifies whether the popped open bracket matches the expected opener for this closing bracket.'
      },
      {
        line: 'return len(stack) == 0',
        explanation: 'Ensures no leftover unclosed brackets remain in the stack (e.g. for input "(((").'
      }
    ],
    complexityNote: {
      time: 'O(N)',
      space: 'O(N)',
      rationale: 'Time: Single pass over the string of length N. Space: In the worst case (e.g. "((((("), the stack stores up to N opening brackets.'
    },
    alternativeSolutions: [
      {
        title: 'String Replacement Simulation',
        technique: 'Brute Force Substring Elimination',
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(N)',
        tradeOff: 'Continuously replaces "()", "{}", and "[]" with "" until none remain. Simple to write (3 lines), but quadratic O(N^2) time due to repeated string copies.',
        codeSnippet: `while "()" in s or "{}" in s or "[]" in s:
    s = s.replace("()", "").replace("{}", "").replace("[]", "")
return s == ""`
      }
    ],
    similarProblems: [
      {
        title: 'Generate Parentheses',
        site: 'leetcode',
        slug: 'generate-parentheses',
        difficulty: 'Medium',
        url: 'https://leetcode.com/problems/generate-parentheses/',
        patternReason: 'Backtracking to generate all valid combinations of balanced parentheses.'
      },
      {
        title: 'Min Stack',
        site: 'leetcode',
        slug: 'min-stack',
        difficulty: 'Medium',
        url: 'https://leetcode.com/problems/min-stack/',
        patternReason: 'Deepens understanding of Stack push/pop mechanics with auxiliary state tracking.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // 6. Palindrome Number (LeetCode 9)
  // -------------------------------------------------------------------------
  'lc:palindrome-number': {
    problemId: 'lc:palindrome-number',
    title: 'Palindrome Number',
    difficulty: 'Easy',
    edgeCases: [
      'Negative numbers (e.g., -121) -> Backwards reads "121-", which is never equal to -121. Always False!',
      'Numbers ending in 0 (e.g., 10, 100) -> The first digit cannot be 0, so any number ending in 0 (except 0 itself) is False',
      'Single digit numbers (0 through 9) -> Always palindromes; return True',
      'Large integers without string conversion -> Reversing the full integer could cause 32-bit overflow; reversing only half avoids this completely'
    ],
    ladders: {
      0: {
        hintText: `### Step 1: Understand the problem first

Given an integer \`x\`, return \`True\` if \`x\` is a palindrome, and \`False\` otherwise.

**What is a Palindrome?**
An integer is a palindrome when it reads the **same backward as forward**.

**Let's test concrete examples:**
| Input \`x\` | Backward Representation | Palindrome? | Explanation |
|---|---|---|---|
| \`121\` | \`121\` | **True** | Reads 121 from left-to-right and right-to-left |
| \`-121\` | \`121-\` | **False** | The minus sign moves to the end, which does not match \`-121\` |
| \`10\` | \`01\` = \`1\` | **False** | Reading backward gives 01, which is 1, not 10 |
| \`0\` | \`0\` | **True** | A single zero is identical in reverse |

**Think about this rule:**
Can any negative number ever be a palindrome?
No! Because negative numbers start with a minus sign \`'-'\`, but integers never end with a minus sign. So all negative numbers are immediately \`False\`.`
      },
      1: {
        hintText: `### Step 2: Think about the basic approach

Before writing code, let's explore two ways to think about this:

**Way 1 (The Quick Way): String Conversion**
If we convert \`x\` to a string: \`s = str(x)\`.
Then we check if \`s == s[::-1]\` (string equals its reverse).
This works, but interviewers almost always ask: **"Can you solve it without converting the integer to a string?"**

**Way 2 (The Mathematical Way): Extracting Digits**
How do you extract digits from a number using basic math?
• To get the **last digit**: use the modulo operator \`x % 10\`.
  *Example:* \`123 % 10 = 3\` (the last digit is 3!).
• To **remove the last digit**: use integer division \`x // 10\`.
  *Example:* \`123 // 10 = 12\` (removes the 3, leaving 12!).

**Question 1:** If we want to build the reverse of a number digit-by-digit, what mathematical formula shifts previous digits to the left? Choose the answer in the checkpoint below:`,
        analogy: 'Think of an odometer rolling numbers backward: each time you add a new digit to the right, you multiply what you had before by 10 and add the new digit.'
      },
      2: {
        hintText: `### Step 3: Discover the "Reverse Half" Technique

Do we need to reverse the **entire** number?

If we reverse the entire 32-bit integer, the reversed number could be larger than the maximum integer size, causing an integer overflow!

Instead, we can reverse **only the second half** of the number:
• If the number is a palindrome, the **first half** will equal the **reversed second half**!
• For example: \`1221\` -> First half is \`12\`, second half reversed is \`12\`. They match!

**How do we know when we have reached the middle?**
As we divide \`x\` by 10 and multiply our reversed half by 10:
• \`x\` gets smaller on every step.
• \`reversed_half\` gets larger on every step.
• When \`x <= reversed_half\`, we have reached the middle!`
      },
      3: {
        hintText: `### Step 4: Dry run the algorithm

Let's dry run \`x = 1221\` step-by-step:

\`\`\`text
Initial state:
x = 1221, reversed_half = 0

Iteration 1:
  last_digit = 1221 % 10 = 1
  reversed_half = (0 * 10) + 1 = 1
  x = 1221 // 10 = 122
  Is x > reversed_half? (122 > 1) -> Yes, continue!

Iteration 2:
  last_digit = 122 % 10 = 2
  reversed_half = (1 * 10) + 2 = 12
  x = 122 // 10 = 12
  Is x > reversed_half? (12 > 12) -> No! Loop terminates!

Comparison:
  x == reversed_half -> 12 == 12 -> True!
\`\`\`

**What about odd-length numbers like 12321?**
At the end: \`x = 12\` and \`reversed_half = 123\`.
The middle digit (3) does not matter for symmetry!
We simply discard the middle digit: \`reversed_half // 10 = 123 // 10 = 12\`.
Since \`x == reversed_half // 10\` (12 == 12), it is a palindrome!`
      },
      4: {
        hintText: `### Step 5: Build the Algorithm Blueprint

**Complete these 5 tasks:**
1. Handle negative numbers and numbers ending in 0 (except 0 itself): \`if x < 0 or (x % 10 == 0 and x != 0): return False\`.
2. Initialize \`reversed_half = 0\`.
3. Loop \`while x > reversed_half\`:
   - \`reversed_half = reversed_half * 10 + x % 10\`
   - \`x //= 10\`
4. Compare \`x == reversed_half\` (for even length) or \`x == reversed_half // 10\` (for odd length).
5. Return the boolean result.

\`\`\`python
reversed_half = 0
while x > reversed_half:
    # TODO: reversed_half = reversed_half * 10 + x % 10; x //= 10
    pass
\`\`\``
      },
      5: {
        hintText: `### Step 6: Full Solution & Line-by-Line Breakdown (Last Resort)

Here is the clean, simplest accepted Python solution followed by line-by-line annotations and complexity analysis.`
      },
      6: {
        hintText: 'Great solve! Review math and two-pointer integer challenges below.'
      }
    },
    checkpoints: {
      1: {
        question: 'When appending digit d to an existing accumulated number, what mathematical expression shifts previous digits left by one decimal place?',
        options: [
          {
            text: 'accumulated * 10 + d',
            isCorrect: true,
            feedback: 'Exactly! Multiplying by 10 shifts decimal digits left (e.g. 1 * 10 + 2 = 12).'
          },
          {
            text: 'accumulated + d * 10',
            isCorrect: false,
            feedback: 'This scales only the incoming digit instead of shifting the accumulated prefix.'
          },
          {
            text: 'accumulated * d + 10',
            isCorrect: false,
            feedback: 'This multiplies the two values rather than shifting decimal places.'
          }
        ]
      },
      3: {
        question: 'Why does the loop terminate when x <= reversed_half?',
        options: [
          {
            text: 'Because we have processed exactly half of the digits in the number.',
            isCorrect: true,
            feedback: 'Spot on! Once the processed half is as large as or larger than the remaining half, we have reached the midpoint.'
          },
          {
            text: 'Because negative numbers were introduced.',
            isCorrect: false,
            feedback: 'Negative numbers were filtered out in the base condition before the loop.'
          }
        ]
      }
    },
    fullCode: `def isPalindrome(x: int) -> bool:
    # Negative numbers cannot be palindromes (e.g. -121 -> 121-)
    # Numbers ending in 0 (except 0 itself) cannot start with 0
    if x < 0 or (x % 10 == 0 and x != 0):
        return False
        
    reversed_half = 0
    
    # Reversing only the second half of the number
    while x > reversed_half:
        reversed_half = reversed_half * 10 + (x % 10)
        x //= 10
        
    # For even length: x == reversed_half (e.g. 1221 -> 12 == 12)
    # For odd length: x == reversed_half // 10 to discard middle digit (e.g. 12321 -> 12 == 123 // 10)
    return x == reversed_half or x == (reversed_half // 10)`,
    lineBreakdowns: [
      {
        line: 'if x < 0 or (x % 10 == 0 and x != 0): return False',
        explanation: 'Instantly eliminates negative numbers and multiples of 10 (like 10, 100), since non-zero numbers cannot start with 0.'
      },
      {
        line: 'while x > reversed_half:',
        explanation: 'Runs until we have processed half of the digits (at midpoint, x becomes less than or equal to reversed_half).'
      },
      {
        line: 'reversed_half = reversed_half * 10 + (x % 10)',
        explanation: 'Extracts the last digit of x with % 10 and appends it to reversed_half by shifting existing digits left with * 10.'
      },
      {
        line: 'x //= 10',
        explanation: 'Removes the last digit from x using integer floor division.'
      },
      {
        line: 'return x == reversed_half or x == (reversed_half // 10)',
        explanation: 'Checks symmetry: matches even-length halves directly, or ignores the odd-length middle digit with // 10.'
      }
    ],
    complexityNote: {
      time: 'O(log10(N))',
      space: 'O(1)',
      rationale: 'Time: We divide the input number by 10 on each iteration, processing only half the digits (at most log10(N)/2 iterations). Space: Only two integer variables, consuming O(1) auxiliary memory.'
    },
    alternativeSolutions: [
      {
        title: 'String Conversion Slice Check',
        technique: 'Two-Pointer / String Slicing',
        timeComplexity: 'O(log10(N))',
        spaceComplexity: 'O(log10(N)) for string allocation',
        tradeOff: 'Converts to string and compares with reversed slice: s = str(x); return s == s[::-1]. Very concise, but allocates extra memory for string conversion.',
        codeSnippet: `def isPalindrome(x: int) -> bool:
    s = str(x)
    return s == s[::-1]`
      }
    ],
    similarProblems: [
      {
        title: 'Reverse Integer',
        site: 'leetcode',
        slug: 'reverse-integer',
        difficulty: 'Medium',
        url: 'https://leetcode.com/problems/reverse-integer/',
        patternReason: 'Direct application of mathematical modulo extraction and 32-bit overflow guarding.'
      },
      {
        title: 'Valid Palindrome',
        site: 'leetcode',
        slug: 'valid-palindrome',
        difficulty: 'Easy',
        url: 'https://leetcode.com/problems/valid-palindrome/',
        patternReason: 'Two-pointer palindrome verification over alphanumeric string characters.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // 7. Reverse Linked List (LeetCode 206)
  // -------------------------------------------------------------------------
  'lc:reverse-linked-list': {
    problemId: 'lc:reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    edgeCases: [
      'Empty list (head == None) -> Return None immediately',
      'Single node list (head.next == None) -> Already reversed; return head',
      'Losing pointer references -> Overwriting curr.next before saving next node causes lost access to the rest of the list'
    ],
    ladders: {
      0: {
        hintText: `### Step 1: Understand the problem first

Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.

**What is a Linked List?**
Unlike an array where elements sit side-by-side in memory with indices, a linked list consists of **Nodes**. Each node holds:
1. \`val\`: The value or data of the node.
2. \`next\`: A reference (arrow) pointing to the next node in line.

**Let's see concrete examples:**
| Input Linked List | Reversed Output |
|---|---|
| \`1 -> 2 -> 3 -> 4 -> 5 -> None\` | \`5 -> 4 -> 3 -> 2 -> 1 -> None\` |
| \`1 -> 2 -> None\` | \`2 -> 1 -> None\` |
| \`None\` (Empty list) | \`None\` |

**Notice what changes:**
Every single arrow reverses direction!
Instead of \`1\` pointing to \`2\`, \`2\` must point to \`1\`.
And the original head (\`1\`) becomes the new tail pointing to \`None\`.`
      },
      1: {
        hintText: `### Step 2: Think about the basic approach

Suppose you have two nodes:
\`node1 -> node2 -> node3\`

You are standing at \`node1\`. You want to change its arrow to point backward to \`None\`:
\`node1.next = None\`

**What just happened?**
The arrow from \`node1\` to \`node2\` is gone!
Because you overwrote \`node1.next\`, you have completely lost your connection to \`node2\` and the rest of the list!

**Question 1:** Before changing where \`node1.next\` points, what MUST you do?
Think about it before looking below: You must temporarily remember \`node2\` in a variable before breaking the link!`,
        analogy: 'Imagine swinging from vine to vine in a jungle. Before letting go of your current vine, you must reach out and firmly grab the next vine with your other hand!'
      },
      2: {
        hintText: `### Step 3: Discover the 3-Pointer Technique

To reverse the list cleanly without losing nodes, we maintain **three pointers**:
1. \`prev\`: The node that came before (starts at \`None\`, because the old head points to \`None\`).
2. \`curr\`: The node we are currently standing on (starts at \`head\`).
3. \`next_temp\`: A temporary bookmark to save \`curr.next\` before we flip the arrow.

**The 4-Step Invariant on every node:**
1. **Bookmark:** \`next_temp = curr.next\` (save the future!)
2. **Reverse:** \`curr.next = prev\` (turn the arrow around!)
3. **Step Prev Forward:** \`prev = curr\`
4. **Step Curr Forward:** \`curr = next_temp\``
      },
      3: {
        hintText: `### Step 4: Dry run the algorithm

Let's trace a 3-node list \`1 -> 2 -> 3 -> None\`:

\`\`\`text
Initial:
prev = None
curr = Node(1)

Iteration 1:
  next_temp = curr.next (Node 2)
  curr.next = prev (Node 1 points to None)
  prev = Node 1
  curr = Node 2
  State: None <- 1    curr is at 2

Iteration 2:
  next_temp = curr.next (Node 3)
  curr.next = prev (Node 2 points to Node 1)
  prev = Node 2
  curr = Node 3
  State: None <- 1 <- 2    curr is at 3

Iteration 3:
  next_temp = curr.next (None)
  curr.next = prev (Node 3 points to Node 2)
  prev = Node 3
  curr = None
  State: None <- 1 <- 2 <- 3

Loop ends because curr is None!
\`\`\`

**Where is our new head?**
\`curr\` walked off the end and is \`None\`.
\`prev\` is standing on \`Node 3\`! So we simply return \`prev\`!`
      },
      4: {
        hintText: `### Step 5: Build the Algorithm Blueprint

**Complete these tasks:**
1. Initialize \`prev = None\` and \`curr = head\`.
2. While \`curr\` is not None:
   - Save \`next_node = curr.next\`
   - Flip pointer: \`curr.next = prev\`
   - Move \`prev = curr\`
   - Move \`curr = next_node\`
3. Return \`prev\` as the new head of the reversed list.

\`\`\`python
prev, curr = None, head
while curr:
    # TODO: next_temp = curr.next; curr.next = prev; prev = curr; curr = next_temp
    pass
\`\`\``
      },
      5: {
        hintText: `### Step 6: Full Solution & Line-by-Line Breakdown (Last Resort)

Here is the clean, simplest accepted Python solution followed by line-by-line annotations and complexity analysis.`
      },
      6: {
        hintText: 'Great solve! Review linked list manipulation challenges below.'
      }
    },
    checkpoints: {
      1: {
        question: 'Why must we save "curr.next" in a temporary variable before executing "curr.next = prev"?',
        options: [
          {
            text: 'Because overwriting curr.next destroys the reference to the remainder of the linked list.',
            isCorrect: true,
            feedback: 'Spot on! Once curr.next is reassigned, any unreferenced downstream nodes are lost.'
          },
          {
            text: 'Because Python requires all pointers to have aliases.',
            isCorrect: false,
            feedback: 'Python does not require aliases; saving the reference is purely an algorithmic necessity.'
          }
        ]
      },
      3: {
        question: 'When the while loop terminates (curr is None), which pointer points to the new head of the reversed list?',
        options: [
          {
            text: 'prev',
            isCorrect: true,
            feedback: 'Correct! curr has advanced past the end to None, leaving prev at the final original node (the new head).'
          },
          {
            text: 'curr',
            isCorrect: false,
            feedback: 'curr is None when the loop terminates.'
          },
          {
            text: 'head',
            isCorrect: false,
            feedback: 'head still points to the first original node, which is now the tail pointing to None.'
          }
        ]
      }
    },
    fullCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverseList(head: ListNode | None) -> ListNode | None:
    prev = None
    curr = head
    
    while curr is not None:
        # 1. Bookmark the next node so we don't lose the rest of the list
        next_temp = curr.next
        # 2. Reverse the active pointer
        curr.next = prev
        # 3. Advance prev to current
        prev = curr
        # 4. Advance curr to the bookmarked next node
        curr = next_temp
        
    # prev is now pointing to the new head of the reversed list
    return prev`,
    lineBreakdowns: [
      {
        line: 'prev = None; curr = head',
        explanation: 'Initializes prev to None (since the original head becomes the tail pointing to None) and curr to the list head.'
      },
      {
        line: 'while curr is not None:',
        explanation: 'Traverses each node until curr reaches the end (None).'
      },
      {
        line: 'next_temp = curr.next',
        explanation: 'Crucial step: saves reference to the subsequent node before curr.next is overwritten.'
      },
      {
        line: 'curr.next = prev',
        explanation: 'Reverses the link: points the current node backwards towards prev.'
      },
      {
        line: 'prev = curr; curr = next_temp',
        explanation: 'Advances both pointers one step forward along the original direction of the list.'
      },
      {
        line: 'return prev',
        explanation: 'Returns prev, which sits on the last visited node (the new head of the reversed list).'
      }
    ],
    complexityNote: {
      time: 'O(N)',
      space: 'O(1)',
      rationale: 'Time: Single pass visiting each of the N nodes once. Space: Uses only three pointer variables (prev, curr, next_temp), consuming strictly O(1) auxiliary space.'
    },
    alternativeSolutions: [
      {
        title: 'Recursive Reversal',
        technique: 'Call Stack Recursion',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N) call stack',
        tradeOff: 'Recursively walks to the tail, then flips pointers on the return unwinding: head.next.next = head; head.next = None. Elegant, but uses O(N) call stack memory.',
        codeSnippet: `def reverseList(head):
    if not head or not head.next:
        return head
    new_head = reverseList(head.next)
    head.next.next = head
    head.next = None
    return new_head`
      }
    ],
    similarProblems: [
      {
        title: 'Reverse Linked List II',
        site: 'leetcode',
        slug: 'reverse-linked-list-ii',
        difficulty: 'Medium',
        url: 'https://leetcode.com/problems/reverse-linked-list-ii/',
        patternReason: 'Reversing a specific sub-range [left, right] within a singly linked list.'
      },
      {
        title: 'Palindrome Linked List',
        site: 'leetcode',
        slug: 'palindrome-linked-list',
        difficulty: 'Easy',
        url: 'https://leetcode.com/problems/palindrome-linked-list/',
        patternReason: 'Combines fast/slow pointers to find midpoint with in-place linked list reversal.'
      }
    ]
  }
};
