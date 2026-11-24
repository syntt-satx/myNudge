import type { PlatformAdapter, ProblemContext, CodeContext, SubmissionResult } from '../../../../packages/shared/src/index.ts';

export class LeetCodeAdapter implements PlatformAdapter {
  site = 'leetcode' as const;
  private cachedCode: CodeContext = {
    language: 'python3',
    code: '',
    version: 1,
    lastChangedAt: Date.now()
  };

  private submissionListeners: Array<(result: SubmissionResult) => void> = [];
  private observer: MutationObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupMessageListener();
      this.setupSubmissionObserver();
    }
  }

  matches(url: string): boolean {
    return /^https?:\/\/(www\.)?leetcode\.com\/problems\/[^/]+/.test(url);
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.source === 'NUDGE_MONACO_BRIDGE') {
        if (event.data.type === 'CODE_CHANGED' || event.data.type === 'CODE_RESPONSE') {
          const { code, language, timestamp } = event.data.payload;
          if (this.cachedCode.code !== code) {
            this.cachedCode = {
              code,
              language: language || this.cachedCode.language,
              version: this.cachedCode.version + 1,
              lastChangedAt: timestamp || Date.now()
            };
          }
        }
      }
    });
  }

  async getProblem(): Promise<ProblemContext | null> {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/problems\/([^/]+)/);
    if (!match) return null;

    const slug = match[1];
    const canonicalId = `lc:${slug}`;

    // Extract title from LeetCode DOM
    // Selectors match both modern and dynamic LeetCode interfaces
    let title = '';
    const titleEl = document.querySelector('div[data-cy="question-title"]') || 
                    document.querySelector('.text-title-large') ||
                    document.querySelector('div.flex-1 > div > a[href*="/problems/"]');
    if (titleEl && titleEl.textContent) {
      title = titleEl.textContent.trim();
    } else {
      title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Extract difficulty
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    const diffEl = document.querySelector('div[class*="text-difficulty-"]') || 
                   document.querySelector('.text-olive') || 
                   document.querySelector('.text-yellow') || 
                   document.querySelector('.text-pink');
    if (diffEl && diffEl.textContent) {
      const text = diffEl.textContent.trim().toLowerCase();
      if (text.includes('easy')) difficulty = 'Easy';
      else if (text.includes('hard')) difficulty = 'Hard';
      else difficulty = 'Medium';
    }

    // Extract problem statement
    let statement = '';
    const contentEl = document.querySelector('div[data-track-load="description_content"]') ||
                      document.querySelector('.content__u3I1') ||
                      document.querySelector('div[class*="elfjS"]');
    if (contentEl && contentEl.textContent) {
      statement = contentEl.textContent.trim();
    }

    return {
      canonicalId,
      site: 'leetcode',
      slug,
      title,
      statement,
      difficulty,
      tags: []
    };
  }

  async getUserCode(): Promise<CodeContext> {
    // Request fresh code from Monaco bridge
    window.postMessage({
      source: 'NUDGE_CONTENT_SCRIPT',
      type: 'REQUEST_CODE'
    }, '*');

    // Return current cached state
    return this.cachedCode;
  }

  onSubmissionResult(callback: (result: SubmissionResult) => void): () => void {
    this.submissionListeners.push(callback);
    return () => {
      this.submissionListeners = this.submissionListeners.filter(cb => cb !== callback);
    };
  }

  mountPoint(): HTMLElement {
    let host = document.getElementById('nudge-buddy-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'nudge-buddy-host';
      document.body.appendChild(host);
    }
    return host;
  }

  private setupSubmissionObserver(): void {
    this.observer = new MutationObserver(() => {
      // Look for LeetCode's submission result badges
      const successEl = document.querySelector('span[data-e2e-locator="submission-result"]') ||
                        document.querySelector('div[class*="text-green"]');
      const failEl = document.querySelector('div[class*="text-red"]') ||
                     document.querySelector('span[class*="text-red"]');

      if (successEl && successEl.textContent) {
        const text = successEl.textContent.trim();
        if (text.includes('Accepted')) {
          this.notifyResult({
            status: 'Accepted',
            timestamp: Date.now()
          });
        }
      } else if (failEl && failEl.textContent) {
        const text = failEl.textContent.trim();
        let status: SubmissionResult['status'] = 'Wrong Answer';
        if (text.includes('Time Limit Exceeded')) status = 'Time Limit Exceeded';
        else if (text.includes('Runtime Error')) status = 'Runtime Error';
        else if (text.includes('Compile Error')) status = 'Compile Error';

        this.notifyResult({
          status,
          timestamp: Date.now()
        });
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private notifyResult(result: SubmissionResult): void {
    for (const listener of this.submissionListeners) {
      try {
        listener(result);
      } catch (err) {
        console.error('[Nudge] Error notifying submission listener:', err);
      }
    }
  }
}
