import { LevelSpec } from '../types/curriculum';
import { ALL_LEVELS, LEVELS_BY_ID } from './levels';

export function getAllLevels(): readonly LevelSpec[] {
  return ALL_LEVELS;
}

export function getLevelById(id: string): LevelSpec {
  const level = LEVELS_BY_ID.get(id);
  if (!level) {
    throw new Error(`Level with ID "${id}" not found.`);
  }
  return level;
}

/**
 * Computes transitive ancestor completion closure.
 * When a level is completed, all levels with a directed path to it are also marked completed.
 */
export function getTransitiveCompletedLevels(directlyCompletedIds: Iterable<string>): Set<string> {
  const result = new Set<string>();
  const queue: string[] = [];

  for (const id of directlyCompletedIds) {
    if (LEVELS_BY_ID.has(id)) {
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const currentId = queue.pop()!;
    if (result.has(currentId)) continue;
    result.add(currentId);

    const level = LEVELS_BY_ID.get(currentId);
    if (level) {
      for (const prereqId of level.prerequisiteIds) {
        if (!result.has(prereqId)) {
          queue.push(prereqId);
        }
      }
    }
  }

  return result;
}

/**
 * Determines the next recommended level when currentLevelId is completed:
 * 1. If treble-k was just finished and bass-k is not finished -> bass-k.
 * 2. If bass-k was just finished and treble-k is finished -> both-k (else treble-k).
 * 3. If both-k was just finished -> treble-(k+1) (if k < 12, else stays on both-12).
 */
export function getNextRecommendedLevel(
  completedLevelId: string,
  finishedSet: ReadonlySet<string>
): string {
  const level = getLevelById(completedLevelId);
  const tier = level.tier;

  if (level.lane === 'treble') {
    if (!finishedSet.has(`bass-${tier}`)) {
      return `bass-${tier}`;
    }
    return `both-${tier}`;
  }

  if (level.lane === 'bass') {
    if (finishedSet.has(`treble-${tier}`)) {
      return `both-${tier}`;
    }
    return `treble-${tier}`;
  }

  // lane === 'both'
  if (tier < 12) {
    return `treble-${tier + 1}`;
  }
  return 'both-12';
}
