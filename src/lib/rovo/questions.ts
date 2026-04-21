// Rovo-Readiness Assessment — Question Bank
// Source of truth for questions, answer options, and scoring.
// Used by: QuizForm component, scoring module, Cloudflare Worker.

export type Role = 'exec' | 'practitioner' | 'mixed';

export interface AnswerOption {
  value: number; // 0-4 scoring
  label: string;
}

export interface Question {
  id: string;
  dimension: Dimension;
  text: string;
  options: AnswerOption[];
}

export type Dimension =
  | 'flow_visibility'
  | 'atlassian_depth'
  | 'data_ownership'
  | 'change_governance'
  | 'builder_mindset';

export const DIMENSIONS: Record<Dimension, string> = {
  flow_visibility: 'Flow Visibility',
  atlassian_depth: 'Atlassian Depth',
  data_ownership: 'Data Ownership',
  change_governance: 'Change & Governance',
  builder_mindset: 'Builder Mindset',
};

// Role identifier (Q0) — asked first, drives routing
export interface RoleOption {
  id: string;
  label: string;
  role: Role;
}

export const ROLE_OPTIONS: RoleOption[] = [
  { id: 'jira_admin', label: 'Jira / Atlassian admin or platform owner', role: 'practitioner' },
  { id: 'scrum_master', label: 'Scrum Master, Agile Coach, or RTE', role: 'practitioner' },
  { id: 'product_owner', label: 'Product Owner or Technical PM', role: 'practitioner' },
  { id: 'itsm', label: 'ITSM / Service Manager / Change Manager / SRE', role: 'practitioner' },
  { id: 'ic_contributor', label: 'Developer, Engineer, or other IC contributor', role: 'practitioner' },
  { id: 'other', label: 'Other', role: 'mixed' },
];

// Deployment gate (Q0.5) — asked before dimension questions.
// Rovo is Cloud-only. On-prem deployments can't run Rovo regardless
// of other readiness factors → gate the result, not a scored dimension.
export type Deployment = 'cloud' | 'data_center' | 'server' | 'mixed' | 'unsure';

export interface DeploymentOption {
  id: Deployment;
  label: string;
}

export const DEPLOYMENT_OPTIONS: DeploymentOption[] = [
  { id: 'cloud', label: 'Jira Cloud' },
  { id: 'data_center', label: 'Jira Data Center (self-hosted / on-prem)' },
  { id: 'server', label: 'Jira Server (legacy — Atlassian has ended support)' },
  { id: 'mixed', label: 'A mix across different teams / environments' },
  { id: 'unsure', label: "Not sure — I don't manage the platform directly" },
];

// Deployment types that prevent Rovo adoption entirely (until migration)
export const ROVO_INELIGIBLE_DEPLOYMENTS: Deployment[] = ['data_center', 'server'];

