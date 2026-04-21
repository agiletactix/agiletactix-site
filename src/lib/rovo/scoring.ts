// Rovo-Readiness Assessment — Scoring & Tier Calculation
// Pure functions, no side effects. Used by both client-side preview
// and Cloudflare Worker (server-side authoritative calc).

import {
  QUESTIONS,
  DIMENSIONS,
  MAX_DIMENSION_SCORE,
  MAX_OVERALL_SCORE,
  ROVO_INELIGIBLE_DEPLOYMENTS,
  type Dimension,
  type Role,
  type Deployment,
} from './questions';

export type Tier = 'ready' | 'close' | 'foundation' | 'notyet';

export interface TierMeta {
  label: string;
  emoji: string;
  color: string; // tailwind class
}

export const TIER_META: Record<Tier, TierMeta> = {
  ready: { label: 'Rovo-Ready', emoji: '🟢', color: 'text-green-600' },
  close: { label: 'Close to Ready', emoji: '🟡', color: 'text-yellow-600' },
  foundation: { label: 'Foundation First', emoji: '🟠', color: 'text-orange-600' },
  notyet: { label: 'Not Yet', emoji: '🔴', color: 'text-red-600' },
};

export type DimensionScores = Record<Dimension, number>; // percentage 0-100

export interface ScoringResult {
  role: Role;
  deployment: Deployment;
  overall_score_pct: number;
  tier: Tier;
  tier_label: string;
  dimension_scores: DimensionScores;
  weak_dimensions: Dimension[]; // dimensions scoring below 60%
  // True when deployment disqualifies Rovo use regardless of readiness score
  // (Data Center / Server). Result page uses this to lead with migration guidance.
  deployment_override: boolean;
  kit_tags: string[];
}

// Input format: { q1: 4, q2: 3, ..., q10: 2 }
export type QuizAnswers = Record<string, number>;

export function calculateScoring(answers: QuizAnswers, role: Role, deployment: Deployment): ScoringResult {
  const dimensionPoints: Record<Dimension, number> = {
    flow_visibility: 0,
    atlassian_depth: 0,
    data_ownership: 0,
    change_governance: 0,
    builder_mindset: 0,
  };

  let totalPoints = 0;
  for (const q of QUESTIONS) {
    const answer = answers[q.id];
    if (typeof answer !== 'number') {
      throw new Error(`Missing answer for ${q.id}`);
    }
    dimensionPoints[q.dimension] += answer;
    totalPoints += answer;
  }

  // Convert to percentages
  const dimension_scores: DimensionScores = {
    flow_visibility: Math.round((dimensionPoints.flow_visibility / MAX_DIMENSION_SCORE) * 100),
    atlassian_depth: Math.round((dimensionPoints.atlassian_depth / MAX_DIMENSION_SCORE) * 100),
    data_ownership: Math.round((dimensionPoints.data_ownership / MAX_DIMENSION_SCORE) * 100),
    change_governance: Math.round((dimensionPoints.change_governance / MAX_DIMENSION_SCORE) * 100),
    builder_mindset: Math.round((dimensionPoints.builder_mindset / MAX_DIMENSION_SCORE) * 100),
  };

  const overall_score_pct = Math.round((totalPoints / MAX_OVERALL_SCORE) * 100);

  // Determine weak dimensions (below 60%)
  const weak_dimensions: Dimension[] = (Object.keys(dimension_scores) as Dimension[])
    .filter(d => dimension_scores[d] < 60);

  // Tier calculation (based purely on readiness dimensions)
  const tier = calculateTier(overall_score_pct, weak_dimensions.length);
  const tier_label = TIER_META[tier].label;

  // Rovo is Cloud-only — on-prem deployments can't use it regardless of readiness
  const deployment_override = ROVO_INELIGIBLE_DEPLOYMENTS.includes(deployment);

  // Kit tags (include deployment for nurture-sequence segmentation)
  const kit_tags = buildKitTags(role, tier, weak_dimensions, deployment);

  return {
    role,
    deployment,
    overall_score_pct,
    tier,
    tier_label,
    dimension_scores,
    weak_dimensions,
    deployment_override,
    kit_tags,
  };
}

function calculateTier(overallPct: number, weakDimensionCount: number): Tier {
  // 🟢 Rovo-Ready: 80%+ overall AND no dimension below 60%
  if (overallPct >= 80 && weakDimensionCount === 0) return 'ready';

  // 🟡 Close to Ready: 65-79% OR 1 dimension below 60%
  if (overallPct >= 65 || (overallPct >= 50 && weakDimensionCount === 1)) return 'close';

  // 🟠 Foundation First: 40-64% OR 2+ dimensions below 60%
  if (overallPct >= 40 || weakDimensionCount >= 2) return 'foundation';

  // 🔴 Not Yet: below 40% overall
  return 'notyet';
}

function buildKitTags(role: Role, tier: Tier, weak: Dimension[], deployment: Deployment): string[] {
  const tags: string[] = [
    `role:${role}`,
    `tier:${tier}`,
    `deployment:${deployment.replace('_', '-')}`,
    `source:rovo-readiness-assessment`,
    `source-date:${getDateTag()}`,
  ];

  // Map dimension names to shorter tag slugs
  const weaknessSlugs: Record<Dimension, string> = {
    flow_visibility: 'flow-visibility',
    atlassian_depth: 'atlassian-depth',
    data_ownership: 'data-ownership',
    change_governance: 'change',
    builder_mindset: 'builder-mindset',
  };
  for (const dim of weak) {
    tags.push(`weak:${weaknessSlugs[dim]}`);
  }

  return tags;
}

function getDateTag(): string {
  // YYYY-MM format for monthly campaign tracking
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

// Helper for result page: return dimension name in human-readable form
export function dimensionLabel(d: Dimension): string {
  return DIMENSIONS[d];
}
