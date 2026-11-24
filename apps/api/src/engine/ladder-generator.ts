import type { HintRequest, HintResponse, BuddyPersona, HintLevel, AlternativeSolution, SimilarProblem } from '../../../../packages/shared/src/index.ts';
import { LEVEL_NAMES, calculateXpEarned } from '../../../../packages/shared/src/index.ts';
import { SEED_PROBLEM_LADDERS } from '../db/seed-data.ts';
import { AntiLeakValidator } from '../validator/anti-leak-validator.ts';

export class LadderGeneratorEngine {
  /**
   * Generates or fetches a policy-compliant, problem-tailored hint ladder.
   */
  static async getHint(request: HintRequest): Promise<HintResponse> {
    const { problemId, level, personality = 'cheerleader', isRephrase = false, confirmLastResort = false } = request;

    if (level === 5 && !confirmLastResort) {
      throw new Error('Level 5 full explanation requires explicit confirmation.');
    }

    const seed = SEED_PROBLEM_LADDERS[problemId];
    let rawHintText = '';
    let analogy: string | undefined = undefined;
    let alternativeSolutions: AlternativeSolution[] | undefined = undefined;
    let similarProblems: SimilarProblem[] | undefined = undefined;
    let edgeCases: string[] | undefined = undefined;
    let checkpoint = undefined;
    let diagrams = undefined;
    let fullCode: string | undefined = undefined;
    let lineBreakdowns = undefined;
    let complexityNote = undefined;

    if (seed && seed.ladders[level]) {
      rawHintText = seed.ladders[level].hintText;
      analogy = seed.ladders[level].analogy;
      edgeCases = seed.edgeCases;
      checkpoint = seed.checkpoints?.[level];
      diagrams = seed.diagrams?.[level];
      if (level >= 5) {
        alternativeSolutions = seed.alternativeSolutions;
        similarProblems = seed.similarProblems;
        fullCode = seed.fullCode;
        lineBreakdowns = seed.lineBreakdowns;
        complexityNote = seed.complexityNote;
      }
    } else {
      // Dynamic Problem-Specific Heuristic Analyzer
      const dynamicLadder = this.generateDynamicProblemLadder(problemId, level);
      rawHintText = dynamicLadder.hintText;
      analogy = dynamicLadder.analogy;
      edgeCases = dynamicLadder.edgeCases;
      checkpoint = dynamicLadder.checkpoint;
      diagrams = dynamicLadder.diagrams;
      if (level >= 5) {
        alternativeSolutions = dynamicLadder.alternativeSolutions;
        similarProblems = dynamicLadder.similarProblems;
        fullCode = dynamicLadder.fullCode;
        lineBreakdowns = dynamicLadder.lineBreakdowns;
        complexityNote = dynamicLadder.complexityNote;
      }
    }

    // Personalize tone according to Buddy Persona
    const personalizedText = this.applyPersonaTone(rawHintText, personality, level, isRephrase);

    // Run Anti-Leak Safety Validator Gate
    const validation = AntiLeakValidator.validate(level, personalizedText);
    if (!validation.isValid) {
      console.error(`[AntiLeakValidator] Rejected Level ${level} hint:`, validation.reason);
      throw new Error(`Hint generation failed safety checks: ${validation.reason}`);
    }

    const xpPotential = calculateXpEarned(seed?.difficulty || 'Medium', level, 0);

    return {
      problemId,
      level,
      levelName: LEVEL_NAMES[level],
      hintText: personalizedText,
      analogy,
      cooldownSeconds: level === 5 ? 0 : 25,
      xpRewardPotential: xpPotential,
      cached: Boolean(seed),
      alternativeSolutions,
      similarProblems,
      edgeCases,
      checkpoint,
      diagrams,
      fullCode,
      lineBreakdowns,
      complexityNote
    };
  }

  private static applyPersonaTone(
    baseText: string, 
    persona: BuddyPersona, 
    level: HintLevel,
    isRephrase: boolean
  ): string {
    let prefix = '';
    let suffix = '';

    if (isRephrase) {
      prefix = "Let's reframe this from a cozy, simpler angle, buddy! ";
    }

    switch (persona) {
      case 'cheerleader':
        if (level === 0) prefix += "You've got this! Let's start with a warm observation: ";
        else if (level <= 3) prefix += "Great intuition so far! Think about this: ";
        suffix = " Keep that momentum going! ⭐";
        break;

      case 'zen_master':
        prefix = "Take a calm breath. Step away from syntax for a second: ";
        suffix = " Solutions arrive with patient clarity. 🌿";
        break;

      case 'strict_coach':
        prefix = "Pay close attention to problem boundary constraints: ";
        suffix = " Think about what state must be maintained across iterations.";
        break;

      case 'mentor':
      default:
        prefix = "Let's analyze this step carefully together: ";
        suffix = " What pattern emerges when you trace this with pencil and paper?";
        break;
    }

    // Preserve formatting on pseudocode and full breakdown
    if (level >= 4) {
      return baseText;
    }

    // If text starts with a Markdown heading, keep heading clean and place persona quote below it
    if (baseText.startsWith('###')) {
      const firstLineEnd = baseText.indexOf('\n');
      if (firstLineEnd !== -1) {
        const heading = baseText.slice(0, firstLineEnd);
        const rest = baseText.slice(firstLineEnd).trim();
        const callout = prefix.trim() ? `> *${prefix.trim()}*\n\n` : '';
        return `${heading}\n\n${callout}${rest}${suffix ? `\n\n> *${suffix.trim()}*` : ''}`;
      }
    }

    return `${prefix}${baseText}${suffix}`;
  }

