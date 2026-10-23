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
 * 3. If both-k was just finished:
 *    - For trunk (tiers 1..7): advances to treble-(k+1).
 *    - For tier 8: branches into Sharp wing (treble-9) or Flat wing (treble-10).
 *    - For tier 9 (Sharp wing 1): advances to treble-11 (Sharp wing 2).
 *    - For tier 10 (Flat wing 1): advances to treble-12 (Flat wing 2).
 *    - For tier 11: recommends uncompleted Flat wing (treble-10/12) or remains on both-11.
 *    - For tier 12: stays on both-12 (summit).
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
  if (tier < 8) {
    return `treble-${tier + 1}`;
  }

  if (tier === 8) {
    if (finishedSet.has('both-9') && !finishedSet.has('both-10')) {
      return 'treble-10';
    }
    return 'treble-9';
  }

  if (tier === 9) {
    return 'treble-11';
  }

  if (tier === 10) {
    return 'treble-12';
  }

  if (tier === 11) {
    if (finishedSet.has('both-12')) {
      return 'both-11';
    }
    if (!finishedSet.has('both-10') && !finishedSet.has('treble-10')) {
      return 'treble-10';
    }
    return 'treble-12';
  }

  return 'both-12';
}