// 10 core questions (2 per dimension)
export const QUESTIONS: Question[] = [
  // ==== Dimension 1: Flow Visibility ====
  {
    id: 'q1',
    dimension: 'flow_visibility',
    text: 'In your current role, how much of your week is spent in ceremonies vs. building or improving systems?',
    options: [
      { value: 4, label: 'Mostly building and improving — I own systems, automation, or tooling changes' },
      { value: 3, label: 'Roughly even split between ceremonies and system improvement' },
      { value: 2, label: 'Mostly ceremonies with occasional improvement work' },
      { value: 1, label: 'Mostly ceremonies — facilitation is the job' },
      { value: 0, label: "I don't track this, or it varies too much to say" },
    ],
  },
  {
    id: 'q2',
    dimension: 'flow_visibility',
    text: "When a senior leader asks 'what's the status of X outcome?' — what's your role in getting them that answer?",
    options: [
      { value: 4, label: "I built the dashboard they read directly — they don't need me in the loop" },
      { value: 3, label: 'I point them to a team owner who has the full picture' },
      { value: 2, label: 'I aggregate status from multiple sources and send it up' },
      { value: 1, label: "I manually compile a report each time it's asked" },
      { value: 0, label: "I'm not sure, or it varies" },
    ],
  },

  // ==== Dimension 2: Atlassian Depth ====
  {
    id: 'q3',
    dimension: 'atlassian_depth',
    text: 'In your daily work, which Atlassian tools do you actively configure — not just use?',
    options: [
      { value: 4, label: 'Jira + JSM + Confluence + automation rules (I own the setup)' },
      { value: 3, label: 'Jira and Confluence with some automation rules' },
      { value: 2, label: "Jira boards and backlogs — I work in the tool but don't configure it" },
      { value: 1, label: 'I mostly use Jira as items are assigned to me' },
      { value: 0, label: 'I primarily work outside Atlassian tools' },
    ],
  },
  {
    id: 'q4',
    dimension: 'atlassian_depth',
    text: 'How well integrated is your delivery tool with your service / incident / change management?',
    options: [
      { value: 4, label: 'Single platform, unified data, one source of truth' },
      { value: 3, label: 'Tools linked via automation + real-time data sync' },
      { value: 2, label: 'Manual ticket linking, occasional data exports' },
      { value: 1, label: 'Siloed — no real integration between them' },
      { value: 0, label: 'Not sure, or not applicable to my role' },
    ],
  },

  // ==== Dimension 3: Data Ownership ====
  {
    id: 'q5',
    dimension: 'data_ownership',
    text: "If you needed the answer to 'are we on track to hit the sprint goal?' — how would you get it?",
    options: [
      { value: 4, label: 'Pull it from Jira in under 2 minutes via a filter or dashboard I set up' },
      { value: 3, label: "Check a board or report that's already configured for this" },
      { value: 2, label: 'Run a manual export and calculate in a spreadsheet' },
      { value: 1, label: 'Ask the team in standup' },
      { value: 0, label: "I'm not sure where to look" },
    ],
  },
  {
    id: 'q6',
    dimension: 'data_ownership',
    text: "Have you ever built a Jira automation rule from scratch — not used one someone else set up?",
    options: [
      { value: 4, label: 'Yes, I build and maintain multiple automation rules regularly' },
      { value: 3, label: "Yes, I've built a few (recurring reminders, status transitions)" },
      { value: 2, label: "I've used templates but haven't customized the logic myself" },
      { value: 1, label: "I've read about it but haven't done it" },
      { value: 0, label: "I didn't know Jira had automation, or I don't have access to configure it" },
    ],
  },

  // ==== Dimension 4: Change & Governance ====
  {
    id: 'q7',
    dimension: 'change_governance',
    text: "When a production change happens in your environment, what's your actual role in that process?",
    options: [
      { value: 4, label: 'I help define or govern the workflow — including raising questions about AI-initiated changes' },
      { value: 3, label: 'I participate in CABs or approval steps as a stakeholder' },
      { value: 2, label: "I'm informed after the fact but not a decision-maker" },
      { value: 1, label: "I'm not sure what the change process is in my environment" },
      { value: 0, label: "I don't have visibility into production changes" },
    ],
  },
  {
    id: 'q8',
    dimension: 'change_governance',
    text: 'If an AI agent (Rovo or similar) auto-generated a production change, how would governance in your environment likely handle it?',
    options: [
      { value: 4, label: 'Same workflow as human-initiated changes; audit trail captures AI origin' },
      { value: 3, label: 'Would need a new workflow — not ready today but plan exists' },
      { value: 2, label: "Unclear — AI-aware governance hasn't been designed yet" },
      { value: 1, label: 'It would likely bypass current controls' },
      { value: 0, label: "Haven't thought about it — this question is a wake-up call" },
    ],
  },

  // ==== Dimension 5: Builder Mindset ====
  {
    id: 'q9',
    dimension: 'builder_mindset',
    text: 'When AI tools come up in your own work — Rovo, Copilot, ChatGPT for work tasks — what\'s your most common response?',
    options: [
      { value: 4, label: 'I actively experiment and look for ways to integrate them into my workflows' },
      { value: 3, label: "I use them regularly for specific tasks but haven't deeply integrated" },
      { value: 2, label: "I've tried a few times but haven't made them habitual" },
      { value: 1, label: 'I mostly watch what others are doing and wait' },
      { value: 0, label: "I avoid them or they're not on my radar" },
    ],
  },
  {
    id: 'q10',
    dimension: 'builder_mindset',
    text: "How would you describe your own Atlassian automation fluency — not your team's, yours?",
    options: [
      { value: 4, label: 'I build, test, and maintain automation rules — I could teach this' },
      { value: 3, label: 'I can build simple rules independently' },
      { value: 2, label: "I can edit existing rules but not create from scratch" },
      { value: 1, label: "I know it's possible but I haven't done it myself" },
      { value: 0, label: "I don't have the access or context to build automation" },
    ],
  },
];

export const MAX_DIMENSION_SCORE = 8; // 2 questions × 4 pts
export const MAX_OVERALL_SCORE = 40; // 10 questions × 4 pts