  /**
   * Generates tailored architectural logic for unseeded problems
   * by analyzing problem slug and algorithmic intent.
   */
  private static generateDynamicProblemLadder(problemId: string, level: HintLevel) {
    const slug = problemId.replace(/^[a-z]+:/, '').toLowerCase();
    const readableTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const isStack = slug.includes('parenthes') || slug.includes('bracket') || slug.includes('stack') || slug.includes('polish') || slug.includes('temperature') || slug.includes('backspace') || slug.includes('simplify');
    const isTree = (slug.includes('tree') || slug.includes('bst')) || (slug.includes('node') && !slug.includes('list'));
    const isLinkedList = slug.includes('linked-list') || (slug.includes('list') && !slug.includes('sublist')) || slug.includes('cycle');
    const isSearch = slug.includes('search') || slug.includes('find') || slug.includes('binary') || slug.includes('rotated') || slug.includes('peak') || slug.includes('sqrt');
    const isWindow = slug.includes('substring') || slug.includes('window') || slug.includes('subarrays') || slug.includes('consecutive');
    const isTwoPointer = slug.includes('palindrome') || slug.includes('two-sum') || slug.includes('container') || slug.includes('water') || slug.includes('duplicates') || slug.includes('sort-colors') || slug.includes('triplet');

    if (isStack) {
      return this.buildStackLadder(readableTitle, slug, level);
    } else if (isTwoPointer) {
      return this.buildTwoPointerLadder(readableTitle, slug, level);
    } else if (isWindow) {
      return this.buildWindowLadder(readableTitle, slug, level);
    } else if (isLinkedList) {
      return this.buildLinkedListLadder(readableTitle, slug, level);
    } else if (isSearch) {
      return this.buildSearchLadder(readableTitle, slug, level);
    } else if (isTree) {
      return this.buildTreeLadder(readableTitle, slug, level);
    } else {
      return this.buildGeneralMapLadder(readableTitle, slug, level);
    }
  }

  private static buildStackLadder(title: string, slug: string, level: HintLevel) {
    const ladders: Record<HintLevel, { hintText: string; analogy?: string }> = {
      0: {
        hintText: `### Step 1: Understand the problem first\n\nIn "${title}", we process sequential items where each element must pair with or resolve against the most recently seen active item.\n\n**Let's understand the two key rules:**\n• **Order of resolution:** The item added most recently must be paired or resolved first (Last In, First Out).\n• **Pairing condition:** When a closing or matching element arrives, it must be validated against its immediate predecessor.\n\n**Concrete walkthrough:**\n| Action / Element | Buffer State | Status |\n|---|---|---|\n| Initial state | Empty | Waiting |\n| Opener arrives | Held in memory | Pending match |\n| Matching closer arrives | Paired successfully | Cleared |\n\n**Think about this edge case:**\nWhat if the input is completely empty, or has an odd number of items? Can every item ever find a valid partner?`
      },
      1: {
        hintText: `### Step 2: Think about the basic approach\n\nBefore writing code, let's think like a human problem solver.\n\nImagine inspecting elements one by one from left to right:\n1. When an opening or trigger item appears: hold onto it in memory.\n2. When a matching or closing element arrives: which item in memory does it need to match?\nDoes it match the first item you saw minutes ago, or the **most recent** one placed into your memory?\n\nChoose the logical action in the checkpoint below:`,
        analogy: 'Imagine a stack of cafeteria trays or plates: the last plate placed on top must be the first plate picked up!'
      },
      2: {
        hintText: `### Step 3: Discover the Stack technique\n\nIn computer science, storing elements where the **last item added is the first item removed** is called a **Stack** (LIFO).\n\nIn Python, a standard list acts as a Stack:\n• \`stack.append(x)\` pushes an item onto the top.\n• \`stack.pop()\` removes the top item.\n\n**The Core Invariant Rule:**\n1. If an incoming element is an opener: push it onto the stack.\n2. If it is a closer: check that the stack is not empty and pop the top element to verify the match.\n3. At the end, the stack must be completely empty!`
      },
      3: {
        hintText: `### Step 4: Dry run the algorithm\n\nLet's trace how the stack evolves over a sequence of elements:\n\n\`\`\`text\nStep 1: Opener arrives -> stack.append(x) -> Stack: [x]\nStep 2: Second opener arrives -> stack.append(y) -> Stack: [x, y]\nStep 3: Closer arrives -> Matches y! -> stack.pop() -> Stack: [x]\nStep 4: Closer arrives -> Matches x! -> stack.pop() -> Stack: []\nFinished! Stack empty -> Valid match!\n\`\`\`\n\n**Critical Boundary Trap:**\nWhat happens if a closer arrives when the stack is already empty? Popping from an empty list crashes the program! Always guard against an empty stack before popping.`
      },
      4: {
        hintText: `### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. Initialize empty \`stack = []\`.\n2. Loop through each item in the input.\n3. If item is a closer: verify stack has items and compare with popped top.\n4. Else: push item onto stack.\n5. Return whether stack is empty at completion.\n\n\`\`\`python\nstack = []\nfor item in input_data:\n    # TODO: if is_closer: stack.pop() else: stack.append(item)\n    pass\n\`\`\``
      },
      5: {
        hintText: `### Step 6: Full Solution & Line-by-Line Breakdown\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and closing complexity analysis.`
      },
      6: {
        hintText: `Mastered ${title}? Practice similar stack and sequence challenges below.`
      }
    };

    return {
      hintText: ladders[level].hintText,
      analogy: ladders[level].analogy,
      edgeCases: ['Empty input data', 'Odd length input', 'Premature closer with empty stack'],
      checkpoint: {
        question: `When a closing element arrives in "${title}", which opening item must it pair with?`,
        options: [
          {
            text: 'The most recently opened item currently residing on top of the stack.',
            isCorrect: true,
            feedback: 'Spot on! The Last-In-First-Out (LIFO) property ensures inner nested elements resolve before outer elements.'
          },
          {
            text: 'The first item encountered at the very beginning of the input.',
            isCorrect: false,
            feedback: 'Nested elements must resolve innermost first, not outermost first.'
          }
        ]
      },
      fullCode: `def solve_${slug.replace(/-/g, '_')}(data):\n    stack = []\n    for item in data:\n        if is_match(item) and stack:\n            stack.pop()\n        else:\n            stack.append(item)\n    return len(stack) == 0`,
      lineBreakdowns: [
        { line: 'stack = []', explanation: 'Creates an empty list to act as a LIFO stack for tracking unclosed elements.' },
        { line: 'for item in data:', explanation: 'Traverses each element sequentially from left to right.' },
        { line: 'if is_match(item) and stack: stack.pop()', explanation: 'Pops the most recent active element when a matching closer is found.' },
        { line: 'return len(stack) == 0', explanation: 'Verifies that every opened item was successfully matched and resolved.' }
      ],
      complexityNote: {
        time: 'O(N)',
        space: 'O(N)',
        rationale: 'Time: Single pass visiting each element at most twice (one push, one pop). Space: Stack stores up to N elements in the worst case.'
      },
      alternativeSolutions: [
        {
          title: 'Counter Optimization (Single-Symbol Case)',
          technique: 'Integer Counter Tracking',
          timeComplexity: 'O(N)',
          spaceComplexity: 'O(1)',
          tradeOff: 'If only a single pair type exists, an integer balance counter (increment on open, decrement on close) avoids list allocations.',
          codeSnippet: `balance = 0\nfor x in data:\n    balance += 1 if x == '(' else -1\n    if balance < 0: return False\nreturn balance == 0`
        }
      ],
      similarProblems: [
        { title: `${title} II`, site: 'leetcode', slug: `${slug}-ii`, difficulty: 'Medium', url: `https://leetcode.com/problems/${slug}/`, patternReason: 'Deepens understanding of Stack push/pop mechanics.' }
      ]
    };
  }

