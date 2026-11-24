document.addEventListener('DOMContentLoaded', async () => {
  const avatarEl = document.getElementById('popup-avatar');
  const streakEl = document.getElementById('popup-streak');
  const statusLabel = document.getElementById('page-status-label');
  const statusDesc = document.getElementById('page-status-desc');
  const toggleBtn = document.getElementById('btn-toggle-console');
  const toggleText = document.getElementById('btn-toggle-text');
  const optionsBtn = document.getElementById('btn-open-options');
  const leetcodeBtn = document.getElementById('btn-open-leetcode');

  // Load user settings if available
  try {
    const data = await chrome.storage.local.get(['nudge_user_settings']);
    if (data && data.nudge_user_settings) {
      streakEl.textContent = `${data.nudge_user_settings.streak || 4}d`;
    }
  } catch (e) {}

  // Check active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isCodingSite = tab?.url && (
    tab.url.includes('leetcode.com') ||
    tab.url.includes('geeksforgeeks.org') ||
    tab.url.includes('hackerrank.com')
  );

  if (isCodingSite) {
    statusLabel.textContent = '🟢 Nudge Ready';
    statusDesc.innerHTML = `Connected to active problem on <b>${new URL(tab.url).hostname}</b>.`;
    toggleText.textContent = 'Open Nudge Console';
  } else {
    statusLabel.textContent = '💤 Buddy Resting';
    statusDesc.textContent = 'Navigate to LeetCode, GeeksforGeeks, or HackerRank to start your guided hints!';
    toggleText.textContent = 'Start on LeetCode';
  }

  toggleBtn.addEventListener('click', async () => {
    if (isCodingSite && tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_DRAWER' });
        window.close();
      } catch (err) {
        // If content script was not injected on an older tab, inject or reload
        chrome.tabs.reload(tab.id);
        window.close();
      }
    } else {
      chrome.tabs.create({ url: 'https://leetcode.com/problemset/all/' });
      window.close();
    }
  });

  optionsBtn?.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/options/options.html') });
    }
    window.close();
  });

  leetcodeBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://leetcode.com/problemset/all/' });
    window.close();
  });
});
