import type { HintLevel, ProblemContext } from '../../../../packages/shared/src/index.ts';
import { LEVEL_NAMES, getRandomAffirmation } from '../../../../packages/shared/src/index.ts';

export interface NudgeConsoleOptions {
  onClose: () => void;
  onRequestHint: (level: HintLevel, isRephrase?: boolean, confirmLastResort?: boolean) => Promise<{ hintText: string; analogy?: string }>;
  onShowLockedWarning: (message: string) => void;
  onCelebration: () => void;
}

export class NudgeConsoleComponent {
  private element: HTMLElement;
  private currentLevel: HintLevel = 0;
  private maxUnlockedLevel: HintLevel = 0;
  private currentHintText: string = 'Welcome to Nudge! Ask for your first hint to get started.';
  private isLastResortConfirmed = false;
  private activeProblem: ProblemContext | null = null;
  private xpEarned: number = 0;

  constructor(private container: HTMLElement, private options: NudgeConsoleOptions) {
    this.element = document.createElement('div');
    this.element.className = 'nudge-drawer';
    this.render();
    this.container.appendChild(this.element);
  }

  setProblem(problem: ProblemContext | null): void {
    this.activeProblem = problem;
    this.currentLevel = 0;
    this.maxUnlockedLevel = 0;
    this.isLastResortConfirmed = false;
    this.currentHintText = `Ready to solve ${problem?.title || 'this problem'}? Let's take it step by step.`;
    this.render();
  }

  setOpen(open: boolean): void {
    if (open) {
      this.element.classList.add('open');
    } else {
      this.element.classList.remove('open');
    }
  }

  isOpen(): boolean {
    return this.element.classList.contains('open');
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="nudge-header">
        <div class="nudge-header-title">
          <span style="font-size: 22px;">🦊</span>
          <div>
            <div style="font-weight: 800; font-size: 15px; color: var(--nudge-text-primary);">Nudge Buddy</div>
            <div style="font-size: 12px; color: var(--nudge-text-muted);">${this.activeProblem ? this.activeProblem.title : 'Ready to code'}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="nudge-badge-xp">⚡ XP: ${this.xpEarned}</span>
          <button id="nudge-close-btn" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--nudge-text-muted);" aria-label="Close">✕</button>
        </div>
      </div>

      <div class="nudge-progress-track">
        <div class="nudge-steps-container">
          ${[0, 1, 2, 3, 4, 5].map((lvl) => {
            const isCompleted = lvl < this.maxUnlockedLevel;
            const isActive = lvl === this.currentLevel;
            const isLocked = lvl > this.maxUnlockedLevel;
            const classes = ['nudge-step-node'];
            if (isCompleted) classes.push('completed');
            else if (isActive) classes.push('active');
            else if (isLocked) classes.push('locked');

            const label = lvl === 5 ? '⚠️' : (isCompleted ? '✓' : `L${lvl + 1}`);
            return `
              <div 
                class="${classes.join(' ')}" 
                data-level="${lvl}"
                title="${LEVEL_NAMES[lvl as HintLevel]}"
              >
                ${label}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="nudge-body">
        <div class="nudge-hint-card ${this.currentLevel === 5 && !this.isLastResortConfirmed ? 'nudge-blur-gate' : ''}">
          <div class="nudge-hint-card-header">
            <span class="nudge-level-pill">
              LEVEL ${this.currentLevel + 1}: ${LEVEL_NAMES[this.currentLevel]}
            </span>
          </div>

          <div class="${this.currentLevel === 5 && !this.isLastResortConfirmed ? 'nudge-blurred-content' : ''}">
            <p class="nudge-hint-text">${this.escapeHtml(this.currentHintText)}</p>
          </div>

          ${this.currentLevel === 5 && !this.isLastResortConfirmed ? `
            <div class="nudge-blur-overlay">
              <span style="font-size: 28px;">🛡️</span>
              <div style="font-weight: 700; color: var(--nudge-rose-alert); font-size: 15px;">
                Last Resort Checkpoint
              </div>
              <p style="font-size: 12.5px; color: var(--nudge-text-secondary); max-width: 260px;">
                Revealing the full explanation reduces problem XP by 70%. Take another minute to test your approach!
              </p>
              <button id="nudge-confirm-last-resort" style="background: var(--nudge-rose-alert); color: #FFF; border: none; border-radius: 10px; padding: 10px 16px; font-weight: 700; cursor: pointer;">
                Reveal Full Solution
              </button>
            </div>
          ` : ''}
        </div>

        <div class="nudge-action-buttons">
          <button id="nudge-btn-next" class="nudge-btn-got-it">
            <span>🎉</span>
            <span>${this.currentLevel === this.maxUnlockedLevel ? 'Got it! Show me the next Nudge' : 'Advance to Next Level'}</span>
          </button>
          <button id="nudge-btn-stuck" class="nudge-btn-stuck">
            <span>❓</span>
            <span>I'm still stuck on this</span>
          </button>
        </div>
      </div>

      <div class="nudge-motivation-bar">
        <span>✨</span>
        <span id="nudge-affirmation-text">${getRandomAffirmation()}</span>
      </div>
    `;

    this.attachDomEvents();
  }

  private attachDomEvents(): void {
    const closeBtn = this.element.querySelector('#nudge-close-btn');
    closeBtn?.addEventListener('click', () => this.options.onClose());

    // Step milestone clicks
    const stepNodes = this.element.querySelectorAll('.nudge-step-node');
    stepNodes.forEach((node) => {
      node.addEventListener('click', () => {
        const targetLevel = Number(node.getAttribute('data-level')) as HintLevel;
        if (targetLevel > this.maxUnlockedLevel) {
          node.classList.add('shake');
          setTimeout(() => node.classList.remove('shake'), 400);
          this.options.onShowLockedWarning("Hold on, buddy! Let's master this step first!");
        } else {
          this.currentLevel = targetLevel;
          this.fetchAndDisplayHint(targetLevel);
        }
      });
    });

    // "Got it! Next Nudge"
    const nextBtn = this.element.querySelector('#nudge-btn-next');
    nextBtn?.addEventListener('click', async () => {
      if (this.currentLevel < 5) {
        const nextLevel = (this.currentLevel + 1) as HintLevel;
        if (nextLevel > this.maxUnlockedLevel) {
          this.maxUnlockedLevel = nextLevel;
          this.options.onCelebration();
        }
        this.currentLevel = nextLevel;
        await this.fetchAndDisplayHint(nextLevel);
      }
    });

    // "I'm still stuck on this"
    const stuckBtn = this.element.querySelector('#nudge-btn-stuck');
    stuckBtn?.addEventListener('click', async () => {
      await this.fetchAndDisplayHint(this.currentLevel, true);
    });

    // Confirm Last Resort (Level 5)
    const confirmBtn = this.element.querySelector('#nudge-confirm-last-resort');
    confirmBtn?.addEventListener('click', async () => {
      this.isLastResortConfirmed = true;
      await this.fetchAndDisplayHint(5, false, true);
    });
  }

  private async fetchAndDisplayHint(level: HintLevel, isRephrase: boolean = false, confirmLastResort: boolean = false): Promise<void> {
    try {
      this.currentHintText = 'Thinking with you...';
      this.render();

      const result = await this.options.onRequestHint(level, isRephrase, confirmLastResort);
      this.currentHintText = result.analogy 
        ? `${result.hintText}\n\n💡 Analogy: ${result.analogy}`
        : result.hintText;
      this.render();
    } catch (err) {
      this.currentHintText = 'Oops! Could not load the hint right now. Try again in a moment.';
      this.render();
    }
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