  private static buildTwoPointerLadder(title: string, slug: string, level: HintLevel) {
    const ladders: Record<HintLevel, { hintText: string; analogy?: string }> = {
      0: {
        hintText: `### Step 1: Understand the problem first\n\nIn "${title}", we need to inspect pairs or scan elements relative to each other from both boundaries inward.\n\n**Let's clarify what is happening:**\n• Instead of testing all possible pairs with nested loops, we observe how elements relate from opposite ends.\n• Based on the current comparison, we can make a decisive choice to advance one boundary.\n\n**Sample walkthrough:**\n| Left Index & Value | Right Index & Value | Current Evaluation | Action |\n|---|---|---|---|\n| Start (index 0) | End (index N-1) | Compare pair | Adjust left or right |\n| Next position | Converged position | Compare pair | Advance inward |\n\n**Think about this edge case:**\nWhat if the array has only 1 element, or all elements are identical? Does your condition hold?`
      },
      1: {
        hintText: `### Step 2: Think about the basic approach\n\nBefore writing code, let's think like a human problem solver.\n\nSuppose you have a sorted list or need to compare from both ends:\n1. Place your left finger on the very first element (index 0).\n2. Place your right finger on the very last element (index N-1).\n3. Compare the values under your fingers.\n\n**The Big Question:**\nIf the current pair sum is too small, which finger should you move to make it larger? Moving the left finger to the right increases the value!`,
        analogy: 'Imagine two people standing at opposite ends of a bridge and walking toward each other until they meet in the middle.'
      },
      2: {
        hintText: `### Step 3: Discover the Two-Pointer Convergence Technique\n\nInstead of checking every pair with nested loops, we maintain two pointer variables:\n• \`left = 0\`\n• \`right = len(arr) - 1\`\n\n**The Invariant Rule:**\nWhile \`left < right\`:\n• Evaluate the pair \`(arr[left], arr[right])\`.\n• If condition satisfied: record answer or return.\n• If value is below target: increment \`left += 1\` to increase size.\n• If value is above target: decrement \`right -= 1\` to decrease size.`
      },
      3: {
        hintText: `### Step 4: Dry run the algorithm\n\nLet's trace two pointers converging inward:\n\n\`\`\`text\nInitial: left = 0, right = 4\nStep 1: Compare arr[0] and arr[4] -> Condition not met -> left advances to 1\nStep 2: Compare arr[1] and arr[4] -> Target found! -> Matching pair confirmed!\nStop: pointers never cross redundantly!\n\`\`\`\n\n**Boundary Guard:**\nThe loop must terminate when \`left >= right\`. Allowing pointers to cross would result in comparing identical elements or repeating previous pairs.`
      },
      4: {
        hintText: `### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. Initialize \`left = 0\` and \`right = len(data) - 1\`.\n2. While \`left < right\`:\n   - Evaluate current pair.\n   - If target met: return result.\n   - Else adjust \`left += 1\` or \`right -= 1\`.\n3. Return default fallback.\n\n\`\`\`python\nleft, right = 0, len(data) - 1\nwhile left < right:\n    # TODO: if match: return [left, right] elif condition: left += 1 else: right -= 1\n    pass\n\`\`\``
      },
      5: {
        hintText: `### Step 6: Full Solution & Line-by-Line Breakdown\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and closing complexity analysis.`
      },
      6: {
        hintText: `Mastered ${title}? Practice similar two-pointer convergence challenges below.`
      }
    };

    return {
      hintText: ladders[level].hintText,
      analogy: ladders[level].analogy,
      edgeCases: ['Single-element array', 'Two identical elements', 'Array with negative and positive values'],
      checkpoint: {
        question: `Why does the two-pointer technique guarantee linear time without checking all pairs?`,
        options: [
          {
            text: 'Because on every step, either the left or right boundary moves strictly inward, eliminating an entire row/column of candidates.',
            isCorrect: true,
            feedback: 'Exactly! Each step discards impossible options, visiting each element at most once.'
          },
          {
            text: 'Because it restarts the search from index 0 on every mismatch.',
            isCorrect: false,
            feedback: 'Restarting from index 0 would result in quadratic time.'
          }
        ]
      },
      fullCode: `def solve_${slug.replace(/-/g, '_')}(data):\n    left, right = 0, len(data) - 1\n    while left < right:\n        if is_match(data[left], data[right]):\n            return (left, right)\n        elif needs_increase(data[left], data[right]):\n            left += 1\n        else:\n            right -= 1\n    return None`,
      lineBreakdowns: [
        { line: 'left, right = 0, len(data) - 1', explanation: 'Initializes two boundary pointers at the opposite ends of the sequence.' },
        { line: 'while left < right:', explanation: 'Runs while the two pointers have not crossed or collided.' },
        { line: 'if is_match(data[left], data[right]): return (left, right)', explanation: 'Returns when the target condition is met.' },
        { line: 'left += 1 / right -= 1', explanation: 'Greedily eliminates impossible candidates by shifting the appropriate boundary.' }
      ],
      complexityNote: {
        time: 'O(N)',
        space: 'O(1)',
        rationale: 'Time: Each step increments left or decrements right, taking at most N steps. Space: Uses only two integer pointers, consuming O(1) auxiliary memory.'
      },
      alternativeSolutions: [
        {
          title: 'Binary Search per Element',
          technique: 'Logarithmic Lookup',
          timeComplexity: 'O(N log N)',
          spaceComplexity: 'O(1)',
          tradeOff: 'For each element at index i, binary searches for target - arr[i] in the remainder of the array. Slower than Two Pointers (O(N log N) vs O(N)).',
          codeSnippet: `for i in range(len(arr)):\n    idx = bisect_left(arr, target - arr[i], i + 1)\n    if idx < len(arr) and arr[idx] == target - arr[i]: return [i, idx]`
        }
      ],
      similarProblems: [
        { title: `${title} II`, site: 'leetcode', slug: `${slug}-ii`, difficulty: 'Medium', url: `https://leetcode.com/problems/${slug}/`, patternReason: 'Reinforces inward pointer convergence.' }
      ]
    };
  }

