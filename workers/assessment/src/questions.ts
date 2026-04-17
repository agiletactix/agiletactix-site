// Rovo-Readiness Assessment — Question/Dimension Constants for Worker
// Duplicated from src/lib/rovo/questions.ts (Workers can't import from Astro src)
// Only includes types and constants needed for scoring — no UI labels.

export type Role = 'exec' | 'practitioner' | 'mixed';

export type Dimension =
  | 'value_streams'
  | 'stack_maturity'
  | 'data_integration'
  | 'change_governance'
  | 'culture_skills';

export type Deployment = 'cloud' | 'data_center' | 'server' | 'mixed' | 'unsure';

export const DIMENSIONS: Record<Dimension, string> = {
  value_streams: 'Value Stream Structure',
  stack_maturity: 'Atlassian Stack Maturity',
  data_integration: 'Data Integration & Quality',
  change_governance: 'Change & Governance',
  culture_skills: 'Culture & Skills',
};

// Question-to-dimension mapping (only what scoring needs)
export interface QuestionMeta {
  id: string;
  dimension: Dimension;
}

export const QUESTIONS: QuestionMeta[] = [
  { id: 'q1', dimension: 'value_streams' },
  { id: 'q2', dimension: 'value_streams' },
  { id: 'q3', dimension: 'stack_maturity' },
  { id: 'q4', dimension: 'stack_maturity' },
  { id: 'q5', dimension: 'data_integration' },
  { id: 'q6', dimension: 'data_integration' },
  { id: 'q7', dimension: 'change_governance' },
  { id: 'q8', dimension: 'change_governance' },
  { id: 'q9', dimension: 'culture_skills' },
  { id: 'q10', dimension: 'culture_skills' },
];

export const MAX_DIMENSION_SCORE = 8; // 2 questions x 4 pts
export const MAX_OVERALL_SCORE = 40; // 10 questions x 4 pts

// Deployment types that prevent Rovo adoption entirely
export const ROVO_INELIGIBLE_DEPLOYMENTS: Deployment[] = ['data_center', 'server'];

// Valid deployments and roles for input validation
export const VALID_DEPLOYMENTS: Deployment[] = ['cloud', 'data_center', 'server', 'mixed', 'unsure'];
export const VALID_ROLES: Role[] = ['exec', 'practitioner', 'mixed'];
