// Learning Path definitions — one per assessment tier
// Each path contains a sequence of lessons, with the first lesson
// always free (ungated teaser) and subsequent lessons requiring membership.

import type { Tier } from './scoring';

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration_minutes: number;
  is_free: boolean; // true = ungated teaser lesson
  order: number;
}

export interface LearningPath {
  slug: string;
  name: string;
  description: string;
  targetTier: Tier; // which assessment tier maps here
  lessons: Lesson[];
}

// ─── Rovo Governance (Ready tier) ─────────────────────────────────────
const rovoGovernance: LearningPath = {
  slug: 'rovo-governance',
  name: 'Architect Rovo Governance',
  description:
    'You scored Rovo-Ready. This path focuses on governance frameworks, change control, and scaling Rovo across your organization.',
  targetTier: 'ready',
  lessons: [
    {
      id: 'rg-01',
      slug: 'rovo-agent-governance-framework',
      title: 'Rovo Agent Governance Framework',
      description:
        'Establish guardrails and approval workflows for Rovo agents before they touch production data.',
      duration_minutes: 12,
      is_free: true,
      order: 1,
    },
    {
      id: 'rg-02',
      slug: 'building-change-control-for-ai-actions',
      title: 'Building Change Control for AI-Generated Actions',
      description:
        'Integrate Rovo agent outputs into your existing change management process without creating bottlenecks.',
      duration_minutes: 18,
      is_free: false,
      order: 2,
    },
    {
      id: 'rg-03',
      slug: 'cross-tool-integration-patterns',
      title: 'Cross-Tool Integration Patterns',
      description:
        'Connect Rovo with JSM, Confluence, and third-party tools using proven integration patterns.',
      duration_minutes: 22,
      is_free: false,
      order: 3,
    },
    {
      id: 'rg-04',
      slug: 'measuring-rovo-roi',
      title: 'Measuring Rovo ROI',
      description:
        'Build dashboards and KPIs that prove Rovo value to leadership — cycle time, deflection rate, and cost savings.',
      duration_minutes: 15,
      is_free: false,
      order: 4,
    },
    {
      id: 'rg-05',
      slug: 'scaling-rovo-across-teams',
      title: 'Scaling Rovo Across Teams',
      description:
        'Roll out Rovo from pilot to enterprise with a phased adoption playbook and common pitfall avoidance.',
      duration_minutes: 20,
      is_free: false,
      order: 5,
    },
  ],
};

// ─── Stack Optimizer (Close tier) ─────────────────────────────────────
const stackOptimizer: LearningPath = {
  slug: 'stack-optimizer',
  name: 'Close the Gap',
  description:
    'You scored Close to Ready. This path helps you diagnose stack gaps, tighten integrations, and prepare for Rovo deployment.',
  targetTier: 'close',
  lessons: [
    {
      id: 'so-01',
      slug: 'diagnosing-atlassian-stack-gaps',
      title: 'Diagnosing Your Atlassian Stack Gaps',
      description:
        'Run a structured audit to identify the specific configuration and integration gaps holding you back.',
      duration_minutes: 14,
      is_free: true,
      order: 1,
    },
    {
      id: 'so-02',
      slug: 'jsm-jira-integration-deep-dive',
      title: 'JSM + Jira Integration Deep Dive',
      description:
        'Unify service management and project delivery with bi-directional JSM-Jira workflows.',
      duration_minutes: 20,
      is_free: false,
      order: 2,
    },
    {
      id: 'so-03',
      slug: 'data-integration-patterns-hybrid',
      title: 'Data Integration Patterns for Hybrid Stacks',
      description:
        'Connect on-prem and cloud data sources so Rovo agents can access the full picture.',
      duration_minutes: 18,
      is_free: false,
      order: 3,
    },
    {
      id: 'so-04',
      slug: 'building-your-governance-model',
      title: 'Building Your Governance Model',
      description:
        'Design lightweight governance that satisfies compliance without slowing teams down.',
      duration_minutes: 16,
      is_free: false,
      order: 4,
    },
    {
      id: 'so-05',
      slug: 'preparing-for-rovo-deployment',
      title: 'Preparing for Rovo Deployment',
      description:
        'Final checklist: data quality, permissions, agent configuration, and pilot team selection.',
      duration_minutes: 15,
      is_free: false,
      order: 5,
    },
  ],
};