  private static buildWindowLadder(title: string, slug: string, level: HintLevel) {
    const ladders: Record<HintLevel, { hintText: string; analogy?: string }> = {
      0: {
        hintText: `### Step 1: Understand the problem first\n\nIn "${title}", we need to find an optimal continuous subarray or substring that satisfies a given condition.\n\n**Let's clarify what a contiguous window means:**\n• Elements must be adjacent in the original sequence.\n• We want to maximize, minimize, or count valid windows without recomputing from scratch.\n\n**Sample walkthrough:**\n| Window Span | Active Elements | Validity | Action |\n|---|---|---|---|\n| \`[0..0]\` | 1 item | Valid | Expand right |\n| \`[0..2]\` | 3 items | Valid | Expand right |\n| \`[0..3]\` | 4 items | Violated | Shrink left until valid |\n\n**Think about this edge case:**\nWhat if the input is empty or all elements are identical? What should your function return?`
      },
      1: {
        hintText: `### Step 2: Think about the basic approach\n\nBefore writing code, let's think like a human problem solver.\n\nImagine expanding a viewing window across the sequence:\n1. Move your right boundary forward to absorb new elements.\n2. When a rule is violated (like a duplicate or exceeding a sum limit): what must you do?\nDo you throw away the whole window and restart from scratch? No! You simply shrink the left boundary forward until the window becomes valid again!`,
        analogy: 'Imagine a camera viewfinder sliding across a group photo: widen the frame to include more people, and nudge the left border forward when an unwanted element enters.'
      },
      2: {
        hintText: `### Step 3: Discover the Sliding Window Technique\n\nInstead of recalculating every possible slice with nested loops, we use two pointers to frame our active window:\n• \`left\`: start of the active window.\n• \`right\`: end of the active window.\n\n**The Invariant Formula:**\n• Active Window Length: \`right - left + 1\`\n• Expand: increment \`right\` in a for loop.\n• Shrink: \`while\` condition is violated, remove \`data[left]\` and increment \`left += 1\`.`
      },
      3: {
        hintText: `### Step 4: Dry run the algorithm\n\nLet's trace how the window slides forward:\n\n\`\`\`text\nRight = 0: Window [0..0] valid -> max_len = 1\nRight = 1: Window [0..1] valid -> max_len = 2\nRight = 2: Window [0..2] invalid! -> Shrink left from 0 to 1 -> Window [1..2] valid\nRight = 3: Window [1..3] valid -> max_len = 3\n\`\`\`\n\n**Boundary Trap:**\nRemember that window indices are 0-based, so the count of items between left and right inclusive is always \`right - left + 1\`.`
      },
      4: {
        hintText: `### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. Initialize \`left = 0\`, \`max_len = 0\`, and active state tracker.\n2. Loop \`right\` from \`0\` to \`len(data) - 1\`.\n3. While window invariant is violated: update state and \`left += 1\`.\n4. Update result with current window \`right - left + 1\`.\n5. Return result.\n\n\`\`\`python\nleft, max_val = 0, 0\nfor right in range(len(data)):\n    # TODO: while invalid: shrink left\n    max_val = max(max_val, right - left + 1)\n\`\`\``
      },
      5: {
        hintText: `### Step 6: Full Solution & Line-by-Line Breakdown\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and closing complexity analysis.`
      },
      6: {
        hintText: `Mastered ${title}? Practice similar sliding window challenges below.`
      }
    };

    return {
      hintText: ladders[level].hintText,
      analogy: ladders[level].analogy,
      edgeCases: ['Empty string/array', 'Single-element input', 'All identical characters/numbers'],
      checkpoint: {
        question: `When the sliding window violates its validity condition, why do we increment left instead of resetting left to 0?`,
        options: [
          {
            text: 'Because earlier prefixes were already measured; resetting to 0 causes redundant quadratic recalculations.',
            isCorrect: true,
            feedback: 'Exactly right! Sliding left forward guarantees each element is processed at most twice, maintaining linear O(N) time.'
          },
          {
            text: 'Because left cannot legally be assigned to 0 in Python.',
            isCorrect: false,
            feedback: 'Left can be assigned to 0, but doing so wastes time recalculating already-examined prefixes.'
          }
        ]
      },
      fullCode: `def solve_${slug.replace(/-/g, '_')}(data):\n    left = 0\n    max_len = 0\n    state = set()\n    for right in range(len(data)):\n        while data[right] in state:\n            state.remove(data[left])\n            left += 1\n        state.add(data[right])\n        max_len = max(max_len, right - left + 1)\n    return max_len`,
      lineBreakdowns: [
        { line: 'left, max_len = 0, 0', explanation: 'Initializes window start index and running maximum result counter.' },
        { line: 'for right in range(len(data)):', explanation: 'Expands the right window boundary across each element.' },
        { line: 'while data[right] in state: left += 1', explanation: 'Shrinks window from the left until the validity condition is restored.' },
        { line: 'max_len = max(max_len, right - left + 1)', explanation: 'Updates max result with the current valid window length (right - left + 1).' }
      ],
      complexityNote: {
        time: 'O(N)',
        space: 'O(K)',
        rationale: 'Time: Both left and right pointers traverse each element at most once -> O(N). Space: Auxiliary state tracker stores at most K distinct elements.'
      },
      alternativeSolutions: [
        {
          title: 'Index Jumping Map',
          technique: 'Hash Map with Stored Indices',
          timeComplexity: 'O(N) single pass',
          spaceComplexity: 'O(K)',
          tradeOff: 'Instead of sliding left one-by-one in a while loop, store last-seen indices and jump left directly: left = max(left, last_seen[char] + 1).',
          codeSnippet: `last_seen = {}\nleft = max_len = 0\nfor right, val in enumerate(data):\n    if val in last_seen and last_seen[val] >= left:\n        left = last_seen[val] + 1\n    last_seen[val] = right\n    max_len = max(max_len, right - left + 1)`
        }
      ],
      similarProblems: [
        { title: `${title} II`, site: 'leetcode', slug: `${slug}-ii`, difficulty: 'Medium', url: `https://leetcode.com/problems/${slug}/`, patternReason: 'Sliding window variation with dynamic constraints.' }
      ]
    };
  }

