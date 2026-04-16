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
  | 'value_streams'
  | 'stack_maturity'
  | 'data_integration'
  | 'change_governance'
  | 'culture_skills';

export const DIMENSIONS: Record<Dimension, string> = {
  value_streams: 'Value Stream Structure',
  stack_maturity: 'Atlassian Stack Maturity',
  data_integration: 'Data Integration & Quality',
  change_governance: 'Change & Governance',
  culture_skills: 'Culture & Skills',
};

// Role identifier (Q0) — asked first, drives routing
export interface RoleOption {
  id: string;
  label: string;
  role: Role;
}

export const ROLE_OPTIONS: RoleOption[] = [
  { id: 'it_leader', label: 'IT leader (CIO, CTO, VP, Director, Head of)', role: 'exec' },
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
  // ==== Dimension 1: Value Stream Structure ====
  {
    id: 'q1',
    dimension: 'value_streams',
    text: 'How are your teams primarily organized?',
    options: [
      { value: 4, label: 'Around shippable products or services, end-to-end' },
      { value: 3, label: 'Around shared platforms with stable teams' },
      { value: 2, label: 'A mix of project teams and stable teams' },
      { value: 1, label: 'Around functional roles/tools (e.g., "the Java team")' },
      { value: 0, label: "I don't know, or it varies widely by area" },
    ],
  },
  {
    id: 'q2',
    dimension: 'value_streams',
    text: 'If a senior leader asks "what\'s the status of X outcome?" how do they get the answer?',
    options: [
      { value: 4, label: 'Live dashboard they can read themselves' },
      { value: 3, label: 'They ping a team owner who has the full picture' },
      { value: 2, label: 'Someone aggregates status from multiple teams/tools' },
      { value: 1, label: 'A weekly report is compiled manually' },
      { value: 0, label: 'Unclear — depends who they ask' },
    ],
  },

  // ==== Dimension 2: Atlassian Stack Maturity ====
  {
    id: 'q3',
    dimension: 'stack_maturity',
    text: 'Which Atlassian products are actively used in your current environment?',
    options: [
      { value: 4, label: 'Jira + Confluence + JSM + Assets + Analytics (full stack)' },
      { value: 3, label: 'Jira + Confluence + JSM (delivery + service)' },
      { value: 2, label: 'Jira + Confluence (delivery only)' },
      { value: 1, label: 'Jira alone or with one add-on' },
      { value: 0, label: 'Mostly tools outside Atlassian, or unsure / varies by team' },
    ],
  },
  {
    id: 'q4',
    dimension: 'stack_maturity',
    text: 'How well integrated are Jira (delivery) and JSM (service)?',
    options: [
      { value: 4, label: 'Single instance, shared data, unified reporting' },
      { value: 3, label: 'Same platform, loose integration via linked issues' },
      { value: 2, label: 'Separate instances, occasional data exports' },
      { value: 1, label: 'JSM is minimally used or in a separate tool' },
      { value: 0, label: "We don't use JSM at all" },
    ],
  },

  // ==== Dimension 3: Data Integration & Quality ====
  {
    id: 'q5',
    dimension: 'data_integration',
    text: 'Where does the source of truth for delivery status live?',
    options: [
      { value: 4, label: 'Single Jira board, continuously updated, real-time accurate' },
      { value: 3, label: 'Jira board plus weekly corrections in ceremonies' },
      { value: 2, label: 'Spreadsheets built from Jira exports' },
      { value: 1, label: 'Various team-specific tools (unaligned)' },
      { value: 0, label: 'Status is gathered verbally or via reports' },
    ],
  },
  {
    id: 'q6',
    dimension: 'data_integration',
    text: 'Can you query across Jira + JSM + adjacent tools to answer business questions? (e.g., "how many outages this quarter traced to releases from Team X")',
    options: [
      { value: 4, label: 'Yes — analytics layer spans tools, queryable' },
      { value: 3, label: 'Partially — for some question types, not others' },
      { value: 2, label: 'Only with manual spreadsheet work' },
      { value: 1, label: 'Not really — each tool tells its own story' },
      { value: 0, label: 'Never tried — would not know where to start' },
    ],
  },

  // ==== Dimension 4: Change & Governance ====
  {
    id: 'q7',
    dimension: 'change_governance',
    text: 'How are production changes typically managed in the environment you work with?',
    options: [
      { value: 4, label: 'Automated workflows with approval + audit trail in one system' },
      { value: 3, label: 'CAB meetings with documented tickets' },
      { value: 2, label: 'Email approvals + documentation scattered across tools' },
      { value: 1, label: 'Ad-hoc — depends on team or severity' },
      { value: 0, label: 'Not formalized, prefer not to say, or varies significantly' },
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

  // ==== Dimension 5: Culture & Skills ====
  {
    id: 'q9',
    dimension: 'culture_skills',
    text: 'When AI tools (like Rovo) come up in the environments you work in, the dominant reaction is:',
    options: [
      { value: 4, label: 'Leadership is actively experimenting and scaling' },
      { value: 3, label: 'Some teams piloting, others cautiously watching' },
      { value: 2, label: 'Mix of curiosity and quiet fear, no clear direction' },
      { value: 1, label: 'Mostly fear of replacement or compliance risk' },
      { value: 0, label: 'Almost no discussion — not on the radar' },
    ],
  },
  {
    id: 'q10',
    dimension: 'culture_skills',
    text: 'How would you rate the teams you work with on Atlassian automation fluency (rules, Jira automations, APIs)?',
    options: [
      { value: 4, label: 'Multiple people can build AND govern automation rules' },
      { value: 3, label: 'One or two people own it, others use the outputs' },
      { value: 2, label: 'Mostly using Atlassian defaults, not custom automation' },
      { value: 1, label: 'Rely on vendors/consultants for anything beyond basics' },
      { value: 0, label: "Automation isn't used meaningfully, or I don't have visibility" },
    ],
  },
];

export const MAX_DIMENSION_SCORE = 8; // 2 questions × 4 pts
export const MAX_OVERALL_SCORE = 40; // 10 questions × 4 pts
