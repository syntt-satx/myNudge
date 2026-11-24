# Nudge: AI Coding Buddy & Graded Hints Chrome Extension

Nudge is an educational Chrome extension that puts a customizable buddy character on **LeetCode**, **GeeksforGeeks**, and **HackerRank**. It guides students through a strict 6-level hint ladder rather than giving away solutions.

---

## Project Structure

```text
nudge/
├── apps/
│   ├── extension/              # Manifest V3 Chrome Extension
│   │   ├── manifest.json       # Host permissions for LeetCode, GFG, HackerRank
│   │   └── src/
│   │       ├── adapters/       # Platform adapters (LeetCode DOM & problem extractors)
│   │       ├── injected/       # Monaco / CodeMirror editor bridge (page world)
│   │       ├── contents/       # Isolated Shadow DOM host & content script
│   │       ├── background/     # Background service worker & local storage cache
│   │       ├── components/     # Draggable Buddy Avatar & 40% Nudge Console Drawer
│   │       └── styles/         # "Warm Earth-Tone Comfort" design system tokens
│   └── api/                    # Hint Engine & Anti-Leak Validator Backend
│       ├── src/
│       │   ├── validator/      # AST & regex anti-leak safety gates (L0-L4)
│       │   ├── engine/         # Ladder generator & buddy persona tone adapter
│       │   ├── db/             # Pre-seeded, hand-reviewed 6-level ladders
│       │   ├── routes/         # /health, /hint
│       │   └── server.ts       # Zero-dependency HTTP server with CORS
│       └── test/               # API, route & validator safety test suites
└── packages/
    └── shared/                 # Shared contracts across extension and API
        ├── src/
        │   ├── types/          # ProblemContext, HintRequest, HintResponse, BuddyConfig
        │   ├── policy/         # 6-Level Hint Ladder rules & boundaries
        │   ├── constants/      # XP rewards, streak bonuses, affirmations
        │   └── index.ts
        └── test/               # Policy and XP formula tests
```

---

## Quickstart

### 1. Run the Test Suites
To verify all 25 unit and integration tests across the monorepo:
```bash
npm test
```

### 2. Start the Backend Hint Engine API
```bash
cd apps/api
npm start
# Server listens at http://localhost:3001
```

### 3. Load the Extension in Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** on in the top-right corner.
3. Click **Load unpacked**.
4. Select the folder:  
   `C:\Users\Sathvi\.gemini\antigravity\scratch\nudge\apps\extension`
5. Navigate to any LeetCode problem (e.g., `https://leetcode.com/problems/two-sum/`).
6. The floating buddy avatar will appear in the bottom-right corner!
   * Click the avatar or press `Alt + H` to toggle the 40% Nudge Console drawer.