  private static buildLinkedListLadder(title: string, slug: string, level: HintLevel) {
    const ladders: Record<HintLevel, { hintText: string; analogy?: string }> = {
      0: {
        hintText: `### Step 1: Understand the problem first\n\nIn "${title}", we operate on a linked list made of nodes, where each node points to the next.\n\n**Let's understand how a linked list differs from an array:**\n• There are no numerical indices; nodes only know where their \`next\` arrow points.\n• When we manipulate links, we must take care never to drop our reference to the rest of the chain.\n\n**Sample walkthrough:**\n| Node | Current Next Pointer | Desired Transformation |\n|---|---|---|\n| Node A | Points to B | Redirect or traverse |\n| Node B | Points to C | Update link |\n| Tail | Points to None | Mark termination |\n\n**Think about this edge case:**\nWhat if the list is completely empty (\`head == None\`), or contains only a single node?`
      },
      1: {
        hintText: `### Step 2: Think about the basic approach\n\nBefore modifying pointers, let's think like a human problem solver.\n\nSuppose you have \`node1 -> node2 -> node3\`:\nIf you change \`node1.next = None\` immediately, you have completely lost your connection to \`node2\` and the rest of the list!\n\n**The Big Realization:**\nBefore changing where \`curr.next\` points, you must always bookmark the next node in a temporary variable (\`next_temp = curr.next\`)!`,
        analogy: 'Imagine swinging from vine to vine in a jungle: before letting go of your current vine, you must reach out and grasp the next vine with your other hand!'
      },
      2: {
        hintText: `### Step 3: Discover the Pointer Tracking Technique\n\nTo manipulate linked list nodes safely in-place without extra memory, maintain dedicated pointer variables:\n• \`prev\`: points to the previous node (initially \`None\`).\n• \`curr\`: points to the active node (initially \`head\`).\n• \`next_temp\`: temporary bookmark to preserve downstream nodes.\n\n**The 4-Step Traversal Invariant:**\n1. Bookmark: \`next_temp = curr.next\`\n2. Redirect: update \`curr.next\`\n3. Advance: \`prev = curr\`\n4. Advance: \`curr = next_temp\``
      },
      3: {
        hintText: `### Step 4: Dry run the algorithm\n\nLet's trace pointers moving along the list:\n\n\`\`\`text\nInitial: prev = None, curr = Node(1)\nStep 1: next_temp = Node(2) -> curr.next = prev -> prev = Node(1) -> curr = Node(2)\nStep 2: next_temp = Node(3) -> curr.next = prev -> prev = Node(2) -> curr = Node(3)\nStep 3: curr reaches None -> Loop terminates!\nResult: prev sits on the new head node!\n\`\`\`\n\n**Boundary Trap:**\nWhen \`curr\` becomes \`None\`, the loop terminates. The new valid head of the modified list is \`prev\`, NOT \`curr\`!`
      },
      4: {
        hintText: `### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. Initialize \`prev = None\` and \`curr = head\`.\n2. While \`curr\` is not None:\n   - Save \`next_temp = curr.next\`\n   - Update pointer link\n   - Advance \`prev\` and \`curr\`\n3. Return \`prev\`.\n\n\`\`\`python\nprev, curr = None, head\nwhile curr:\n    # TODO: next_temp = curr.next; curr.next = prev; prev, curr = curr, next_temp\n    pass\n\`\`\``
      },
      5: {
        hintText: `### Step 6: Full Solution & Line-by-Line Breakdown\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and closing complexity analysis.`
      },
      6: {
        hintText: `Mastered ${title}? Practice similar linked list pointer challenges below.`
      }
    };

    return {
      hintText: ladders[level].hintText,
      analogy: ladders[level].analogy,
      edgeCases: ['Empty list (head == None)', 'Single-node list', 'List with even vs. odd number of nodes'],
      checkpoint: {
        question: `Why must we store "curr.next" in a temporary variable before updating "curr.next"?`,
        options: [
          {
            text: 'Because overwriting curr.next destroys the reference to the remainder of the linked list.',
            isCorrect: true,
            feedback: 'Spot on! Once curr.next is reassigned, any unreferenced downstream nodes are lost forever in memory.'
          },
          {
            text: 'Because Python requires all node assignments to be duplicated.',
            isCorrect: false,
            feedback: 'Python has no such requirement; saving the reference is purely an algorithmic necessity.'
          }
        ]
      },
      fullCode: `def solve_${slug.replace(/-/g, '_')}(head):\n    prev = None\n    curr = head\n    while curr:\n        next_temp = curr.next\n        curr.next = prev\n        prev = curr\n        curr = next_temp\n    return prev`,
      lineBreakdowns: [
        { line: 'prev, curr = None, head', explanation: 'Initializes previous pointer to None and active pointer to list head.' },
        { line: 'while curr:', explanation: 'Traverses until curr steps past the final node (reaches None).' },
        { line: 'next_temp = curr.next', explanation: 'Bookmarks reference to downstream nodes before breaking the forward pointer.' },
        { line: 'curr.next = prev; prev, curr = curr, next_temp', explanation: 'Redirects link backward and advances both pointers forward.' }
      ],
      complexityNote: {
        time: 'O(N)',
        space: 'O(1)',
        rationale: 'Time: Single pass visiting each node once. Space: Uses only three pointer variables, consuming O(1) auxiliary space.'
      },
      alternativeSolutions: [
        {
          title: 'Sentinel / Dummy Head Pattern',
          technique: 'Dummy Node Anchoring',
          timeComplexity: 'O(N)',
          spaceComplexity: 'O(1)',
          tradeOff: 'Using dummy = ListNode(0, head) avoids separate special-case code when deleting or modifying the head node.',
          codeSnippet: `dummy = ListNode(0, head)\ncurr = dummy\nwhile curr.next:\n    process(curr.next)\nreturn dummy.next`
        }
      ],
      similarProblems: [
        { title: `${title} II`, site: 'leetcode', slug: `${slug}-ii`, difficulty: 'Medium', url: `https://leetcode.com/problems/${slug}/`, patternReason: 'Expands pointer manipulation across sub-segments.' }
      ]
    };
  }

