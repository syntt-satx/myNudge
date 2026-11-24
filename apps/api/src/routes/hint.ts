import type { HintRequest } from '../../../../packages/shared/src/index.ts';
import { LadderGeneratorEngine } from '../engine/ladder-generator.ts';

export async function handleHintRoute(body: HintRequest) {
  if (!body.problemId) {
    throw new Error('Missing required field: problemId');
  }
  if (typeof body.level !== 'number' || body.level < 0 || body.level > 6) {
    throw new Error('Invalid hint level. Must be between 0 and 6.');
  }

  const response = await LadderGeneratorEngine.getHint(body);
  return response;
}