// ─── Foundation Builder (Foundation tier) ──────────────────────────────
const foundationBuilder: LearningPath = {
  slug: 'foundation-builder',
  name: 'Build the Foundation',
  description:
    'You scored Foundation First. This path establishes the organizational and technical prerequisites for AI readiness.',
  targetTier: 'foundation',
  lessons: [
    {
      id: 'fb-01',
      slug: 'value-streams-why-structure-beats-tools',
      title: 'Value Streams: Why Structure Beats Tools',
      description:
        'Understand why mapping your value streams is the single most important step before any tooling investment.',
      duration_minutes: 10,
      is_free: true,
      order: 1,
    },
    {
      id: 'fb-02',
      slug: 'atlassian-stack-audit-checklist',
      title: 'Atlassian Stack Audit Checklist',
      description:
        'Walk through a practical checklist to assess your current Atlassian configuration maturity.',
      duration_minutes: 16,
      is_free: false,
      order: 2,
    },
    {
      id: 'fb-03',
      slug: 'from-waterfall-to-flow',
      title: 'From Waterfall to Flow',
      description:
        'Transition from stage-gate delivery to continuous flow — the organizational shift AI demands.',
      duration_minutes: 20,
      is_free: false,
      order: 3,
    },
    {
      id: 'fb-04',
      slug: 'change-management-fundamentals',
      title: 'Change Management Fundamentals',
      description:
        'Build change management muscle before introducing AI — because technology adoption is a people problem.',
      duration_minutes: 18,
      is_free: false,
      order: 4,
    },
    {
      id: 'fb-05',
      slug: 'building-internal-ai-readiness',
      title: 'Building Internal AI Readiness',
      description:
        'Create an internal AI readiness roadmap that leadership will actually fund.',
      duration_minutes: 15,
      is_free: false,
      order: 5,
    },
  ],
};

// ─── Getting Started (Not Yet tier) ───────────────────────────────────
const gettingStarted: LearningPath = {
  slug: 'getting-started',
  name: 'Start Here',
  description:
    'You scored Not Yet. This path covers the essentials — what AI readiness means and how to build a case for change.',
  targetTier: 'notyet',
  lessons: [
    {
      id: 'gs-01',
      slug: 'what-ai-readiness-actually-means',
      title: 'What AI Readiness Actually Means',
      description:
        'Cut through the hype: what organizations actually need before AI tools deliver value.',
      duration_minutes: 8,
      is_free: true,
      order: 1,
    },
    {
      id: 'gs-02',
      slug: 'understanding-your-organizations-structure',
      title: "Understanding Your Organization's Structure",
      description:
        'Map your current org structure, delivery model, and decision-making patterns as a baseline.',
      duration_minutes: 12,
      is_free: false,
      order: 2,
    },
    {
      id: 'gs-03',
      slug: 'the-case-for-value-streams',
      title: 'The Case for Value Streams',
      description:
        'Learn to articulate why value stream mapping matters — in language executives understand.',
      duration_minutes: 10,
      is_free: false,
      order: 3,
    },
  ],
};

// ─── Exports ──────────────────────────────────────────────────────────

/** All learning paths indexed by slug */
export const LEARNING_PATHS: Record<string, LearningPath> = {
  'rovo-governance': rovoGovernance,
  'stack-optimizer': stackOptimizer,
  'foundation-builder': foundationBuilder,
  'getting-started': gettingStarted,
};

/** All learning paths indexed by target tier */
export const PATHS_BY_TIER: Record<Tier, LearningPath> = {
  ready: rovoGovernance,
  close: stackOptimizer,
  foundation: foundationBuilder,
  notyet: gettingStarted,
};

/** All lessons across all paths, indexed by lesson ID */
export const ALL_LESSONS: Record<string, Lesson & { pathSlug: string }> = {};
for (const path of Object.values(LEARNING_PATHS)) {
  for (const lesson of path.lessons) {
    ALL_LESSONS[lesson.id] = { ...lesson, pathSlug: path.slug };
  }
}

/** Find a lesson by its URL slug (used in dynamic routes) */
export function getLessonBySlug(slug: string): (Lesson & { pathSlug: string }) | undefined {
  return Object.values(ALL_LESSONS).find((l) => l.slug === slug);
}