  private static buildSearchLadder(title: string, slug: string, level: HintLevel) {
    const ladders: Record<HintLevel, { hintText: string; analogy?: string }> = {
      0: {
        hintText: `### Step 1: Understand the problem first\n\nIn "${title}", we need to search for a target value or identify an inflection point in ordered data.\n\n**Let's understand the search problem:**\n• Instead of scanning from index 0 to N-1 one item at a time, we take advantage of order or monotonicity.\n• With each comparison, we can eliminate an entire half of the remaining search space.\n\n**Sample walkthrough:**\n| Search Range | Midpoint Value | Target Comparison | Half Eliminated |\n|---|---|---|---|\n| Full array | Middle element | Target is smaller | Discard entire right half |\n| Left half | New middle | Target matches | Found! |\n\n**Think about this edge case:**\nWhat if the target is not in the array at all, or lies at index 0 or index N-1?`
      },
      1: {
        hintText: `### Step 2: Think about the basic approach\n\nBefore writing code, let's think like a human problem solver.\n\nImagine searching for a word in a 1,000-page dictionary:\nDo you flip pages one by one starting from page 1? Of course not!\nYou open directly to page 500. If your word starts with 'T', you know it comes after page 500, so you instantly discard pages 1 through 500!\n\n**Question:** How many times can you cut 1,000 in half before reaching 1 page? Only about 10 times!`,
        analogy: 'Searching a printed dictionary by opening to the middle each time rather than flipping every single page from the front.'
      },
      2: {
        hintText: `### Step 3: Discover the Binary Search Technique\n\nWe maintain two boundary variables defining the active search space:\n• \`left = 0\`\n• \`right = len(arr) - 1\`\n\n**The Midpoint Calculation:**\nCalculate \`mid = (left + right) // 2\`.\n\n**The Invariant Decision Tree:**\n• If \`arr[mid] == target\`: return \`mid\`.\n• If \`arr[mid] < target\`: target must be to the right, so \`left = mid + 1\`.\n• If \`arr[mid] > target\`: target must be to the left, so \`right = mid - 1\`.`
      },
      3: {
        hintText: `### Step 4: Dry run the algorithm\n\nLet's trace searching for target in a sorted list:\n\n\`\`\`text\nInitial: left = 0, right = 6 -> mid = 3\nStep 1: arr[3] is smaller than target -> left advances to mid + 1 = 4\nStep 2: left = 4, right = 6 -> mid = 5\nStep 3: arr[5] equals target! -> Target located at index 5!\nTerminates in only 2 checks instead of 6!\n\`\`\`\n\n**Boundary Guard:**\nThe loop condition must be \`while left <= right\`. If you use \`< \`, single-element search spaces (where \`left == right\`) will be skipped!`
      },
      4: {
        hintText: `### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. Initialize \`left = 0\` and \`right = len(data) - 1\`.\n2. While \`left <= right\`:\n   - Compute \`mid = (left + right) // 2\`\n   - Check if target found.\n   - Adjust \`left\` or \`right\`.\n3. Return -1 if not found.\n\n\`\`\`python\nleft, right = 0, len(data) - 1\nwhile left <= right:\n    mid = (left + right) // 2\n    # TODO: if data[mid] == target: return mid elif target < data[mid]: right = mid - 1 else: left = mid + 1\n\`\`\``
      },
      5: {
        hintText: `### Step 6: Full Solution & Line-by-Line Breakdown\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and closing complexity analysis.`
      },
      6: {
        hintText: `Mastered ${title}? Practice similar binary search and division challenges below.`
      }
    };

    return {
      hintText: ladders[level].hintText,
      analogy: ladders[level].analogy,
      edgeCases: ['Target not in array', 'Target at index 0 or N-1', 'Single-element array [x], target = x'],
      checkpoint: {
        question: `Why must the while loop condition in binary search be "left <= right" instead of "left < right"?`,
        options: [
          {
            text: 'Because when left == right, a valid 1-element candidate space remains that must be tested.',
            isCorrect: true,
            feedback: 'Spot on! Using left < right skips evaluating the final element when the search window shrinks to size 1.'
          },
          {
            text: 'Because Python requires equal signs in all loop conditions.',
            isCorrect: false,
            feedback: 'Python does not require equal signs; the condition is strictly an algorithmic boundary requirement.'
          }
        ]
      },
      fullCode: `def solve_${slug.replace(/-/g, '_')}(nums, target):\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1`,
      lineBreakdowns: [
        { line: 'left, right = 0, len(nums) - 1', explanation: 'Establishes inclusive lower and upper search boundaries.' },
        { line: 'while left <= right:', explanation: 'Ensures the search continues as long as at least one candidate element remains.' },
        { line: 'mid = (left + right) // 2', explanation: 'Computes midpoint index to divide the remaining search range in half.' },
        { line: 'left = mid + 1 / right = mid - 1', explanation: 'Discards the half of the range known not to contain the target.' }
      ],
      complexityNote: {
        time: 'O(log N)',
        space: 'O(1)',
        rationale: 'Time: Each comparison halves the search domain, requiring at most log2(N) steps. Space: Uses only three integer boundary variables (O(1)).'
      },
      alternativeSolutions: [
        {
          title: 'Built-in Bisect Module',
          technique: 'Standard Library Bisection',
          timeComplexity: 'O(log N)',
          spaceComplexity: 'O(1)',
          tradeOff: 'Python provides bisect_left / bisect_right. Fast and battle-tested in 2 lines, though interviewers often want manual implementation.',
          codeSnippet: `import bisect\nidx = bisect.bisect_left(nums, target)\nreturn idx if idx < len(nums) and nums[idx] == target else -1`
        }
      ],
      similarProblems: [
        { title: `${title} II`, site: 'leetcode', slug: `${slug}-ii`, difficulty: 'Medium', url: `https://leetcode.com/problems/${slug}/`, patternReason: 'Rotated or duplicated variation of binary search.' }
      ]
    };
  }

