// Nudge: Interactive Problem-Specific Guidance Engine & Unclipped Cozy Companion
(function initNudgeExtension() {
  console.log('[Nudge] Initializing Interactive Guidance Engine...');

  const LEVEL_TITLES = [
    '1. Understand the Problem',
    '2. Mental Simulation & Checkpoint',
    '3. Discover Core Technique',
    '4. Dry Run & Interactive Testing',
    '5. Build Algorithm Blueprint',
    '6. Full Solution & Complexity (Last Resort)'
  ];

  const MOTIVATION_QUOTES = [
    "Mistakes are just clues we haven't solved yet. We got this!",
    "Rome wasn't built in a day, and neither was a perfect sliding window. Keep going!",
    "The simpler the solution, the more elegant the code. Aim for clarity!",
    "Another problem down! You're building serious mental muscle.",
    "Every red test case is just one step closer to green.",
    "First make it work, then make it clean, then make it fast.",
    "Even senior engineers re-read pointer diagrams. Take a deep breath!"
  ];

  const AVATAR_CHARACTERS = {
    female: [
      { id: 'chloe', name: 'Chloe', emoji: '🐰', desc: 'High-Energy Cheerleader' },
      { id: 'maya', name: 'Maya', emoji: '🐱', desc: 'Playful & Sharp' },
      { id: 'tara', name: 'Tara', emoji: '🐼', desc: 'Zen & Philosophical' }
    ],
    male: [
      { id: 'neo', name: 'Neo', emoji: '🦊', desc: 'Curious & Quick' },
      { id: 'alex', name: 'Alex', emoji: '🦁', desc: 'Confident & Encouraging' },
      { id: 'kai', name: 'Kai', emoji: '🐻', desc: 'Calm & Grounded' }
    ]
  };

  // --- Real State & Progress Store (Zero Dummy Data, Real Habit Tracking) ---
  let userSettings = {
    gender: 'female',
    avatarId: 'chloe',
    outfit: 'cozy_knit',
    personality: 'cheerleader',
    ttsEnabled: false,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalSolved: 0,
    solvedStats: { easy: 0, medium: 0, hard: 0 },
    solvedProblems: [],
    patternMastery: {
      'Sliding Window': 0,
      'Two Pointers': 0,
      'Hash Map': 0,
      'Stack': 0,
      'Binary Search': 0
    },
    badges: [
      { id: 'b1', name: 'First Spark', icon: '✨', unlocked: false, desc: 'Solve your first problem with Nudge' },
      { id: 'b2', name: 'Checkpoint Master', icon: '🎯', unlocked: false, desc: 'Ace 5 interactive checkpoints' },
      { id: 'b3', name: 'Pattern Explorer', icon: '🪟', unlocked: false, desc: 'Master core patterns' },
      { id: 'b4', name: '7-Day Flame', icon: '🔥', unlocked: false, desc: 'Maintain a 7-day streak' }
    ],
    journal: [],
    checkpointCount: 0
  };

  function updateDailyStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = userSettings.lastActiveDate;

    if (!lastDate) {
      userSettings.lastActiveDate = today;
      userSettings.streak = 1;
      persistSettings();
      return;
    }

    if (lastDate !== today) {
      const lastTime = new Date(lastDate + 'T00:00:00Z').getTime();
      const todayTime = new Date(today + 'T00:00:00Z').getTime();
      const diffDays = Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        userSettings.streak = (userSettings.streak || 0) + 1;
        if (userSettings.streak >= 7) {
          const b4 = userSettings.badges.find(b => b.id === 'b4');
          if (b4) b4.unlocked = true;
        }
      } else if (diffDays > 1) {
        userSettings.streak = 1; // Missed a day
      }
      userSettings.lastActiveDate = today;
      persistSettings();
    }
  }

  async function loadSettings() {
    try {
      const data = await chrome.storage.local.get(['nudge_user_settings']);
      if (data && data.nudge_user_settings) {
        userSettings = { ...userSettings, ...data.nudge_user_settings };
      }
      updateDailyStreak();
    } catch (e) {}
  }
  loadSettings();

  async function persistSettings() {
    try {
      await chrome.storage.local.set({ nudge_user_settings: userSettings });
    } catch (e) {}
  }

  function getActiveAvatar() {
    const list = AVATAR_CHARACTERS[userSettings.gender] || AVATAR_CHARACTERS.female;
    return list.find(a => a.id === userSettings.avatarId) || list[0];
  }

  // --- 3D Pop Emoji Particle Layer ---
  function spawnEmojiBurst(x, y, count = 14) {
    const emojis = ['🎉', '✨', '💡', '🏆', '💪', '⭐'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'nudge-floating-emoji';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const offsetX = (Math.random() - 0.5) * 180;
      const offsetY = (Math.random() - 0.5) * 90;
      el.style.left = `${Math.max(30, Math.min(window.innerWidth - 40, x + offsetX))}px`;
      el.style.top = `${Math.max(30, Math.min(window.innerHeight - 40, y + offsetY))}px`;
      el.style.fontSize = `${28 + Math.random() * 14}px`;

      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1450);
    }
  }

  // --- Platform Adapter ---
  class PlatformAdapter {
    constructor() {
      this.submissionListeners = [];
      this.setupObserver();
    }

    async getProblemDetails() {
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;

      let site = 'leetcode';
      let slug = 'two-sum';
      let canonicalId = 'lc:two-sum';

      if (hostname.includes('geeksforgeeks.org')) {
        site = 'gfg';
        const m = pathname.match(/\/problems\/([^/]+)/);
        slug = m ? m[1] : 'problem';
        canonicalId = `gfg:${slug}`;
      } else if (hostname.includes('hackerrank.com')) {
        site = 'hackerrank';
        const m = pathname.match(/\/challenges\/([^/]+)/);
        slug = m ? m[1] : 'challenge';
        canonicalId = `hr:${slug}`;
      } else {
        const m = pathname.match(/\/problems\/([^/]+)/);
        slug = m ? m[1] : 'two-sum';
        canonicalId = `lc:${slug}`;
      }

      let title = '';
      const titleEl = document.querySelector('div[data-cy="question-title"]') || 
                      document.querySelector('.text-title-large') ||
                      document.querySelector('.problem-tab__name') ||
                      document.querySelector('h1.ui-heading') ||
                      document.querySelector('div.flex-1 > div > a[href*="/problems/"]');
      if (titleEl && titleEl.textContent) {
        title = titleEl.textContent.trim();
      } else {
        title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      let difficulty = 'Medium';
      const diffEl = document.querySelector('div[class*="text-difficulty-"]') || 
                     document.querySelector('.text-olive') || 
                     document.querySelector('.text-yellow') || 
                     document.querySelector('.text-pink') ||
                     document.querySelector('.problem-difficulty');
      if (diffEl && diffEl.textContent) {
        const t = diffEl.textContent.trim().toLowerCase();
        if (t.includes('easy')) difficulty = 'Easy';
        else if (t.includes('hard')) difficulty = 'Hard';
        else difficulty = 'Medium';
      }

      return { site, canonicalId, slug, title, difficulty };
    }

    setupObserver() {
      const observer = new MutationObserver(() => {
        const successEl = document.querySelector('span[data-e2e-locator="submission-result"]') ||
                          document.querySelector('div[class*="text-green"]');
        const failEl = document.querySelector('div[class*="text-red"]') ||
                       document.querySelector('span[class*="text-red"]');

        if (successEl && successEl.textContent?.includes('Accepted')) {
          this.notifyResult({ status: 'Accepted' });
        } else if (failEl && failEl.textContent) {
          const t = failEl.textContent;
          let status = 'Wrong Answer';
          if (t.includes('Time Limit')) status = 'Time Limit Exceeded';
          else if (t.includes('Runtime Error')) status = 'Runtime Error';
          this.notifyResult({ status });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    onSubmission(cb) { this.submissionListeners.push(cb); }
    notifyResult(r) { this.submissionListeners.forEach(cb => { try { cb(r); } catch (e) {} }); }
  }

  // --- Floating Companion Avatar (View A) ---
  class FloatingBuddyWidget {
    constructor(hostShadow, onOpenDrawer) {
      this.hostShadow = hostShadow;
      this.onOpenDrawer = onOpenDrawer;
      this.currentX = 0;
      this.currentY = 0;
      this.isDragging = false;
      this.startX = 0;
      this.startY = 0;
      this.bubbleTimer = null;

      this.element = document.createElement('div');
      this.element.className = 'nudge-buddy-avatar-wrap';

      this.inner = document.createElement('div');
      this.inner.className = 'nudge-buddy-inner';
      this.inner.textContent = getActiveAvatar().emoji;

      this.statusDot = document.createElement('div');
      this.statusDot.className = 'nudge-buddy-status-dot';
      this.inner.appendChild(this.statusDot);

      this.speechBubble = document.createElement('div');
      this.speechBubble.className = 'nudge-speech-bubble';

      this.element.appendChild(this.inner);
      this.element.appendChild(this.speechBubble);
      this.hostShadow.appendChild(this.element);

      this.restorePosition();
      this.bindDrag();
    }

    updateAvatarDisplay() {
      this.inner.textContent = getActiveAvatar().emoji;
      this.inner.appendChild(this.statusDot);
    }

    say(text, ms = 4500) {
      if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
      this.speechBubble.textContent = text;
      this.speechBubble.classList.add('visible');
      this.bubbleTimer = setTimeout(() => {
        this.speechBubble.classList.remove('visible');
      }, ms);
    }

    setConcerned(isConcerned) {
      if (isConcerned) this.statusDot.classList.add('concerned');
      else this.statusDot.classList.remove('concerned');
    }

    restorePosition() {
      try {
        const saved = localStorage.getItem('nudge_buddy_pos');
        if (saved) {
          const { x, y } = JSON.parse(saved);
          const maxX = window.innerWidth - 100;
          const maxY = window.innerHeight - 100;
          this.currentX = Math.max(-maxX, Math.min(x, 20));
          this.currentY = Math.max(-maxY, Math.min(y, 20));
          this.element.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
        }
      } catch (e) {}
    }

    bindDrag() {
      this.element.addEventListener('click', () => {
        if (!this.isDragging) this.onOpenDrawer();
      });

      this.element.addEventListener('pointerdown', (e) => {
        this.isDragging = false;
        this.startX = e.clientX;
        this.startY = e.clientY;

        const onMove = (me) => {
          const dx = me.clientX - this.startX;
          const dy = me.clientY - this.startY;
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            this.isDragging = true;
            this.currentX += dx;
            this.currentY += dy;
            this.startX = me.clientX;
            this.startY = me.clientY;
            this.element.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
          }
        };

        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          if (this.isDragging) {
            this.snapEdge();
            setTimeout(() => { this.isDragging = false; }, 80);
          }
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });
    }

    snapEdge() {
      const rect = this.element.getBoundingClientRect();
      const distRight = window.innerWidth - rect.right;
      if (rect.left < distRight) {
        this.currentX -= (rect.left - 24);
      } else {
        this.currentX += (distRight - 24);
      }
      this.element.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
      try {
        localStorage.setItem('nudge_buddy_pos', JSON.stringify({ x: this.currentX, y: this.currentY }));
      } catch (e) {}
    }
  }

  // --- Nudge Console Drawer (View B - UNCLIPPED & INTERACTIVE) ---
  class NudgeConsoleDrawer {
    constructor(hostShadow, onOpenModal, onTriggerCelebration) {
      this.hostShadow = hostShadow;
      this.onOpenModal = onOpenModal;
      this.onTriggerCelebration = onTriggerCelebration;
      this.activeProblem = null;
      this.currentLevel = 0;
      this.maxUnlockedLevel = 0;
      this.hintData = null;
      this.isConfirmedLastResort = false;
      this.quoteIndex = 0;
      this.checkpointAnswered = false;
      this.isStuck = false;

      this.drawer = document.createElement('div');
      this.drawer.className = 'nudge-drawer';
      this.hostShadow.appendChild(this.drawer);

      this.render();
      this.startQuoteRotator();
    }

    setProblem(problem) {
      this.activeProblem = problem;
      this.currentLevel = 0;
      this.maxUnlockedLevel = 0;
      this.isConfirmedLastResort = false;
      this.checkpointAnswered = false;
      this.isStuck = false;
      this.fetchHint(0);
    }

    setOpen(open) {
      if (open) this.drawer.classList.add('open');
      else this.drawer.classList.remove('open');
    }

    isOpen() {
      return this.drawer.classList.contains('open');
    }

    isCurrentProblemSolved() {
      const slug = (this.activeProblem?.slug || (this.activeProblem?.canonicalId || '').replace(/^[a-z]+:/, '') || (window.location.pathname.match(/\/problems\/([^/]+)/)?.[1]) || '').toLowerCase();
      if (!slug) return false;
      return (userSettings.solvedProblems || []).some(p => {
        if (typeof p === 'string') return p.toLowerCase().includes(slug);
        const pSlug = (p.slug || p.canonicalId || '').replace(/^[a-z]+:/, '').toLowerCase();
        return pSlug === slug || pSlug.includes(slug) || slug.includes(pSlug);
      });
    }

    markCurrentProblemSolved() {
      const slug = (this.activeProblem?.slug || (this.activeProblem?.canonicalId || '').replace(/^[a-z]+:/, '') || (window.location.pathname.match(/\/problems\/([^/]+)/)?.[1]) || 'two-sum').toLowerCase();
      const title = this.activeProblem?.title || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const canonicalId = this.activeProblem?.canonicalId || `lc:${slug}`;
      const difficulty = this.activeProblem?.difficulty || 'Medium';
      const site = this.activeProblem?.site || (window.location.hostname.includes('geeksforgeeks') ? 'gfg' : window.location.hostname.includes('hackerrank') ? 'hackerrank' : 'leetcode');
      const url = window.location.href;

      chrome.runtime.sendMessage({
        type: 'RECORD_SOLVE',
        payload: {
          problemId: canonicalId,
          title,
          slug,
          difficulty,
          site,
          url
        }
      }, (r) => {
        if (r?.stats) {
          userSettings = { ...userSettings, ...r.stats };
          persistSettings();
        } else {
          userSettings.solvedProblems = userSettings.solvedProblems || [];
          if (!userSettings.solvedProblems.some(p => (p.slug || p) === slug)) {
            userSettings.solvedProblems.unshift({
              canonicalId, slug, title, difficulty, site, url,
              solvedAt: new Date().toISOString(), nextRevisionDays: 1
            });
            userSettings.totalSolved = userSettings.solvedProblems.length;
            const d = difficulty.toLowerCase();
            if (userSettings.solvedStats && userSettings.solvedStats[d] !== undefined) {
              userSettings.solvedStats[d] += 1;
            }
            persistSettings();
          }
        }
        spawnEmojiBurst(window.innerWidth / 2, window.innerHeight / 2, 32);
        buddyWidget.say(`ACCEPTED! 🏆 You solved ${title} with Nudge! Count updated to ${userSettings.totalSolved}.`, 5000);
        this.render();
      });
    }

    renderRephraseCard() {
      if (!this.isStuck) return '';

      const analogy = this.hintData?.analogy || "Think of this step like a physical real-world process before thinking about code syntax.";
      const simplerAngle = this.hintData?.simplerAngle || "Focus on the smallest moving piece: what condition triggers state changes?";
      const takeaway = this.hintData?.bottleneckTakeaway || "Step-by-step invariant validation.";

      return `
        <div class="nudge-rephrase-card">
          <div class="nudge-rephrase-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 22px;">💡</span>
              <div>
                <div style="font-size: 13.5px; font-weight: 800; color: var(--nudge-espresso);">
                  Simpler Real-World Analogy & Breakdown
                </div>
                <div style="font-size: 11px; color: var(--nudge-text-muted);">
                  Reframing this step from an intuitive, ELI5 angle
                </div>
              </div>
            </div>
            <button id="nudge-rephrase-close" class="nudge-icon-btn" title="Back to standard view" style="width: auto; height: auto; padding: 2px 8px; font-size: 11px; border-radius: 6px; border: 1px solid var(--nudge-border);">
              ✕ Close
            </button>
          </div>

          <div class="nudge-rephrase-body">
            <div class="nudge-rephrase-analogy">
              <span style="font-weight: 800; color: var(--nudge-espresso); display: block; margin-bottom: 4px;">🧸 Real-World Metaphor:</span>
              <p style="margin: 0; line-height: 1.55;">${analogy}</p>
            </div>

            <div class="nudge-rephrase-angle" style="margin-top: 10px;">
              <span style="font-weight: 800; color: var(--nudge-espresso); display: block; margin-bottom: 4px;">🔍 Simpler Thinking Angle:</span>
              <p style="margin: 0; line-height: 1.55;">${simplerAngle.replace(/\n/g, '<br/>')}</p>
            </div>
          </div>

          <div class="nudge-rephrase-footer">
            <span style="font-size: 11.5px; color: var(--nudge-text-muted);">Tricky bottleneck? Record it for spaced review:</span>
            <button id="nudge-log-stuck-journal" class="nudge-btn-secondary" style="padding: 4px 10px; font-size: 11.5px; border-radius: 8px;">
              <span>📓</span>
              <span>Log to Mistake Journal</span>
            </button>
          </div>
        </div>
      `;
    }

    renderProblemCompletionCard() {
      const isSolved = this.isCurrentProblemSolved();
      const solvedProblem = (userSettings.solvedProblems || []).find(p => {
        const slug = (this.activeProblem?.slug || (this.activeProblem?.canonicalId || '').replace(/^[a-z]+:/, '')).toLowerCase();
        return (p.slug || p.canonicalId || '').toLowerCase().includes(slug);
      });
      const solvedDate = solvedProblem?.solvedAt ? new Date(solvedProblem.solvedAt).toLocaleDateString() : 'Today';

      return `
        <!-- Problem Completion & Solve Tracker -->
        <div class="nudge-completion-card ${isSolved ? 'solved' : ''}">
          <div class="nudge-completion-header">
            <span class="nudge-completion-icon">${isSolved ? '🎉' : '🏆'}</span>
            <div>
              <div class="nudge-completion-title">
                ${isSolved ? 'Problem Solved With Nudge!' : 'Finished Understanding & Solving This Problem?'}
              </div>
              <div class="nudge-completion-sub">
                ${isSolved 
                  ? `Completed on ${solvedDate}! This problem is safely recorded in your Spaced Revision Queue & Habit Studio.`
                  : 'Click below to mark this challenge complete, increment your "Problems Solved With Nudge" metric, and queue it for spaced retention!'}
              </div>
            </div>
          </div>
          ${isSolved ? `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--nudge-border);">
              <span class="nudge-badge-solved">✓ Solved with Nudge (${userSettings.totalSolved} Total Solved)</span>
              <button id="nudge-btn-open-habits-from-card" class="nudge-btn-secondary" style="padding: 5px 12px; font-size: 11.5px; border-radius: 8px;">
                <span>📊 View Habit Studio</span>
              </button>
            </div>
          ` : `
            <button id="nudge-btn-mark-solved" class="nudge-btn-solve-complete">
              <span>🎉</span>
              <span>I Solved & Understood This Problem!</span>
            </button>
          `}
        </div>
      `;
    }

    async fetchHint(level, isRephrase = false, confirmLastResort = false) {
      this.currentLevel = level;
      if (level > this.maxUnlockedLevel) {
        this.maxUnlockedLevel = level;
      }
      this.checkpointAnswered = false;
      this.isStuck = Boolean(isRephrase);

      try {
        const res = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'GET_HINT',
            payload: {
              problemId: this.activeProblem?.canonicalId || 'lc:two-sum',
              level,
              isRephrase,
              confirmLastResort,
              studentLevel: 'beginner',
              personality: userSettings.personality
            }
          }, (r) => resolve(r?.data || null));
        });

        this.hintData = res;
      } catch (e) {
        this.hintData = null;
      }

      this.render();
    }

    startQuoteRotator() {
      setInterval(() => {
        this.quoteIndex = (this.quoteIndex + 1) % MOTIVATION_QUOTES.length;
        const qEl = this.drawer.querySelector('#nudge-quote-text');
        if (qEl) qEl.textContent = MOTIVATION_QUOTES[this.quoteIndex];
      }, 30000);
    }

    render() {
      const avatar = getActiveAvatar();
      const probTitle = this.activeProblem ? this.activeProblem.title : 'Algorithmic Problem';
      const probDiff = this.activeProblem?.difficulty || 'Medium';

      this.drawer.innerHTML = `
        <div class="nudge-header">
          <div class="nudge-brand">
            <div class="nudge-brand-avatar">${avatar.emoji}</div>
            <div class="nudge-brand-text">
              <h2>Nudge Buddy</h2>
              <p>${probTitle}</p>
            </div>
          </div>
          <div class="nudge-header-actions">
            <div class="nudge-streak-pill" title="Current Daily Streak">
              <span>🔥</span>
              <span id="nudge-streak-count">${userSettings.streak}d</span>
            </div>
            <div class="nudge-solved-header-pill" title="Problems Solved With Nudge">
              <span>⚡</span>
              <span id="nudge-total-solved-count">${userSettings.totalSolved || 0}</span>
            </div>
            <button id="nudge-btn-settings" class="nudge-icon-btn" title="Open Customization & Habit Studio">⚙️</button>
            <button id="nudge-btn-close" class="nudge-icon-btn" title="Close Drawer">✕</button>
          </div>
        </div>

        <div class="nudge-ladder-wrap">
          <div class="nudge-ladder-track">
            <div class="nudge-ladder-line"></div>
            ${[0, 1, 2, 3, 4, 5].map((lvl) => {
              const isCompleted = lvl < this.maxUnlockedLevel;
              const isActive = lvl === this.currentLevel;
              const isLocked = lvl > this.maxUnlockedLevel;
              const isLastResort = lvl === 5;

              let classes = ['nudge-ladder-node'];
              if (isCompleted) classes.push('completed');
              else if (isActive) classes.push('active');
              else if (isLocked) classes.push('locked');
              if (isLastResort) classes.push('last-resort');

              const icon = isCompleted ? '✓' : (isLastResort ? '🛡️' : (isLocked ? '🔒' : `L${lvl + 1}`));

              return `
                <div class="${classes.join(' ')}" data-level="${lvl}" title="${LEVEL_TITLES[lvl]}">
                  ${icon}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="nudge-body">
          <div class="nudge-card ${this.currentLevel === 5 && !this.isConfirmedLastResort ? 'nudge-blur-container' : ''}">
            <div class="nudge-card-header">
              <span class="nudge-badge-level">LEVEL ${this.currentLevel + 1}: ${LEVEL_TITLES[this.currentLevel]}</span>
              <span class="nudge-badge-difficulty">${probDiff}</span>
            </div>

            <div class="${this.currentLevel === 5 && !this.isConfirmedLastResort ? 'nudge-blur-shield' : ''}">
              <div class="nudge-hint-prose">
                ${this.formatHintBody(this.hintData?.hintText || 'Analyzing problem invariants...')}
              </div>

              ${this.renderRephraseCard()}
              ${this.renderCheckpoint()}
              ${this.renderFullSolutionArea()}
              ${this.renderEdgeCases()}
            </div>

            ${this.currentLevel === 5 && !this.isConfirmedLastResort ? `
              <div class="nudge-blur-overlay">
                <span style="font-size: 36px;">🛡️</span>
                <h3>Last Resort Checkpoint</h3>
                <p>Revealing the full line-by-line solution reduces XP for this problem by 70%. Take two more minutes to test your invariant first!</p>
                <button id="nudge-btn-confirm-l6" class="nudge-btn-primary" style="margin-top: 10px;">
                  Reveal Full Explanation & Python Solution
                </button>
              </div>
            ` : ''}
          </div>

          <div class="nudge-actions-grid">
            ${this.currentLevel === 5 ? (
              this.isCurrentProblemSolved() ? `
                <button id="nudge-action-solved-status" class="nudge-btn-primary" style="background: #2e7d32; cursor: default;">
                  <span>✓</span>
                  <span>Solved with Nudge (${userSettings.totalSolved || 0} Total)</span>
                </button>
              ` : `
                <button id="nudge-btn-mark-solved-bottom" class="nudge-btn-primary" style="background: var(--nudge-espresso);">
                  <span>🎉</span>
                  <span>I Solved & Understood This Problem!</span>
                </button>
              `
            ) : `
              <button id="nudge-action-next" class="nudge-btn-primary">
                <span>🎉</span>
                <span>${this.currentLevel === this.maxUnlockedLevel ? 'Got it! Show me the next Nudge' : 'Advance to Next Level'}</span>
              </button>
            `}
            <button id="nudge-action-stuck" class="nudge-btn-secondary ${this.isStuck ? 'active-stuck' : ''}">
              <span>${this.isStuck ? '💡' : '❓'}</span>
              <span>${this.isStuck ? 'Hide Simpler Analogy' : "I'm still stuck on this"}</span>
            </button>
          </div>
        </div>

        <div class="nudge-footer-bar">
          <span class="nudge-footer-icon">✨</span>
          <span id="nudge-quote-text">${MOTIVATION_QUOTES[this.quoteIndex]}</span>
        </div>
      `;

      this.bindEvents();
    }

    renderCheckpoint() {
      const cp = this.hintData?.checkpoint;
      if (!cp) return '';

      return `
        <div class="nudge-checkpoint-box">
          <div class="nudge-checkpoint-title">
            <span>🧠</span>
            <span>Interactive Mental Checkpoint</span>
          </div>
          <p style="font-size: 13px; font-weight: 600; color: var(--nudge-text-primary);">${cp.question}</p>
          <div class="nudge-checkpoint-options">
            ${cp.options.map((opt, idx) => `
              <button class="nudge-choice-btn" data-index="${idx}">
                <span>${opt.text}</span>
                <span class="nudge-choice-status"></span>
              </button>
            `).join('')}
          </div>
          <div id="nudge-checkpoint-fb" class="nudge-checkpoint-feedback"></div>
        </div>
      `;
    }

    renderFullSolutionArea() {
      if (this.currentLevel < 5 || (!this.isConfirmedLastResort && this.currentLevel === 5)) return '';

      return `
        <!-- Complete Python Solution -->
        <div style="margin-top: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 12px; font-weight: 800; color: var(--nudge-text-muted); text-transform: uppercase;">
              Python 3 Solution (Cleanest Accepted Model)
            </span>
            <button id="nudge-copy-code" class="nudge-icon-btn" style="width: auto; height: auto; padding: 2px 8px; font-size: 11px; font-weight: 700; border: 1px solid var(--nudge-border); border-radius: 6px;">
              Copy Code
            </button>
          </div>
          <pre class="nudge-code-block">${this.hintData?.fullCode || '# Solution'}</pre>
        </div>

        <!-- Line by Line Breakdown -->
        ${this.hintData?.lineBreakdowns?.length ? `
          <div style="margin-top: 14px;">
            <div style="font-size: 12px; font-weight: 800; color: var(--nudge-text-muted); text-transform: uppercase; margin-bottom: 8px;">
              Line-by-Line Breakdown
            </div>
            <div class="nudge-line-breakdown">
              ${this.hintData.lineBreakdowns.map(item => `
                <div class="nudge-line-item">
                  <b>${item.line}</b>
                  <span>${item.explanation}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Alternative Approaches Accordion -->
        ${this.hintData?.alternativeSolutions?.length ? `
          <div class="nudge-alt-section">
            <button id="nudge-toggle-alt" class="nudge-alt-toggle">
              <span>Alternative Solutions & Trade-Offs (${this.hintData.alternativeSolutions.length})</span>
              <span>▾</span>
            </button>
            <div id="nudge-alt-drawer" class="nudge-alt-content" style="display: none;">
              ${this.hintData.alternativeSolutions.map(alt => `
                <div style="margin-bottom: 14px; border-bottom: 1px dashed var(--nudge-border); padding-bottom: 10px;">
                  <div style="font-weight: 800; color: var(--nudge-espresso); font-size: 13.5px;">${alt.title} (${alt.technique})</div>
                  <div style="font-size: 12px; color: var(--nudge-text-muted); margin: 3px 0;">
                    Time: <b>${alt.timeComplexity}</b> | Space: <b>${alt.spaceComplexity}</b>
                  </div>
                  <p style="font-size: 12.5px; margin: 4px 0 8px;">${alt.tradeOff}</p>
                  <pre class="nudge-code-block">${alt.codeSnippet}</pre>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Similar Problems Recommendation -->
        ${this.hintData?.similarProblems?.length ? `
          <div style="margin-top: 16px;">
            <div style="font-size: 12px; font-weight: 800; color: var(--nudge-text-muted); text-transform: uppercase;">
              🧩 Mastered this pattern? Try next:
            </div>
            <div class="nudge-similar-list">
              ${this.hintData.similarProblems.map(p => `
                <a href="${p.url}" target="_blank" class="nudge-similar-item">
                  <div>
                    <div style="font-weight: 700;">${p.title}</div>
                    <div style="font-size: 11.5px; color: var(--nudge-text-muted); font-weight: 500;">${p.patternReason}</div>
                  </div>
                  <span class="nudge-badge-difficulty">${p.difficulty}</span>
                </a>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Complexity Summary Learning Card -->
        ${this.hintData?.complexityNote ? `
          <div class="nudge-complexity-box">
            <div class="nudge-complexity-title">
              <span>⏱️</span>
              <span>Complexity & Scale Learning Note</span>
            </div>
            <div class="nudge-complexity-details">
              <div>• <b>Time Complexity:</b> ${this.hintData.complexityNote.time}</div>
              <div>• <b>Space Complexity:</b> ${this.hintData.complexityNote.space}</div>
              <p style="margin-top: 6px; font-size: 12.5px; color: var(--nudge-text-muted);">${this.hintData.complexityNote.rationale}</p>
            </div>
          </div>
        ` : ''}

        <!-- Final Problem Completion Action -->
        ${this.renderProblemCompletionCard()}
      `;
    }

    renderEdgeCases() {
      if (!this.hintData?.edgeCases || this.currentLevel !== 0) return '';
      return `
        <div style="margin-top: 14px; padding: 12px 16px; background: var(--nudge-card-warm); border-radius: 14px; border: 1px solid var(--nudge-border);">
          <div style="font-size: 11.5px; font-weight: 800; color: var(--nudge-text-muted); text-transform: uppercase; margin-bottom: 6px;">
            ⚠️ Essential Edge Cases to Consider
          </div>
          <ul style="padding-left: 18px; font-size: 13px; color: var(--nudge-text-primary); line-height: 1.55;">
            ${this.hintData.edgeCases.map(ec => `<li>${ec}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    formatHintBody(rawText) {
      if (!rawText) return 'Analyzing problem logic...';

      const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const formatInline = (str) => {
        if (!str) return '';
        return str
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code class="nudge-inline-code">$1</code>')
          .replace(/\$\$([^\$]+)\$\$/g, '<span class="nudge-math-inline">$1</span>');
      };

      // 1. Preserve and extract code blocks (```...```)
      const codeBlocks = [];
      let text = rawText.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
        const idx = codeBlocks.length;
        codeBlocks.push(`<pre class="nudge-code-block"><code>${escapeHtml(code.trim())}</code></pre>`);
        return `\n\n__CODE_BLOCK_${idx}__\n\n`;
      });

      const rawBlocks = text.split(/\n\n+/);
      const renderedBlocks = [];

      for (let block of rawBlocks) {
        block = block.trim();
        if (!block) continue;

        if (block.startsWith('__CODE_BLOCK_')) {
          const idx = Number(block.replace(/__CODE_BLOCK_(\d+)__/, '$1'));
          renderedBlocks.push(codeBlocks[idx] || '');
          continue;
        }

        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

        // 2. Render Markdown Tables
        if (lines.length >= 2 && lines.every(l => l.startsWith('|') && l.endsWith('|'))) {
          const headerLine = lines[0];
          const headers = headerLine.split('|').map(s => s.trim()).filter(Boolean);
          const dataRows = lines.slice(1).filter(l => !/^[\|\s\-:]+$/.test(l));
          const htmlTable = `
            <div class="nudge-example-box">
              <table>
                <thead>
                  <tr>${headers.map(h => `<th>${formatInline(h)}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${dataRows.map(rowLine => {
                    const cells = rowLine.split('|').map(s => s.trim()).filter(Boolean);
                    return `<tr>${cells.map(c => `<td>${formatInline(c)}</td>`).join('')}</tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `;
          renderedBlocks.push(htmlTable);
          continue;
        }

        // 3. Render Headings (### or ##)
        if (block.startsWith('### ')) {
          renderedBlocks.push(`<h4 class="nudge-hint-subheading">${formatInline(block.replace(/^###\s+/, ''))}</h4>`);
          continue;
        }
        if (block.startsWith('## ')) {
          renderedBlocks.push(`<h3 class="nudge-hint-heading">${formatInline(block.replace(/^##\s+/, ''))}</h3>`);
          continue;
        }

        // 4. Render Blockquotes / Callout Quotes (> ...)
        if (lines.every(l => l.startsWith('>'))) {
          const quoteText = lines.map(l => l.replace(/^>\s*/, '')).join(' ');
          renderedBlocks.push(`<div class="nudge-callout-quote">${formatInline(quoteText)}</div>`);
          continue;
        }

        // 5. Render Bullet Lists (• or - or *)
        if (lines.every(l => /^(\•|\-|\*)\s+/.test(l))) {
          renderedBlocks.push(`<ul class="nudge-hint-list">${lines.map(l => `<li>${formatInline(l.replace(/^(\•|\-|\*)\s+/, ''))}</li>`).join('')}</ul>`);
          continue;
        }

        // 6. Render Numbered Lists (1. 2. 3.)
        if (lines.every(l => /^\d+\.\s+/.test(l))) {
          renderedBlocks.push(`<ol class="nudge-hint-list">${lines.map(l => `<li>${formatInline(l.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`);
          continue;
        }

        // 7. Standard Paragraph
        renderedBlocks.push(`<p>${formatInline(block).replace(/\n/g, '<br/>')}</p>`);
      }

      return renderedBlocks.join('');
    }

    bindEvents() {
      this.drawer.querySelector('#nudge-btn-close')?.addEventListener('click', () => this.setOpen(false));
      this.drawer.querySelector('#nudge-btn-settings')?.addEventListener('click', () => this.onOpenModal());

      // Milestone clicks
      this.drawer.querySelectorAll('.nudge-ladder-node').forEach((node) => {
        node.addEventListener('click', () => {
          const targetLevel = Number(node.getAttribute('data-level'));
          if (targetLevel > this.maxUnlockedLevel) {
            node.classList.add('nudge-shake');
            setTimeout(() => node.classList.remove('nudge-shake'), 400);
            buddyWidget.say("Hold on, buddy! Let's master this step first! 🐾", 3500);
          } else {
            this.fetchHint(targetLevel);
          }
        });
      });

      // Interactive Checkpoint Buttons
      const cp = this.hintData?.checkpoint;
      if (cp) {
        const fbEl = this.drawer.querySelector('#nudge-checkpoint-fb');
        this.drawer.querySelectorAll('.nudge-choice-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-index'));
            const option = cp.options[idx];

            this.drawer.querySelectorAll('.nudge-choice-btn').forEach(b => {
              b.classList.remove('selected-correct', 'selected-incorrect');
            });

            if (option.isCorrect) {
              btn.classList.add('selected-correct');
              fbEl.className = 'nudge-checkpoint-feedback correct';
              fbEl.textContent = `🎉 ${option.feedback}`;
              buddyWidget.say('Brilliant insight! You nailed the invariant! ✨', 3500);
              this.checkpointAnswered = true;
              userSettings.checkpointCount = (userSettings.checkpointCount || 0) + 1;
              if (userSettings.checkpointCount >= 5) {
                const b2 = userSettings.badges?.find(b => b.id === 'b2');
                if (b2) b2.unlocked = true;
              }
              persistSettings();
            } else {
              btn.classList.add('selected-incorrect');
              fbEl.className = 'nudge-checkpoint-feedback incorrect';
              fbEl.textContent = `💡 Hint: ${option.feedback}`;
              buddyWidget.say("Take another look at the boundary conditions! You've got this.", 3500);
              
              // Automatically record in Mistake Journal for real revision!
              const correctOpt = cp.options?.find(o => o.isCorrect);
              chrome.runtime.sendMessage({
                type: 'RECORD_MISTAKE',
                payload: {
                  problemTitle: this.activeProblem?.title,
                  question: cp.question,
                  missedAnswer: option.text,
                  correctAnswer: correctOpt ? correctOpt.text : 'Valid boundary adjustment',
                  takeaway: option.feedback
                }
              }, (res) => {
                if (res?.journal) userSettings.journal = res.journal;
              });
            }
          });
        });
      }

      // Next level action button
      this.drawer.querySelector('#nudge-action-next')?.addEventListener('click', (e) => {
        if (this.currentLevel < 5) {
          const next = this.currentLevel + 1;
          const rect = e.currentTarget.getBoundingClientRect();
          spawnEmojiBurst(rect.left + rect.width / 2, rect.top);
          this.onTriggerCelebration();
          this.fetchHint(next);
        }
      });

      // Still stuck action button (toggles rich real-world analogy & breakdown)
      this.drawer.querySelector('#nudge-action-stuck')?.addEventListener('click', () => {
        this.isStuck = !this.isStuck;
        if (this.isStuck) {
          buddyWidget.say("No worries, buddy! Let's reframe this from a cozy, simpler angle 💡", 4000);
          this.fetchHint(this.currentLevel, true);
        } else {
          this.render();
        }
      });

      // Close rephrase card
      this.drawer.querySelector('#nudge-rephrase-close')?.addEventListener('click', () => {
        this.isStuck = false;
        this.render();
      });

      // Log stuck bottleneck to Mistake Journal
      this.drawer.querySelector('#nudge-log-stuck-journal')?.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const slug = (this.activeProblem?.slug || (this.activeProblem?.canonicalId || '').replace(/^[a-z]+:/, '') || 'two-sum').toLowerCase();
        const title = this.activeProblem?.title || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const takeaway = this.hintData?.bottleneckTakeaway || this.hintData?.simplerAngle || 'Understood core invariant after reviewing real-world analogy.';

        chrome.runtime.sendMessage({
          type: 'RECORD_MISTAKE',
          payload: {
            problemTitle: title,
            question: `Level ${this.currentLevel + 1}: ${LEVEL_TITLES[this.currentLevel]} Bottleneck`,
            missedAnswer: 'Needed simpler real-world analogy',
            takeaway: takeaway
          }
        }, (res) => {
          if (res?.journal) {
            userSettings.journal = res.journal;
            persistSettings();
          }
          btn.innerHTML = '<span>✓</span> <span>Logged to Journal!</span>';
          btn.style.borderColor = '#2e7d32';
          btn.style.color = '#2e7d32';
          buddyWidget.say('Logged to your Mistake Journal! 📓 Review it anytime in your Habit Studio.', 4000);
        });
      });

      // Mark problem solved buttons
      this.drawer.querySelector('#nudge-btn-mark-solved')?.addEventListener('click', () => this.markCurrentProblemSolved());
      this.drawer.querySelector('#nudge-btn-mark-solved-bottom')?.addEventListener('click', () => this.markCurrentProblemSolved());
      this.drawer.querySelector('#nudge-btn-open-habits-from-card')?.addEventListener('click', () => this.onOpenModal());

      // Confirm Last Resort Level 6 button
      this.drawer.querySelector('#nudge-btn-confirm-l6')?.addEventListener('click', () => {
        this.isConfirmedLastResort = true;
        this.fetchHint(5, false, true);
      });

      // Copy code button
      this.drawer.querySelector('#nudge-copy-code')?.addEventListener('click', (e) => {
        if (this.hintData?.fullCode) {
          navigator.clipboard.writeText(this.hintData.fullCode);
          const btn = e.currentTarget;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy Code'; }, 1800);
        }
      });

      // Alternative solutions toggle
      const altToggle = this.drawer.querySelector('#nudge-toggle-alt');
      const altDrawer = this.drawer.querySelector('#nudge-alt-drawer');
      if (altToggle && altDrawer) {
        altToggle.addEventListener('click', () => {
          const isHidden = altDrawer.style.display === 'none';
          altDrawer.style.display = isHidden ? 'block' : 'none';
          altToggle.querySelector('span:last-child').textContent = isHidden ? '▴' : '▾';
        });
      }
    }
  }

  // --- Bento-Grid Habit Studio Modal (REAL METRICS & MISTAKE JOURNAL) ---
  class BentoDashboardModal {
    constructor(hostShadow, onSettingsChanged) {
      this.hostShadow = hostShadow;
      this.onSettingsChanged = onSettingsChanged;
      this.showAddForm = false;

      this.backdrop = document.createElement('div');
      this.backdrop.className = 'nudge-modal-backdrop';
      this.hostShadow.appendChild(this.backdrop);

      this.render();
    }

    async setOpen(open) {
      if (open) {
        await loadSettings();
        this.showAddForm = false;
        this.render();
        this.backdrop.classList.add('open');
      } else {
        this.backdrop.classList.remove('open');
      }
    }

    render() {
      const activeChar = getActiveAvatar();

      this.backdrop.innerHTML = `
        <div class="nudge-bento-dialog">
          <div class="nudge-bento-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 26px;">🧸</span>
              <h2>Buddy Studio & Real Habit Tracker</h2>
            </div>
            <button id="nudge-modal-close" class="nudge-icon-btn">✕</button>
          </div>

          <div class="nudge-bento-grid">
            <!-- Real Streak Flame Card -->
            <div class="nudge-bento-card nudge-bento-col-4">
              <div style="font-size: 11.5px; font-weight: 800; color: var(--nudge-text-muted); text-transform: uppercase;">
                Daily Practice Flame
              </div>
              <div class="nudge-stat-large" style="margin-top: 8px;">
                <span>🔥</span>
                <span>${userSettings.streak} Days</span>
              </div>
              <p style="font-size: 12px; color: var(--nudge-text-muted); margin-top: 6px;">
                Live browser-stored streak. Practice daily on LeetCode to build persistent recall!
              </p>
            </div>

            <!-- Problem Solve Count Card -->
            <div class="nudge-bento-card nudge-bento-col-4">
              <div style="font-size: 11.5px; font-weight: 800; color: var(--nudge-text-muted); text-transform: uppercase;">
                Problems Solved With Nudge
              </div>
              <div class="nudge-stat-large" style="margin-top: 8px;">
                <span>⚡</span>
                <span>${userSettings.totalSolved}</span>
              </div>
              <div style="display: flex; gap: 8px; margin-top: 8px; font-size: 11.5px; font-weight: 700;">
                <span style="color: #3E7B5C;">🟢 Easy: ${userSettings.solvedStats.easy}</span>
                <span style="color: #C67D25;">🟡 Med: ${userSettings.solvedStats.medium}</span>
                <span style="color: #8C473A;">🔴 Hard: ${userSettings.solvedStats.hard}</span>
              </div>
            </div>

            <!-- Pattern Radar -->
            <div class="nudge-bento-card nudge-bento-col-4">
              <div style="font-size: 11.5px; font-weight: 800; color: var(--nudge-text-muted); text-transform: uppercase;">
                Pattern Radar Mastery
              </div>
              <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
                ${Object.entries(userSettings.patternMastery).map(([pat, score]) => `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700;">
                      <span>${pat}</span>
                      <span>${score}%</span>
                    </div>
                    <div style="height: 5px; background: var(--nudge-card-warm); border-radius: 4px; overflow: hidden; margin-top: 2px;">
                      <div style="width: ${score}%; height: 100%; background: var(--nudge-espresso); border-radius: 4px;"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Real Mistake Journal Card -->
            <div class="nudge-bento-card nudge-bento-col-12">
              <div style="font-size: 12px; font-weight: 800; color: var(--nudge-text-muted); text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span>📓 Real Mistake Journal (Auto-Logged from Checkpoints & Bottlenecks)</span>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span class="nudge-badge-count">${userSettings.journal?.length || 0} Entries</span>
                  <button id="nudge-btn-toggle-add-journal" class="nudge-btn-secondary" style="padding: 2px 10px; font-size: 11px; border-radius: 6px;">+ Log Pitfall</button>
                  ${userSettings.journal?.length ? `<button id="nudge-btn-clear-all-journal" class="nudge-btn-secondary" style="padding: 2px 8px; font-size: 11px; border-radius: 6px; color: #8C473A;">Clear All</button>` : ''}
                </div>
              </div>

              ${this.showAddForm ? `
                <div style="margin-bottom: 12px; padding: 12px; background: var(--nudge-card-warm); border-radius: 12px; border: 1px solid var(--nudge-border);">
                  <div style="font-weight: 800; font-size: 12px; color: var(--nudge-espresso); margin-bottom: 6px;">Add Tricky Concept / Pitfall to Journal:</div>
                  <input id="nudge-journal-input-text" type="text" placeholder="e.g. Off-by-one error: forgot +1 in window length formula (right - left + 1)" style="width: 100%; box-sizing: border-box; padding: 8px 10px; font-size: 12.5px; border-radius: 8px; border: 1.5px solid var(--nudge-border); margin-bottom: 8px; font-family: inherit;" />
                  <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="nudge-btn-cancel-journal" class="nudge-btn-secondary" style="padding: 4px 10px; font-size: 11px;">Cancel</button>
                    <button id="nudge-btn-save-journal" class="nudge-btn-primary" style="padding: 4px 12px; font-size: 11px;">Save Entry</button>
                  </div>
                </div>
              ` : ''}

              <div class="nudge-journal-list">
                ${userSettings.journal?.length ? userSettings.journal.map(j => `
                  <div class="nudge-journal-entry ${j.mastered ? 'mastered' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                      <div style="flex: 1;">
                        <b>${j.problemTitle || j.problem || 'Algorithmic Problem'} • <span style="font-size: 11px; font-weight: 500; color: var(--nudge-text-muted);">${j.date || j.recordedAt || 'Recent Session'}</span></b>
                        <div style="color: var(--nudge-text-muted); font-size: 11.5px; margin: 3px 0;">
                          ${j.question ? `<b>Bottleneck:</b> ${j.question}` : ''}
                        </div>
                        ${j.missedAnswer ? `<div style="font-size: 11.5px; color: #c62828; text-decoration: line-through; margin-bottom: 2px;">Missed: ${j.missedAnswer}</div>` : ''}
                        <div style="color: var(--nudge-espresso); font-weight: 600; font-size: 12px;">
                          💡 <b>Takeaway:</b> ${j.takeaway || j.correctAnswer || 'Understood core pattern.'}
                        </div>
                      </div>
                      <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
                        <button class="nudge-btn-master-journal" data-id="${j.id}" title="${j.mastered ? 'Mark as to revise' : 'Mark as mastered'}" style="padding: 3px 8px; font-size: 11px; border-radius: 6px; border: 1px solid var(--nudge-border); cursor: pointer; background: ${j.mastered ? '#e8f5e9; color: #2e7d32; font-weight: 700;' : '#FFFFFF; color: var(--nudge-text-primary);'}">
                          ${j.mastered ? '✓ Mastered' : 'Mark Mastered'}
                        </button>
                        <button class="nudge-btn-del-journal" data-id="${j.id}" title="Remove entry" style="padding: 3px 8px; font-size: 11px; border-radius: 6px; border: 1px solid var(--nudge-border); cursor: pointer; background: #FFFFFF; color: #8C473A;">
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('') : `
                  <div style="padding: 20px; text-align: center; color: var(--nudge-text-muted); font-size: 13px;">
                    <div style="font-size: 24px; margin-bottom: 6px;">📖</div>
                    <b>Mistake Journal is Clean!</b>
                    <p style="margin: 4px auto 0; max-width: 400px; font-size: 12px; line-height: 1.45;">
                      When you miss an interactive checkpoint or click <b>"I'm still stuck on this"</b> in the hint ladder, tricky bottlenecks are auto-recorded here for spaced review! You can also click <b>+ Log Pitfall</b> to jot down custom edge cases.
                    </p>
                  </div>
                `}
              </div>
            </div>

            <!-- Avatar Wardrobe Customization -->
            <div class="nudge-bento-card nudge-bento-col-6">
              <div style="font-size: 12px; font-weight: 800; color: var(--nudge-text-muted); text-transform: uppercase; margin-bottom: 10px;">
                Choose Companion Avatar
              </div>
              <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <button class="nudge-gender-tab ${userSettings.gender === 'female' ? 'active' : ''}" data-gender="female" style="padding: 6px 14px; border-radius: 10px; font-weight: 700; border: 1.5px solid var(--nudge-border); cursor: pointer; background: ${userSettings.gender === 'female' ? 'var(--nudge-espresso); color: #FFF' : '#FFF'}">
                  Female Companions
                </button>
                <button class="nudge-gender-tab ${userSettings.gender === 'male' ? 'active' : ''}" data-gender="male" style="padding: 6px 14px; border-radius: 10px; font-weight: 700; border: 1.5px solid var(--nudge-border); cursor: pointer; background: ${userSettings.gender === 'male' ? 'var(--nudge-espresso); color: #FFF' : '#FFF'}">
                  Male Companions
                </button>
              </div>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                ${(AVATAR_CHARACTERS[userSettings.gender] || AVATAR_CHARACTERS.female).map(char => `
                  <div class="nudge-char-card ${char.id === userSettings.avatarId ? 'selected' : ''}" data-id="${char.id}" style="padding: 12px; border-radius: 14px; border: 2px solid ${char.id === userSettings.avatarId ? 'var(--nudge-espresso)' : 'var(--nudge-border)'}; text-align: center; cursor: pointer; background: ${char.id === userSettings.avatarId ? 'var(--nudge-accent-rose)' : 'var(--nudge-card-warm)'};">
                    <div style="font-size: 32px;">${char.emoji}</div>
                    <div style="font-weight: 800; font-size: 13px; color: var(--nudge-text-primary); margin-top: 4px;">${char.name}</div>
                    <div style="font-size: 10.5px; color: var(--nudge-text-muted);">${char.desc}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Personality Selector -->
            <div class="nudge-bento-card nudge-bento-col-6">
              <div style="font-size: 12px; font-weight: 800; color: var(--nudge-text-muted); text-transform: uppercase; margin-bottom: 10px;">
                Buddy Persona & Voice
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${[
                  { id: 'cheerleader', name: 'The Cheerleader', desc: 'Warm, positive, celebrates every small insight.' },
                  { id: 'mentor', name: 'The Socratic Mentor', desc: 'Answers with thought-provoking questions and paper dry-runs.' },
                  { id: 'zen_master', name: 'The Zen Master', desc: 'Calm, anti-stress, keeps frustration far away.' },
                  { id: 'strict_coach', name: 'The Strict Coach', desc: 'Direct, focused on constraints and optimal O(N) bounds.' }
                ].map(p => `
                  <label style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--nudge-card-warm); border-radius: 10px; cursor: pointer; border: 1px solid var(--nudge-border);">
                    <input type="radio" name="nudge-personality" value="${p.id}" ${userSettings.personality === p.id ? 'checked' : ''} />
                    <div>
                      <div style="font-weight: 800; font-size: 12.5px; color: var(--nudge-text-primary);">${p.name}</div>
                      <div style="font-size: 11px; color: var(--nudge-text-muted);">${p.desc}</div>
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;

      this.bindEvents();
    }

    bindEvents() {
      this.backdrop.querySelector('#nudge-modal-close')?.addEventListener('click', () => this.setOpen(false));
      this.backdrop.addEventListener('click', (e) => {
        if (e.target === this.backdrop) this.setOpen(false);
      });

      this.backdrop.querySelectorAll('.nudge-gender-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          userSettings.gender = btn.getAttribute('data-gender');
          userSettings.avatarId = AVATAR_CHARACTERS[userSettings.gender][0].id;
          persistSettings();
          this.render();
          this.onSettingsChanged();
        });
      });

      this.backdrop.querySelectorAll('.nudge-char-card').forEach(card => {
        card.addEventListener('click', () => {
          userSettings.avatarId = card.getAttribute('data-id');
          persistSettings();
          this.render();
          this.onSettingsChanged();
        });
      });

      this.backdrop.querySelectorAll('input[name="nudge-personality"]').forEach(input => {
        input.addEventListener('change', () => {
          userSettings.personality = input.value;
          persistSettings();
          this.onSettingsChanged();
        });
      });

      // Mistake Journal Interactions
      this.backdrop.querySelector('#nudge-btn-toggle-add-journal')?.addEventListener('click', () => {
        this.showAddForm = !this.showAddForm;
        this.render();
      });

      this.backdrop.querySelector('#nudge-btn-cancel-journal')?.addEventListener('click', () => {
        this.showAddForm = false;
        this.render();
      });

      this.backdrop.querySelector('#nudge-btn-save-journal')?.addEventListener('click', () => {
        const input = this.backdrop.querySelector('#nudge-journal-input-text');
        const text = input ? input.value.trim() : '';
        if (text) {
          chrome.runtime.sendMessage({
            type: 'RECORD_MISTAKE',
            payload: {
              problemTitle: consoleDrawer?.activeProblem?.title || 'Algorithmic Note',
              question: 'Custom Bottleneck / Pitfall',
              takeaway: text
            }
          }, (res) => {
            if (res?.journal) {
              userSettings.journal = res.journal;
              persistSettings();
            }
            this.showAddForm = false;
            this.render();
            this.onSettingsChanged();
          });
        }
      });

      this.backdrop.querySelectorAll('.nudge-btn-master-journal').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          chrome.runtime.sendMessage({
            type: 'MARK_MISTAKE_MASTERED',
            payload: { id }
          }, (res) => {
            if (res?.journal) {
              userSettings.journal = res.journal;
              persistSettings();
            } else {
              userSettings.journal = (userSettings.journal || []).map(j => j.id === id ? { ...j, mastered: !j.mastered } : j);
              persistSettings();
            }
            this.render();
          });
        });
      });

      this.backdrop.querySelectorAll('.nudge-btn-del-journal').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          chrome.runtime.sendMessage({
            type: 'DELETE_MISTAKE',
            payload: { id }
          }, (res) => {
            if (res?.journal) {
              userSettings.journal = res.journal;
              persistSettings();
            } else {
              userSettings.journal = (userSettings.journal || []).filter(j => j.id !== id);
              persistSettings();
            }
            this.render();
          });
        });
      });

      this.backdrop.querySelector('#nudge-btn-clear-all-journal')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your Mistake Journal?')) {
          chrome.runtime.sendMessage({ type: 'CLEAR_JOURNAL' }, (res) => {
            userSettings.journal = [];
            persistSettings();
            this.render();
          });
        }
      });
    }
  }

  // --- Master Mount & Runtime Setup ---
  const adapter = new PlatformAdapter();

  let mountHost = document.getElementById('nudge-buddy-host');
  if (mountHost && mountHost.shadowRoot) {
    return;
  }

  if (!mountHost) {
    mountHost = document.createElement('div');
    mountHost.id = 'nudge-buddy-host';
    (document.body || document.documentElement).appendChild(mountHost);
  }
  const shadowRoot = mountHost.shadowRoot || (mountHost.attachShadow ? mountHost.attachShadow({ mode: 'open' }) : mountHost);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('src/styles/theme.css');
  shadowRoot.appendChild(link);

  const rootContainer = document.createElement('div');
  rootContainer.className = 'nudge-root';
  shadowRoot.appendChild(rootContainer);

  let buddyWidget = null;
  let consoleDrawer = null;

  const bentoModal = new BentoDashboardModal(rootContainer, () => {
    if (buddyWidget) buddyWidget.updateAvatarDisplay();
    if (consoleDrawer) consoleDrawer.render();
  });

  consoleDrawer = new NudgeConsoleDrawer(
    rootContainer,
    () => bentoModal.setOpen(true),
    () => {
      if (buddyWidget) buddyWidget.say("Keep pushing, buddy! Every line of code is progress! 🚀", 4000);
    }
  );

  buddyWidget = new FloatingBuddyWidget(rootContainer, () => {
    const wasOpen = consoleDrawer.isOpen();
    consoleDrawer.setOpen(!wasOpen);
    if (!wasOpen) {
      buddyWidget.say(`Hey! Let's solve ${consoleDrawer.activeProblem?.title || 'this'} together! 🐾`, 3500);
    }
  });

  let lastProblemSlug = '';
  async function syncActiveProblem() {
    const details = await adapter.getProblemDetails();
    if (details && details.slug !== lastProblemSlug) {
      lastProblemSlug = details.slug;
      consoleDrawer.setProblem(details);
    }
  }
  syncActiveProblem();

  // Route change detector for SPA navigations
  let lastUrl = window.location.href;
  const routeObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(syncActiveProblem, 400);
    }
  });
  routeObserver.observe(document, { subtree: true, childList: true });
  window.addEventListener('popstate', () => setTimeout(syncActiveProblem, 300));

  // Proactive Stuck Detection & Inactivity Monitor (Phase 3 Roadmap)
  let consecutiveFailures = 0;
  let inactivityTimer = null;
  const INACTIVITY_THRESHOLD_MS = 180000; // 3 minutes idle

  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (!consoleDrawer.isOpen() && consoleDrawer.activeProblem) {
        buddyWidget.say("Taking a breather? When you're ready, tap me for a quick guiding observation! 💡", 5500);
      }
    }, INACTIVITY_THRESHOLD_MS);
  }

  ['keydown', 'mousemove', 'click', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });
  resetInactivityTimer();

  // Submission listener updates real storage stats!
  adapter.onSubmission((res) => {
    if (res.status === 'Accepted') {
      consecutiveFailures = 0;
      buddyWidget.setConcerned(false);
      buddyWidget.say('ACCEPTED! You built serious algorithmic muscle today! 🏆', 6000);
      
      chrome.runtime.sendMessage({
        type: 'RECORD_SOLVE',
        payload: {
          problemId: consoleDrawer.activeProblem?.canonicalId,
          title: consoleDrawer.activeProblem?.title,
          slug: consoleDrawer.activeProblem?.slug,
          difficulty: consoleDrawer.activeProblem?.difficulty,
          site: consoleDrawer.activeProblem?.site,
          url: window.location.href
        }
      }, (r) => {
        if (r?.stats) {
          userSettings = { ...userSettings, ...r.stats };
          consoleDrawer.render();
        }
      });

      spawnEmojiBurst(window.innerWidth / 2, window.innerHeight / 2, 24);
    } else {
      consecutiveFailures++;
      buddyWidget.setConcerned(true);
      if (consecutiveFailures >= 2) {
        buddyWidget.say(`Two tricky runs in a row! Want to open Level 2 to verify our loop invariant together? 🐾`, 6000);
      } else {
        buddyWidget.say(`Don't sweat the ${res.status}! Bugs are just unexamined clues. Want a nudge?`, 5000);
      }
    }
  });

  // Alt + H Keyboard Shortcut
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'h' || e.key === 'H')) {
      e.preventDefault();
      consoleDrawer.setOpen(!consoleDrawer.isOpen());
    }
  });

  // Listen for popup messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_DRAWER') {
      const wasOpen = consoleDrawer.isOpen();
      consoleDrawer.setOpen(!wasOpen);
      if (!wasOpen) {
        buddyWidget.say(`Hey! Let's solve ${consoleDrawer.activeProblem?.title || 'this'} together! 🐾`, 3500);
      }
      sendResponse({ success: true, open: !wasOpen });
      return true;
    }
  });
})();
