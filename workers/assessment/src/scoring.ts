// Rovo-Readiness Assessment — Scoring & Tier Calculation (Worker version)
// Duplicated from src/lib/rovo/scoring.ts — logic must stay in sync.

import {
  QUESTIONS,
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
  color: string;
}

export const TIER_META: Record<Tier, TierMeta> = {
  ready: { label: 'Rovo-Ready', emoji: '\u{1F7E2}', color: 'text-green-600' },
  close: { label: 'Close to Ready', emoji: '\u{1F7E1}', color: 'text-yellow-600' },
  foundation: { label: 'Foundation First', emoji: '\u{1F7E0}', color: 'text-orange-600' },
  notyet: { label: 'Not Yet', emoji: '\u{1F534}', color: 'text-red-600' },
};

export type DimensionScores = Record<Dimension, number>; // percentage 0-100

export interface ScoringResult {
  role: Role;
  deployment: Deployment;
  overall_score_pct: number;
  tier: Tier;
  tier_label: string;
  dimension_scores: DimensionScores;
  weak_dimensions: Dimension[];
  deployment_override: boolean;
  kit_tags: string[];
}

export type QuizAnswers = Record<string, number>;

export function calculateScoring(answers: QuizAnswers, role: Role, deployment: Deployment): ScoringResult {
  const dimensionPoints: Record<Dimension, number> = {
    value_streams: 0,
    stack_maturity: 0,
    data_integration: 0,
    change_governance: 0,
    culture_skills: 0,
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
    value_streams: Math.round((dimensionPoints.value_streams / MAX_DIMENSION_SCORE) * 100),
    stack_maturity: Math.round((dimensionPoints.stack_maturity / MAX_DIMENSION_SCORE) * 100),
    data_integration: Math.round((dimensionPoints.data_integration / MAX_DIMENSION_SCORE) * 100),
    change_governance: Math.round((dimensionPoints.change_governance / MAX_DIMENSION_SCORE) * 100),
    culture_skills: Math.round((dimensionPoints.culture_skills / MAX_DIMENSION_SCORE) * 100),
  };

  const overall_score_pct = Math.round((totalPoints / MAX_OVERALL_SCORE) * 100);

  // Determine weak dimensions (below 60%)
  const weak_dimensions: Dimension[] = (Object.keys(dimension_scores) as Dimension[])
    .filter(d => dimension_scores[d] < 60);

  // Tier calculation
  const tier = calculateTier(overall_score_pct, weak_dimensions.length);
  const tier_label = TIER_META[tier].label;

  // Rovo is Cloud-only
  const deployment_override = ROVO_INELIGIBLE_DEPLOYMENTS.includes(deployment);

  // Kit tags
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
  if (overallPct >= 80 && weakDimensionCount === 0) return 'ready';
  if (overallPct >= 65 || (overallPct >= 50 && weakDimensionCount === 1)) return 'close';
  if (overallPct >= 40 || weakDimensionCount >= 2) return 'foundation';
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

  const weaknessSlugs: Record<Dimension, string> = {
    value_streams: 'value-streams',
    stack_maturity: 'stack',
    data_integration: 'data',
    change_governance: 'change',
    culture_skills: 'culture',
  };
  for (const dim of weak) {
    tags.push(`weak:${weaknessSlugs[dim]}`);
  }

  return tags;
}

function getDateTag(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}