  private static buildTreeLadder(title: string, slug: string, level: HintLevel) {
    const ladders: Record<HintLevel, { hintText: string; analogy?: string }> = {
      0: {
        hintText: `### Step 1: Understand the problem first\n\nIn "${title}", we operate on a hierarchical Tree where each node has a value and optional left/right child nodes.\n\n**Let's understand how tree operations work:**\n• A tree is a recursive structure: every child node is itself the root of a smaller subtree.\n• If we can solve the problem for the current node and its two immediate subtrees, the entire tree is solved!\n\n**Sample walkthrough:**\n| Node | Left Subtree Result | Right Subtree Result | Combined Root Action |\n|---|---|---|---|\n| Leaf Node | Empty (None) | Empty (None) | Base case value |\n| Parent Node | Solved recursively | Solved recursively | Combine left and right results |\n\n**Think about this edge case:**\nWhat should your function return if \`root == None\` (an empty tree)?`
      },
      1: {
        hintText: `### Step 2: Think about the basic approach\n\nBefore writing code, let's think like a human problem solver.\n\nImagine delegating a task across an organizational hierarchy:\n1. If you are asked to count people in the company: you ask your left manager to count their division, and your right manager to count their division.\n2. When both managers report their answers: you add them together and add 1 for yourself!\n3. What if a manager has no team (\`None\`)? They report back 0!`,
        analogy: 'An organizational chart where a director delegates the count to their department heads, who report back combined sub-totals.'
      },
      2: {
        hintText: `### Step 3: Discover Recursive Tree Traversal (DFS)\n\nBecause each node has the same structure, **Recursion** is the most natural tool:\n\n**The Two Essential Pillars:**\n1. **Base Case:** What happens when \`root is None\`? Always return a simple fallback (like \`0\`, \`None\`, or \`True\`).\n2. **Recursive Step:** Call your function on \`root.left\` and \`root.right\`, then combine their results with the current node.`
      },
      3: {
        hintText: `### Step 4: Dry run the algorithm\n\nLet's trace a 3-node tree \`1 -> (2, 3)\`:\n\n\`\`\`text\nCall solve(Node 1):\n  Call solve(Node 2) on left:\n    solve(2.left) returns 0\n    solve(2.right) returns 0\n    Node 2 returns 1 + max(0, 0) = 1\n  Call solve(Node 3) on right:\n    solve(3.left) returns 0\n    solve(3.right) returns 0\n    Node 3 returns 1 + max(0, 0) = 1\nCombined Node 1 returns 1 + max(1, 1) = 2!\n\`\`\`\n\n**Boundary Guard:**\nAlways put the base case (\`if not root: return ...\`) at the very top of your function before accessing \`root.left\` or \`root.right\` to prevent AttributeError.`
      },
      4: {
        hintText: `### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. Base case: \`if not root: return 0\` (or target fallback).\n2. Recursively solve \`left = solve(root.left)\`.\n3. Recursively solve \`right = solve(root.right)\`.\n4. Combine results and return.\n\n\`\`\`python\ndef solve(root):\n    if not root: return 0\n    # TODO: left, right = solve(root.left), solve(root.right); return combine(left, right)\n    pass\n\`\`\``
      },
      5: {
        hintText: `### Step 6: Full Solution & Line-by-Line Breakdown\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and closing complexity analysis.`
      },
      6: {
        hintText: `Mastered ${title}? Practice similar tree traversal challenges below.`
      }
    };

    return {
      hintText: ladders[level].hintText,
      analogy: ladders[level].analogy,
      edgeCases: ['Empty tree (root == None)', 'Single leaf node', 'Skewed tree (degenerates into linked list)'],
      checkpoint: {
        question: `Why must the base case "if not root: return ..." be the first line of a recursive tree function?`,
        options: [
          {
            text: 'To terminate the recursion cleanly when traversing past a leaf node and avoid an AttributeError.',
            isCorrect: true,
            feedback: 'Spot on! Leaf nodes have children equal to None; attempting to read None.left crashes the program.'
          },
          {
            text: 'Because Python requires base cases to appear on line 1.',
            isCorrect: false,
            feedback: 'Python allows base cases anywhere, but placing it first prevents null dereference errors.'
          }
        ]
      },
      fullCode: `def solve_${slug.replace(/-/g, '_')}(root):\n    if not root:\n        return 0\n    left = solve_${slug.replace(/-/g, '_')}(root.left)\n    right = solve_${slug.replace(/-/g, '_')}(root.right)\n    return 1 + max(left, right)`,
      lineBreakdowns: [
        { line: 'if not root: return 0', explanation: 'Base case guard: returns 0 when traversing past a leaf node into None.' },
        { line: 'left = solve(root.left); right = solve(root.right)', explanation: 'Recursively delegates computation to left and right subtrees.' },
        { line: 'return 1 + max(left, right)', explanation: 'Combines the subtree results with the current node level.' }
      ],
      complexityNote: {
        time: 'O(N)',
        space: 'O(H)',
        rationale: 'Time: Visits each of the N nodes exactly once. Space: Call stack depth equals the height of the tree H (O(log N) for balanced trees, O(N) for skewed trees).'
      },
      alternativeSolutions: [
        {
          title: 'Iterative Breadth-First Search (Queue)',
          technique: 'Level-Order Traversal with deque',
          timeComplexity: 'O(N)',
          spaceComplexity: 'O(N)',
          tradeOff: 'Uses collections.deque to process tree level by level. Avoids call stack overflow on deeply skewed trees.',
          codeSnippet: `from collections import deque\nqueue = deque([root]) if root else deque()\nwhile queue:\n    node = queue.popleft()\n    if node.left: queue.append(node.left)\n    if node.right: queue.append(node.right)`
        }
      ],
      similarProblems: [
        { title: `${title} II`, site: 'leetcode', slug: `${slug}-ii`, difficulty: 'Medium', url: `https://leetcode.com/problems/${slug}/`, patternReason: 'Expands recursive tree traversal with path or sum tracking.' }
      ]
    };
  }

