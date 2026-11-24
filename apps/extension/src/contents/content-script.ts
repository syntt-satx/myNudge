import { LeetCodeAdapter } from '../adapters/leetcode-adapter.ts';
import { FloatingBuddyComponent } from '../components/floating-buddy.ts';
import { NudgeConsoleComponent } from '../components/nudge-console.ts';
import type { HintLevel, ProblemContext } from '../../../../packages/shared/src/index.ts';

(function initNudgeContentScript() {
  console.log('[Nudge] Initializing content script...');

  const adapter = new LeetCodeAdapter();
  if (!adapter.matches(window.location.href)) {
    console.log('[Nudge] URL does not match active adapter:', window.location.href);
    return;
  }

  // Inject Monaco bridge script into host page world
  function injectMonacoBridge() {
    try {
      const script = document.createElement('script');
      // @ts-ignore
      script.src = chrome.runtime.getURL('src/injected/monaco-bridge.js');
      script.onload = () => script.remove();
      (document.head || document.documentElement).appendChild(script);
      console.log('[Nudge] Monaco bridge injected.');
    } catch (e) {
      console.warn('[Nudge] Could not inject bridge via chrome.runtime.getURL (dev mode fallback):', e);
    }
  }

  injectMonacoBridge();

  // Create isolated Shadow DOM host
  const mountHost = adapter.mountPoint();
  const shadowRoot = mountHost.attachShadow ? mountHost.attachShadow({ mode: 'open' }) : mountHost;

  // Load stylesheet into Shadow Root
  function injectShadowStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    // @ts-ignore
    link.href = chrome.runtime.getURL ? chrome.runtime.getURL('src/styles/theme.css') : '';
    shadowRoot.appendChild(link);
  }

  injectShadowStyles();

  // Shadow DOM wrapper container
  const container = document.createElement('div');
  container.className = 'nudge-container';
  shadowRoot.appendChild(container);

  let currentProblem: ProblemContext | null = null;

  // Initialize Nudge Console Drawer
  const consoleDrawer = new NudgeConsoleComponent(container, {
    onClose: () => consoleDrawer.setOpen(false),
    onShowLockedWarning: (msg: string) => buddy.say(msg, 3500),
    onCelebration: () => {
      buddy.setEmotion('cheering');
      buddy.say('Awesome step forward! Keep that momentum going! 🎉', 4000);
      setTimeout(() => buddy.setEmotion('idle'), 5000);
    },
    onRequestHint: async (level: HintLevel, isRephrase = false, confirmLastResort = false) => {
      buddy.setEmotion('thinking');
      const userCodeContext = await adapter.getUserCode();

      // Dispatch request to background service worker
      return new Promise((resolve, reject) => {
        // @ts-ignore
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          // @ts-ignore
          chrome.runtime.sendMessage({
            type: 'GET_HINT',
            payload: {
              problemId: currentProblem?.canonicalId || 'lc:generic',
              level,
              userCode: userCodeContext.code,
              language: userCodeContext.language,
              isRephrase,
              confirmLastResort,
              studentLevel: 'beginner',
              personality: 'cheerleader'
            }
          }, (response: any) => {
            buddy.setEmotion('idle');
            if (response && response.success) {
              resolve({
                hintText: response.data.hintText,
                analogy: response.data.analogy
              });
            } else {
              // Fallback local mock hints if background API is not yet connected
              resolve(getLocalFallbackHint(level, currentProblem?.title || 'this problem'));
            }
          });
        } else {
          // Mock local environment
          setTimeout(() => {
            buddy.setEmotion('idle');
            resolve(getLocalFallbackHint(level, currentProblem?.title || 'this problem'));
          }, 600);
        }
      });
    }
  });

  // Initialize Floating Buddy
  const buddy = new FloatingBuddyComponent(container, {
    onToggleConsole: () => {
      const isOpen = consoleDrawer.isOpen();
      consoleDrawer.setOpen(!isOpen);
      if (!isOpen) {
        buddy.say("Let's tackle this problem together!", 2500);
      }
    }
  });

  // Load problem details on startup and SPA route change
  async function syncProblem() {
    currentProblem = await adapter.getProblem();
    if (currentProblem) {
      console.log('[Nudge] Synced problem:', currentProblem.canonicalId, currentProblem.title);
      consoleDrawer.setProblem(currentProblem);
    }
  }

  syncProblem();

  // Listen for submission results from adapter
  adapter.onSubmissionResult((result) => {
    console.log('[Nudge] Submission detected:', result.status);
    if (result.status === 'Accepted') {
      buddy.setEmotion('cheering');
      buddy.say('PROBLEM SOLVED! You built serious mental muscle today! 🏆', 6000);
    } else {
      buddy.setEmotion('concerned');
      buddy.say(`Don't sweat the ${result.status}! Every bug is a stepping stone. Want a nudge?`, 5000);
    }
  });

  // Global Alt + H shortcut to summon buddy console
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'h' || e.key === 'H')) {
      e.preventDefault();
      consoleDrawer.setOpen(!consoleDrawer.isOpen());
    }
  });

  // Fallback hint generator for instant testing
  function getLocalFallbackHint(level: HintLevel, problemTitle: string): { hintText: string; analogy?: string } {
    switch (level) {
      case 0:
        return {
          hintText: `Before writing code for ${problemTitle}, what invariant or condition must always be true for every valid pair or sequence? What happens when the input array has only 1 or 2 items?`
        };
      case 1:
        return {
          hintText: `Notice the constraints: $N$ can be up to $10^5$. A nested loop checking every pair will take $O(N^2)$, which will exceed the 2-second time limit. We need a single-pass or $O(N \\log N)$ solution.`
        };
      case 2:
        return {
          hintText: `What data structure gives you instant $O(1)$ average time lookups for items you have already visited?`
        };
      case 3:
        return {
          hintText: `This matches the Hash Map / Complement Lookup pattern. As you iterate through each element $x$, check if $(target - x)$ has already been stored.`
        };
      case 4:
        return {
          hintText: `Initialize seen = {}\nFor index, val in enumerate(nums):\n    diff = target - val\n    if diff in seen: /* Return pair */\n    seen[val] = index`
        };
      case 5:
        return {
          hintText: `Full Explanation:\nWe store each number and its index in a hash map as we iterate. For each element, we calculate complement = target - nums[i]. If complement is in the map, we return [map[complement], i]. Otherwise, we record nums[i] -> i. Time Complexity: O(N). Space Complexity: O(N).`
        };
      default:
        return {
          hintText: `Keep exploring step by step!`
        };
    }
  }
})();
