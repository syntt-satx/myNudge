import type { HintLevel } from '../../../../packages/shared/src/index.ts';
import { HINT_POLICY } from '../../../../packages/shared/src/index.ts';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  detectedCodeBlockCount: number;
}

export class AntiLeakValidator {
  private static CODE_FENCE_REGEX = /```[\s\S]*?```/g;
  private static CODE_KEYWORDS_REGEX = /\b(def\s+[a-zA-Z_]\w*\s*\(|function\s+(?!(should|must|can|will|does|to|is)\b)[a-zA-Z_]\w*|class\s+[a-zA-Z_]\w*[:\{]|return\s+(?!(if|when|where|what|how|the|a|an|to|from)\b)[\w\[\]\(\)]+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|public\s+static|#include\s*<|import\s+[\w\{\}\s]+from)\b/gi;

  /**
   * Validates that a hint at a specific level does not leak prohibited code.
   */
  static validate(level: HintLevel, text: string): ValidationResult {
    const policy = HINT_POLICY[level];
    if (!policy) {
      return { isValid: false, reason: `Unknown hint level: ${level}`, detectedCodeBlockCount: 0 };
    }

    // Level 5 allows full solutions
    if (level === 5) {
      return { isValid: true, detectedCodeBlockCount: 0 };
    }

    // Check code fences (```)
    const fences = text.match(this.CODE_FENCE_REGEX) || [];
    
    // Levels 0, 1 must have ZERO code fences of any kind
    if (level <= 1 && fences.length > 0) {
      return {
        isValid: false,
        reason: `Policy violation: Level ${level} must not contain code blocks, but found ${fences.length}.`,
        detectedCodeBlockCount: fences.length
      };
    }

    // Levels 2 and 3 allow plain text/diagram tracing fences (e.g. ```text or ```diagram) for pointer diagrams and dry-runs,
    // but strictly forbid programming language fences (python, js, cpp, etc.) or executable functions.
    if (level === 2 || level === 3) {
      for (const block of fences) {
        const isLanguageFence = /^```(python|py|javascript|js|typescript|ts|cpp|c\+\+|java|c|go|rust)\b/i.test(block);
        const hasExecutableKeywords = this.CODE_KEYWORDS_REGEX.test(block);
        if (isLanguageFence || hasExecutableKeywords) {
          return {
            isValid: false,
            reason: `Policy violation: Level ${level} may only contain text/diagram dry-run traces, not executable code syntax.`,
            detectedCodeBlockCount: fences.length
          };
        }
      }
    }

    // Level 4 allows skeleton pseudocode blocks up to policy.maxCodeLinesAllowed
    if (level === 4) {
      for (const block of fences) {
        const lineCount = block.split('\n').length - 2; // Exclude fence lines
        if (lineCount > policy.maxCodeLinesAllowed) {
          return {
            isValid: false,
            reason: `Policy violation: Level 4 pseudocode block exceeds ${policy.maxCodeLinesAllowed} lines (found ${lineCount} lines).`,
            detectedCodeBlockCount: fences.length
          };
        }
      }
    }

    // Check raw keyword density for un-fenced code leaks in conceptual levels (0-2)
    if (level <= 2) {
      const keywords = text.match(this.CODE_KEYWORDS_REGEX) || [];
      if (keywords.length >= 2) {
        return {
          isValid: false,
          reason: `Policy violation: Suspicious code statements detected in Level ${level} text: [${keywords.join(', ')}]`,
          detectedCodeBlockCount: 0
        };
      }
    }

    return {
      isValid: true,
      detectedCodeBlockCount: fences.length
    };
  }
}