  private static buildGeneralMapLadder(title: string, slug: string, level: HintLevel) {
    const ladders: Record<HintLevel, { hintText: string; analogy?: string }> = {
      0: {
        hintText: `### Step 1: Understand the problem first\n\nIn "${title}", we need to process items and track historical context or frequencies to reach the answer.\n\n**Let's understand the core objective:**\n• Instead of rescanning the entire collection repeatedly with nested loops, we record values as we encounter them.\n• On each step, we can check whether a matching partner or condition has already been observed.\n\n**Sample walkthrough:**\n| Current Element | Required Condition / Match | Seen History | Action |\n|---|---|---|---|\n| Item 1 | Check if partner seen | Empty | Record in memory |\n| Item 2 | Check if partner seen | Holds Item 1 | Match found or record |\n\n**Think about this edge case:**\nWhat if the input contains duplicates, negative numbers, or only a single item?`
      },
      1: {
        hintText: `### Step 2: Think about the basic approach\n\nBefore writing code, let's think like a human problem solver.\n\nSuppose you are walking down a path inspecting items one by one:\n1. As you inspect each item: do you want to walk all the way back to the start to see if you have seen something before?\n2. Of course not! You carry a small notebook in your pocket.\n3. As you see an item, you write it down. Then when you need something, you simply look at your notebook in a fraction of a second!`,
        analogy: 'Carrying a pocket notebook where you jot down names or numbers, letting you verify any past item instantly without walking back.'
      },
      2: {
        hintText: `### Step 3: Discover the Hash Table / Auxiliary Memory Technique\n\nIn programming, our pocket notebook is a **Dictionary (Hash Map)** or a **Set**:\n• Checking \`x in seen\` takes instantaneous O(1) time.\n• Storing \`seen[x] = index\` preserves both the value and where it occurred.\n\n**The Invariant Rule:**\nFor each item \`x\` in our sequence:\n1. Compute or identify the required partner or property.\n2. Check if that partner is already inside \`seen\`.\n3. If yes: return or record the result.\n4. If no: record \`seen[x] = ...\` and continue.`
      },
      3: {
        hintText: `### Step 4: Dry run the algorithm\n\nLet's trace how the memory notebook builds up:\n\n\`\`\`text\nStep 0: item = A -> Not in seen {} -> Record seen[A] = 0\nStep 1: item = B -> Not in seen {A: 0} -> Record seen[B] = 1\nStep 2: item = A -> In seen! Partner found at index 0! -> Target pair matched!\nFinished in a single linear pass!\n\`\`\`\n\n**Boundary Guard:**\nBe careful with duplicates: if you store items in a dictionary, decide whether to keep the first seen index or overwrite with the latest index based on problem requirements.`
      },
      4: {
        hintText: `### Step 5: Build the Algorithm Blueprint\n\n**Complete these tasks:**\n1. Initialize empty dictionary or set \`seen = {}\`.\n2. Loop through elements using \`enumerate(data)\`.\n3. Check if target or complement is in \`seen\`.\n4. If found: return result; else store \`seen[item] = i\`.\n5. Return fallback.\n\n\`\`\`python\nseen = {}\nfor i, val in enumerate(data):\n    # TODO: if match(val, seen): return result; seen[val] = i\n    pass\n\`\`\``
      },
      5: {
        hintText: `### Step 6: Full Solution & Line-by-Line Breakdown\n\nHere is the clean, simplest accepted Python solution followed by line-by-line annotations and closing complexity analysis.`
      },
      6: {
        hintText: `Mastered ${title}? Practice similar hash map and tracking challenges below.`
      }
    };

    return {
      hintText: ladders[level].hintText,
      analogy: ladders[level].analogy,
      edgeCases: ['Empty input data', 'Single-element input', 'Duplicate values and extreme bounds'],
      checkpoint: {
        question: `How does using a Hash Map or Set eliminate redundant quadratic iterations in "${title}"?`,
        options: [
          {
            text: 'It provides instantaneous O(1) lookups for previously seen elements, avoiding repetitive nested scans.',
            isCorrect: true,
            feedback: 'Spot on! Hash tables turn repeated scans into instant O(1) average lookups.'
          },
          {
            text: 'It automatically sorts the input elements.',
            isCorrect: false,
            feedback: 'Hash tables do not sort elements; they use hash functions for instant key retrieval.'
          }
        ]
      },
      fullCode: `def solve_${slug.replace(/-/g, '_')}(data):\n    seen = {}\n    for i, val in enumerate(data):\n        if val in seen:\n            return (seen[val], i)\n        seen[val] = i\n    return None`,
      lineBreakdowns: [
        { line: 'seen = {}', explanation: 'Creates an auxiliary hash map to track encountered values and their positions.' },
        { line: 'for i, val in enumerate(data):', explanation: 'Traverses each element alongside its index.' },
        { line: 'if val in seen: return (seen[val], i)', explanation: 'Instantly identifies when a matching condition is met.' },
        { line: 'seen[val] = i', explanation: 'Records current element for subsequent iterations to reference.' }
      ],
      complexityNote: {
        time: 'O(N)',
        space: 'O(N)',
        rationale: 'Time: Single pass over N elements with O(1) average hash lookups. Space: Auxiliary hash table stores up to N entries in the worst case.'
      },
      alternativeSolutions: [
        {
          title: 'Sort and Compare Adjacent',
          technique: 'Sorting Preprocessing',
          timeComplexity: 'O(N log N)',
          spaceComplexity: 'O(1) auxiliary (if in-place)',
          tradeOff: 'Sorting groups identical or related elements together so they can be compared with a single pass, but alters original indices.',
          codeSnippet: `sorted_data = sorted(data)\nfor i in range(len(sorted_data) - 1):\n    if sorted_data[i] == sorted_data[i + 1]: return True`
        }
      ],
      similarProblems: [
        { title: `${title} II`, site: 'leetcode', slug: `${slug}-ii`, difficulty: 'Medium', url: `https://leetcode.com/problems/${slug}/`, patternReason: 'Expands auxiliary tracking across multiple conditions.' }
      ]
    };
  }
}
