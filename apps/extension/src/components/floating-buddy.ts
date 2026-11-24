import type { BuddyEmotion } from '../../../../packages/shared/src/index.ts';

export interface FloatingBuddyOptions {
  onToggleConsole: () => void;
}

export class FloatingBuddyComponent {
  private element: HTMLElement;
  private avatarEl: HTMLElement;
  private bubbleEl: HTMLElement;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;
  private bubbleTimeout: number | null = null;
  private emotion: BuddyEmotion = 'idle';

  constructor(private container: HTMLElement, private options: FloatingBuddyOptions) {
    this.element = document.createElement('div');
    this.element.className = 'nudge-buddy-widget';
    this.element.setAttribute('role', 'button');
    this.element.setAttribute('aria-label', 'Open Nudge Hint Buddy');
    this.element.setAttribute('tabindex', '0');

    this.avatarEl = document.createElement('div');
    this.avatarEl.className = 'nudge-buddy-avatar';
    this.updateAvatarExpression();

    this.bubbleEl = document.createElement('div');
    this.bubbleEl.className = 'nudge-speech-bubble';

    this.element.appendChild(this.avatarEl);
    this.element.appendChild(this.bubbleEl);
    this.container.appendChild(this.element);

    this.initPosition();
    this.attachEvents();
  }

  private initPosition(): void {
    // Restore saved position or default to bottom-right
    try {
      const saved = localStorage.getItem('nudge_buddy_pos');
      if (saved) {
        const { x, y } = JSON.parse(saved);
        this.currentX = x;
        this.currentY = y;
        this.applyTransform();
      }
    } catch {
      // Use CSS default
    }
  }

  private updateAvatarExpression(): void {
    switch (this.emotion) {
      case 'idle':
        this.avatarEl.textContent = '🦊';
        break;
      case 'thinking':
        this.avatarEl.textContent = '🤔';
        break;
      case 'cheering':
        this.avatarEl.textContent = '🥳';
        break;
      case 'concerned':
        this.avatarEl.textContent = '🥺';
        break;
    }
  }

  setEmotion(emotion: BuddyEmotion): void {
    this.emotion = emotion;
    this.updateAvatarExpression();
  }

  say(message: string, durationMs: number = 4000): void {
    if (this.bubbleTimeout) {
      clearTimeout(this.bubbleTimeout);
    }
    this.bubbleEl.textContent = message;
    this.bubbleEl.classList.add('visible');

    this.bubbleTimeout = window.setTimeout(() => {
      this.bubbleEl.classList.remove('visible');
    }, durationMs);
  }

  private attachEvents(): void {
    this.element.addEventListener('pointerdown', (e) => {
      this.isDragging = false;
      this.startX = e.clientX;
      this.startY = e.clientY;

      const onPointerMove = (moveEvt: PointerEvent) => {
        const dx = moveEvt.clientX - this.startX;
        const dy = moveEvt.clientY - this.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          this.isDragging = true;
          this.currentX += dx;
          this.currentY += dy;
          this.startX = moveEvt.clientX;
          this.startY = moveEvt.clientY;
          this.applyTransform();
        }
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);

        if (this.isDragging) {
          this.snapToNearestEdge();
        } else {
          this.options.onToggleConsole();
        }
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    });

    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.options.onToggleConsole();
      }
    });
  }

  private snapToNearestEdge(): void {
    const rect = this.element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const distanceToLeft = rect.left;
    const distanceToRight = viewportWidth - rect.right;

    if (distanceToLeft < distanceToRight) {
      this.currentX -= (rect.left - 24);
    } else {
      this.currentX += (distanceToRight - 24);
    }

    this.applyTransform();
    try {
      localStorage.setItem('nudge_buddy_pos', JSON.stringify({ x: this.currentX, y: this.currentY }));
    } catch {}
  }

  private applyTransform(): void {
    this.element.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
  }
}
