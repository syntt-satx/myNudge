// Nudge Habit Studio & Spaced Revision Controller (100% Real Tracking, Zero Dummy Data)
document.addEventListener('DOMContentLoaded', async () => {
  const EMPTY_SETTINGS = {
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
    journal: [],
    badges: []
  };

  let settings = { ...EMPTY_SETTINGS };

  try {
    const data = await chrome.storage.local.get(['nudge_user_settings']);
    if (data?.nudge_user_settings) {
      settings = { ...EMPTY_SETTINGS, ...data.nudge_user_settings };
    }
  } catch (e) {
    console.warn('[Nudge Options] Using fresh state:', e);
  }

  // Real Calendar Day Streak Calculation
  const today = new Date().toISOString().split('T')[0];
  if (settings.lastActiveDate && settings.lastActiveDate !== today) {
    const lastTime = new Date(settings.lastActiveDate + 'T00:00:00Z').getTime();
    const todayTime = new Date(today + 'T00:00:00Z').getTime();
    const diffDays = Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      // Maintained!
    } else if (diffDays > 1) {
      settings.streak = 1; // Missed days, streak resets
    }
    settings.lastActiveDate = today;
    try {
      await chrome.storage.local.set({ nudge_user_settings: settings });
    } catch (e) {}
  }

  // Update Stats Header with real values
  const totalSolvedCount = settings.solvedProblems?.length || 0;
  const journalCount = settings.journal?.length || 0;
  document.getElementById('streak-count').textContent = `🔥 ${settings.streak || 1} Day Streak`;
  document.getElementById('solved-count').textContent = `🏆 ${totalSolvedCount} Solved`;
  document.getElementById('journal-count').textContent = `📖 ${journalCount} Journal Entries`;

  const avatarEmojis = {
    chloe: '🐰', maya: '🐱', tara: '🐼',
    neo: '🦊', alex: '🦁', kai: '🐻'
  };
  const badgeEl = document.getElementById('buddy-avatar-badge');
  if (badgeEl) badgeEl.textContent = avatarEmojis[settings.avatarId] || '🐰';

  // Render Real Revision Queue
  const revisionList = document.getElementById('revision-list');
  revisionList.innerHTML = '';

  if (!settings.solvedProblems || settings.solvedProblems.length === 0) {
    revisionList.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--nudge-text-muted);">
        <div style="font-size: 2.8rem; margin-bottom: 0.6rem;">🌱</div>
        <h3 style="font-size: 1.15rem; color: var(--nudge-text-primary); margin-bottom: 0.35rem; font-weight: 800;">No Problems Solved Yet</h3>
        <p style="font-size: 0.88rem; max-width: 340px; margin: 0 auto 1.4rem; line-height: 1.5;">
          Solve your first challenge on LeetCode, GeeksforGeeks, or HackerRank to start your spaced revision queue!
        </p>
        <a href="https://leetcode.com/problemset/all/" target="_blank" class="btn-action">Start on LeetCode 🚀</a>
      </div>
    `;
  } else {
    settings.solvedProblems.forEach(p => {
      const item = document.createElement('div');
      item.className = 'revision-item';

      const diffClass = `diff-${(p.difficulty || 'medium').toLowerCase()}`;
      item.innerHTML = `
        <div class="revision-info">
          <h4>${p.title} <span class="difficulty-tag ${diffClass}">${p.difficulty || 'Medium'}</span></h4>
          <span>Spaced interval: ${p.nextRevisionDays || 1} day · Origin: ${p.site || 'LeetCode'}</span>
        </div>
        <div>
          <a href="${p.url || `https://leetcode.com/problems/${p.slug}/`}" target="_blank" class="btn-action">Revise Now ↻</a>
        </div>
      `;
      revisionList.appendChild(item);
    });
  }

  // Render Real Mistake Journal
  function renderJournal() {
    const journalList = document.getElementById('journal-list');
    journalList.innerHTML = '';
    const journalCountEl = document.getElementById('journal-count');
    if (journalCountEl) {
      journalCountEl.textContent = `📖 ${(settings.journal || []).length} Journal Entries`;
    }

    if (!settings.journal || settings.journal.length === 0) {
      journalList.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--nudge-text-muted);">
          <div style="font-size: 2.8rem; margin-bottom: 0.6rem;">📖</div>
          <h3 style="font-size: 1.15rem; color: var(--nudge-text-primary); margin-bottom: 0.35rem; font-weight: 800;">Mistake Journal is Clear</h3>
          <p style="font-size: 0.88rem; max-width: 340px; margin: 0 auto; line-height: 1.5;">
            When you test your intuition on interactive checkpoints, hit a tricky boundary, or click <b>"I'm still stuck on this"</b> in Nudge, your key takeaways will automatically appear here for rapid review!
          </p>
        </div>
      `;
    } else {
      settings.journal.forEach(j => {
        const entry = document.createElement('div');
        entry.className = `journal-entry ${j.mastered ? 'mastered' : ''}`;
        entry.style.display = 'flex';
        entry.style.justifyContent = 'space-between';
        entry.style.alignItems = 'flex-start';
        entry.style.gap = '12px';
        entry.innerHTML = `
          <div style="flex: 1;">
            <div class="journal-q">${j.question}</div>
            <div style="font-size:0.84rem; margin-bottom:0.35rem;">
              ${j.missedAnswer ? `<span style="color:#c62828; text-decoration:line-through; margin-right:0.6rem;">${j.missedAnswer}</span>` : ''}
              <span style="color:#2e7d32; font-weight:700;">✓ ${j.correctAnswer || j.takeaway || 'Correct Observation'}</span>
            </div>
            <div class="journal-meta">
              <span>Problem: ${j.problemTitle || j.problem || 'Coding Problem'}</span>
              <span>${j.recordedAt || j.date || 'Recent'}</span>
            </div>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            <button class="opt-master-btn" data-id="${j.id}" style="padding: 3px 8px; font-size: 0.78rem; border-radius: 6px; border: 1px solid var(--nudge-border); cursor: pointer; background: ${j.mastered ? '#e8f5e9; color: #2e7d32; font-weight: 700;' : '#FFFFFF; color: var(--nudge-text-primary);'}">
              ${j.mastered ? '✓ Mastered' : 'Mastered?'}
            </button>
            <button class="opt-del-btn" data-id="${j.id}" style="padding: 3px 8px; font-size: 0.78rem; border-radius: 6px; border: 1px solid var(--nudge-border); cursor: pointer; background: #FFFFFF; color: #8C473A;">
              ✕
            </button>
          </div>
        `;
        journalList.appendChild(entry);
      });

      journalList.querySelectorAll('.opt-master-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          settings.journal = (settings.journal || []).map(j => j.id === id ? { ...j, mastered: !j.mastered } : j);
          await chrome.storage.local.set({ nudge_user_settings: settings });
          renderJournal();
        });
      });

      journalList.querySelectorAll('.opt-del-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          settings.journal = (settings.journal || []).filter(j => j.id !== id);
          await chrome.storage.local.set({ nudge_user_settings: settings });
          renderJournal();
        });
      });
    }
  }

  renderJournal();

  // Render Real Pattern Mastery Bars
  const patternBars = document.getElementById('pattern-bars');
  patternBars.innerHTML = '';

  const patterns = settings.patternMastery || EMPTY_SETTINGS.patternMastery;
  Object.entries(patterns).forEach(([pattern, pct]) => {
    const wrap = document.createElement('div');
    wrap.className = 'progress-bar-wrap';
    wrap.innerHTML = `
      <div class="progress-label">
        <span>${pattern}</span>
        <span>${pct}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
    `;
    patternBars.appendChild(wrap);
  });

  // Form Binding for Preferences
  const form = document.getElementById('settings-form');
  const genderInputs = form.querySelectorAll('input[name="gender"]');
  genderInputs.forEach(i => {
    if (i.value === settings.gender) i.checked = true;
  });

  const personaSelect = document.getElementById('persona-select');
  if (personaSelect) personaSelect.value = settings.personality || 'cheerleader';

  const ttsToggle = document.getElementById('tts-toggle');
  if (ttsToggle) ttsToggle.checked = Boolean(settings.ttsEnabled);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedGender = Array.from(genderInputs).find(i => i.checked)?.value || 'female';
    settings.gender = selectedGender;
    settings.personality = personaSelect.value;
    settings.ttsEnabled = ttsToggle.checked;

    try {
      await chrome.storage.local.set({ nudge_user_settings: settings });
      alert('Preferences saved successfully! Your companion is updated.');
    } catch (err) {
      console.error('[Nudge] Error saving preferences:', err);
    }
  });
});
