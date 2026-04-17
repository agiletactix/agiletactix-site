// Learning path assignment logic
// Maps assessment tier → learning path slug.
// Future: could use weakDimensions to customize lesson order within a path.

import type { Tier } from './scoring';
import type { Dimension } from './questions';
import { PATHS_BY_TIER } from './learning-paths';

/**
 * Assign a learning path slug based on assessment tier.
 * @param tier - The tier from the assessment scoring result
 * @param _weakDimensions - Weak dimensions (reserved for future lesson ordering)
 * @returns The path slug to store in the learning_paths table
 */
export function assignLearningPath(tier: Tier, _weakDimensions: Dimension[]): string {
  const path = PATHS_BY_TIER[tier];
  return path.slug;
}
