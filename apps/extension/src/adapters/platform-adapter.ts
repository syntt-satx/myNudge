import type { PlatformAdapter, ProblemContext, CodeContext, SubmissionResult } from '../../../../packages/shared/src/index.ts';

export type { PlatformAdapter, ProblemContext, CodeContext, SubmissionResult };

export interface AdapterRegistry {
  findAdapter(url: string): PlatformAdapter | null;
}
