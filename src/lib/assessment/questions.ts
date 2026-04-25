// src/lib/assessment/questions.ts
// Agile-AI Readiness Assessment — 5 dimensions × 5 questions = 25 total
// Each answer scored 0–4 (4 = Orchestrator-level). Max per dimension: 20 raw → normalized 0–100.

export type DimensionKey = 'd_atlassian' | 'd_automation' | 'd_ai' | 'd_influence' | 'd_org';

export interface AnswerOption {
  value: number;    // 0–4
  label: string;
}

export interface Question {
  id: string;
  dimension: DimensionKey;
  text: string;
  options: AnswerOption[];  // always 5, value 0–4 in order
}

export interface Dimension {
  key: DimensionKey;
  name: string;
}

export const MAX_DIMENSION_RAW = 20;
export const TOTAL_QUESTIONS = 25;

export const DIMENSIONS: Record<DimensionKey, string> = {
  d_atlassian:  'Atlassian Depth',
  d_automation: 'Automation Output',
  d_ai:         'AI Fluency',
  d_influence:  'Influence Range',
  d_org:        'Org Readiness',
};

export const QUESTIONS: Question[] = [

  // ─── ATLASSIAN DEPTH ────────────────────────────────────────────────────────

  {
    id: 'atl_1',
    dimension: 'd_atlassian',
    text: 'Which Atlassian tools do you actively configure — not just use?',
    options: [
      { value: 0, label: "I use Jira to update tickets but haven't touched settings or configuration." },
      { value: 1, label: "I've adjusted a board filter or basic project settings when someone showed me how." },
      { value: 2, label: "I configure project settings, custom fields, and board views for my team regularly." },
      { value: 3, label: "I own Jira and Confluence configuration across multiple projects — custom fields, schemes, screens." },
      { value: 4, label: "I configure Jira, Confluence, and connected tools end-to-end — Automation, Advanced Roadmaps, Atlassian Intelligence — and I treat it as a platform I build on." },
    ],
  },

  {
    id: 'atl_2',
    dimension: 'd_atlassian',
    text: 'How integrated is your delivery tooling with service or incident management?',
    options: [
      { value: 0, label: "They're completely separate — my team uses one tool, ops uses another, and nobody connects them." },
      { value: 1, label: "There's some overlap but I've never linked them — that's someone else's job." },
      { value: 2, label: "I've connected Jira and Jira Service Management for a specific flow (like incident-to-story linking)." },
      { value: 3, label: "I've built cross-tool workflows that automatically surface incidents in delivery boards and vice versa." },
      { value: 4, label: "I've designed an integrated ITSM + delivery operating model — changes, incidents, and delivery boards work as a single system." },
    ],
  },

  {
    id: 'atl_3',
    dimension: 'd_atlassian',
    text: 'Do you build Jira automation rules from scratch?',
    options: [
      { value: 0, label: "No — I didn't know that was something practitioners could do." },
      { value: 1, label: "I've enabled a pre-built rule once or twice but I've never written one myself." },
      { value: 2, label: "I've built basic rules (auto-assign, status transitions) using the visual editor." },
      { value: 3, label: "I write automation rules regularly, including conditional branches and multi-project rules." },
      { value: 4, label: "I design complex automation chains — smart values, API calls, cross-project triggers — that run in production without me touching them." },
    ],
  },

  {
    id: 'atl_4',
    dimension: 'd_atlassian',
    text: 'How do you use Confluence — consuming pages or creating structured spaces?',
    options: [
      { value: 0, label: "Mostly reading pages when someone sends me a link." },
      { value: 1, label: "I create meeting notes and basic pages but I don't structure anything intentionally." },
      { value: 2, label: "I maintain a team space with organized pages and templates my team actually uses." },
      { value: 3, label: "I've designed Confluence spaces with page templates, macros, and structured navigation for multiple teams." },
      { value: 4, label: "I treat Confluence as a living operating system — dynamic pages pulling Jira data, macros automating status pages, structured to support decision-making at scale." },
    ],
  },

  {
    id: 'atl_5',
    dimension: 'd_atlassian',
    text: 'Have you configured cross-project workflows or portfolio-level views?',
    options: [
      { value: 0, label: "No — I only work within a single project." },
      { value: 1, label: "I've seen portfolio views in demos but never configured one myself." },
      { value: 2, label: "I've set up basic roadmap or cross-project filters to give leadership visibility." },
      { value: 3, label: "I own portfolio-level configuration — Advanced Roadmaps, cross-project dependencies, program board views." },
      { value: 4, label: "I architect cross-project delivery visibility from end to end — hierarchies, dependencies, OKR links, executive dashboards — all live and maintained." },
    ],
  },

  // ─── AUTOMATION OUTPUT ──────────────────────────────────────────────────────

  {
    id: 'aut_1',
    dimension: 'd_automation',
    text: 'How much of your week is building or improving systems versus running ceremonies?',
    options: [
      { value: 0, label: "Almost all ceremonies — standups, planning, retros, backlog refinement. Building systems isn't really my job." },
      { value: 1, label: "Mostly ceremonies, but I occasionally update a template or tweak a process document." },
      { value: 2, label: "Maybe 20% of my week is improving how things work — templates, processes, light tooling." },
      { value: 3, label: "A meaningful chunk (30–40%) is improving systems — automations, dashboards, workflow changes." },
      { value: 4, label: "I protect time specifically for systems work. Ceremonies run themselves or with minimal prep because the systems do the heavy lifting." },
    ],
  },

  {
    id: 'aut_2',
    dimension: 'd_automation',
    text: "When someone asks 'what's the status?' — what's your role in producing that answer?",
    options: [
      { value: 0, label: "I pull it together manually — check tickets, ask the team, write a summary." },
      { value: 1, label: "I have a saved filter or query I run, then format the output myself." },
      { value: 2, label: "I have a dashboard that gives a near-real-time answer — I just share the link." },
      { value: 3, label: "Status is automatically pushed to stakeholders on a schedule or trigger — I rarely get asked because it's already there." },
      { value: 4, label: "Status answers itself. Automated reports, Slack digests, and live dashboards mean 'what's the status?' almost never reaches me personally." },
    ],
  },

  {
    id: 'aut_3',
    dimension: 'd_automation',
    text: 'Have you built workflow automation that runs without you?',
    options: [
      { value: 0, label: "No — my processes depend on me being present to make them happen." },
      { value: 1, label: "I've set up a recurring calendar invite or auto-reply, but nothing inside the actual workflow tools." },
      { value: 2, label: "Yes — I've built at least one automation rule in Jira or another tool that runs independently." },
      { value: 3, label: "I have multiple automations running in production that handle regular workflow tasks without any manual input." },
      { value: 4, label: "I've built a web of interconnected automations — cross-tool, event-driven — that handle a significant portion of what used to be manual coordination work." },
    ],
  },

  {
    id: 'aut_4',
    dimension: 'd_automation',
    text: 'Do you use scripting or APIs to extend your tools beyond what they do out of the box?',
    options: [
      { value: 0, label: "No — I use tools as-is. Scripting is for developers, not practitioners like me." },
      { value: 1, label: "I've copied a script from somewhere and run it, but I couldn't write one from scratch." },
      { value: 2, label: "I've used Jira's automation with smart values, or built a basic integration with Zapier or Make." },
      { value: 3, label: "I've called APIs directly (Jira REST, Confluence API) to pull or push data for reporting or automation purposes." },
      { value: 4, label: "I build custom integrations — API calls, webhooks, scripts — that extend my tooling in ways the UI doesn't support out of the box." },
    ],
  },

  {
    id: 'aut_5',
    dimension: 'd_automation',
    text: 'How do you handle repetitive manual processes that happen every sprint or week?',
    options: [
      { value: 0, label: "I just do them — it's part of the job." },
      { value: 1, label: "I have a checklist or template to make them faster, but they still require manual effort." },
      { value: 2, label: "I've eliminated at least one repetitive task with a tool or process change." },
      { value: 3, label: "I systematically eliminate manual work. If I do the same thing twice, I look for a way to automate it." },
      { value: 4, label: "I treat manual repetition as a system design failure. Almost nothing recurs without a trigger, automation, or agent handling it." },
    ],
  },

  // ─── AI FLUENCY ─────────────────────────────────────────────────────────────

  {
    id: 'ai_1',
    dimension: 'd_ai',
    text: 'How do you use AI tools (Copilot, ChatGPT, Rovo, etc.) in your daily work?',
    options: [
      { value: 0, label: "I haven't really started — I'm watching how it plays out first." },
      { value: 1, label: "I use ChatGPT occasionally for quick questions, but it's not part of my regular workflow." },
      { value: 2, label: "I use AI tools daily for drafting, summarizing, or answering questions — it's saved me real time." },
      { value: 3, label: "I use multiple AI tools fluidly for different tasks and I've built them into how I work, not just as a search replacement." },
      { value: 4, label: "AI is embedded in how I operate. I use it to build prompts, workflows, and agent chains — not just ask questions." },
    ],
  },

  {
    id: 'ai_2',
    dimension: 'd_ai',
    text: 'Have you built or configured an AI agent or AI-powered workflow for your team?',
    options: [
      { value: 0, label: "No — I wouldn't know where to start." },
      { value: 1, label: "I've experimented with a tool that has AI features built in, but I didn't configure the AI part." },
      { value: 2, label: "I've set up a basic AI-assisted workflow — like an AI-generated summary that feeds a Confluence page." },
      { value: 3, label: "I've built and deployed at least one AI agent or multi-step AI workflow that my team or stakeholders actively use." },
      { value: 4, label: "I've designed multi-agent systems — agents with sub-tasks, outputs that feed other agents — and I can spec new ones from scratch." },
    ],
  },

  {
    id: 'ai_3',
    dimension: 'd_ai',
    text: 'How would you evaluate whether an AI tool is safe to use in your organization?',
    options: [
      { value: 0, label: "I'd ask IT or security — that's their call, not mine." },
      { value: 1, label: "I'd check if the vendor is reputable and read the privacy policy." },
      { value: 2, label: "I'd check data residency, whether training uses your data, and whether it meets your industry's compliance baseline." },
      { value: 3, label: "I can run a structured evaluation — data handling, model access, audit logging, policy alignment — and present a risk summary to leadership." },
      { value: 4, label: "I build and lead AI governance evaluations. I can map a tool to your org's risk framework, flag gaps, and write the policy for using it responsibly." },
    ],
  },

  {
    id: 'ai_4',
    dimension: 'd_ai',
    text: 'Can you articulate an AI use case to a skeptical stakeholder who thinks it\'s all hype?',
    options: [
      { value: 0, label: "Honestly, I'm not sure I'd know what to say — I find it hard to explain the value myself." },
      { value: 1, label: "I could share some examples I've read about, but I'd struggle to connect them to our specific context." },
      { value: 2, label: "I can walk through one or two concrete examples from my own work and explain the before/after." },
      { value: 3, label: "I can tailor the pitch to the stakeholder's concerns — ROI, risk, timeline — and handle the obvious objections." },
      { value: 4, label: "I've done this many times. I can map AI opportunities to business outcomes, speak to governance risks proactively, and get skeptical executives to at least run a pilot." },
    ],
  },

  {
    id: 'ai_5',
    dimension: 'd_ai',
    text: 'How do you stay current with AI developments relevant to your role?',
    options: [
      { value: 0, label: "I mostly catch news when it shows up in my feed — no active effort." },
      { value: 1, label: "I follow a few LinkedIn accounts or newsletters, but I don't have a structured practice." },
      { value: 2, label: "I set aside time weekly to read about AI tools and trends, and I experiment with new tools when they're relevant." },
      { value: 3, label: "I have a personal system — curated sources, regular experiments, notes on what I've tried — and I share relevant findings with my team." },
      { value: 4, label: "I treat staying current as a professional responsibility. I run internal briefings, maintain a living knowledge base, and contribute to how my org thinks about AI adoption." },
    ],
  },

  // ─── INFLUENCE RANGE ────────────────────────────────────────────────────────

  {
    id: 'inf_1',
    dimension: 'd_influence',
    text: 'When process changes happen in your org, what\'s your role?',
    options: [
      { value: 0, label: "I find out about changes through announcements — I'm not usually involved beforehand." },
      { value: 1, label: "Sometimes I'm asked for input on changes affecting my team, after the decision is mostly made." },
      { value: 2, label: "I'm regularly consulted on process changes for my team and occasionally adjacent teams." },
      { value: 3, label: "I initiate and drive process changes — I identify problems, design solutions, and get them implemented." },
      { value: 4, label: "I'm the person organizations call when they need a process redesign. I drive changes across teams, levels, and sometimes organizations." },
    ],
  },

  {
    id: 'inf_2',
    dimension: 'd_influence',
    text: 'How do leaders outside your immediate team view your function?',
    options: [
      { value: 0, label: "I'm not sure they know what I do specifically — they see 'Scrum Master' or 'PM' and move on." },
      { value: 1, label: "They see me as a team coordinator — useful, but not someone they bring into strategic conversations." },
      { value: 2, label: "A few leaders outside my team know my work and occasionally pull me into discussions about delivery." },
      { value: 3, label: "I'm recognized cross-functionally as a delivery expert — leaders seek me out for input on how things run." },
      { value: 4, label: "I'm positioned as a strategic partner at the leadership level. My function shapes how the organization thinks about delivery and AI adoption." },
    ],
  },

  {
    id: 'inf_3',
    dimension: 'd_influence',
    text: 'Have you driven adoption of a tool or practice across multiple teams?',
    options: [
      { value: 0, label: "No — I've focused on my own team and what we need." },
      { value: 1, label: "I've shared a tool or practice with another team informally, but I didn't drive any formal rollout." },
      { value: 2, label: "Yes — I've successfully rolled out a practice or tool to two or more teams, including facilitating training." },
      { value: 3, label: "I've led org-wide rollouts — stakeholder alignment, change management, adoption metrics — for tools or practices." },
      { value: 4, label: "I've driven adoption at scale — across hundreds of people, multiple orgs, or as part of enterprise transformation programs." },
    ],
  },

  {
    id: 'inf_4',
    dimension: 'd_influence',
    text: 'Do you get pulled into strategic conversations about delivery or operations?',
    options: [
      { value: 0, label: "No — strategy conversations happen above me." },
      { value: 1, label: "Occasionally, after the strategy is set, to figure out implementation." },
      { value: 2, label: "Sometimes — especially when delivery is at risk or there's a big change happening." },
      { value: 3, label: "Regularly — I'm in the room when delivery strategy gets shaped, not just when it gets handed down." },
      { value: 4, label: "I initiate strategic conversations. Leaders come to me to understand delivery capacity, risk, and how to structure AI-enabled operations." },
    ],
  },

  {
    id: 'inf_5',
    dimension: 'd_influence',
    text: 'How do you communicate value to non-agile stakeholders?',
    options: [
      { value: 0, label: "I mostly explain what agile is and how ceremonies work — the basics." },
      { value: 1, label: "I can explain my team's velocity and sprint completion, but I'm not sure it resonates beyond agile audiences." },
      { value: 2, label: "I translate team metrics into business terms — time saved, cycle time, delivery predictability." },
      { value: 3, label: "I build a narrative around delivery outcomes — what shipped, what it cost, what was at risk, and what changed — tailored to each stakeholder." },
      { value: 4, label: "I operate as a business partner, not a process owner. I speak in terms of risk reduction, revenue impact, and strategic capacity — and stakeholders treat me that way." },
    ],
  },

  // ─── ORG READINESS ──────────────────────────────────────────────────────────

  {
    id: 'org_1',
    dimension: 'd_org',
    text: 'Does your organization have an official stance on AI tool usage?',
    options: [
      { value: 0, label: "Not that I know of — it's a bit of the wild west right now." },
      { value: 1, label: "There's informal guidance (\"use your judgment\") but nothing written or official." },
      { value: 2, label: "There's a policy, but it's mostly about what not to do — not a framework for responsible adoption." },
      { value: 3, label: "We have a formal AI usage policy with approved tools, risk categories, and a review process." },
      { value: 4, label: "We have a mature AI governance framework — approved tools, responsible use standards, audit capability, and an active center of excellence." },
    ],
  },

  {
    id: 'org_2',
    dimension: 'd_org',
    text: 'How would governance handle an AI-initiated production change?',
    options: [
      { value: 0, label: "It wouldn't — there's no concept of AI-initiated changes in our governance model." },
      { value: 1, label: "It would be treated like any other change — someone would manually review and approve it." },
      { value: 2, label: "There are emerging discussions about this, but no formal process yet." },
      { value: 3, label: "We have documented criteria for when AI-initiated changes are allowed versus when human sign-off is required." },
      { value: 4, label: "We have a full AI change governance model — audit trails, approval thresholds, rollback protocols — that's actually in use." },
    ],
  },

  {
    id: 'org_3',
    dimension: 'd_org',
    text: 'Is there budget and appetite for new tooling in your area?',
    options: [
      { value: 0, label: "No — new tools require an executive sponsor and months of procurement, and the answer is usually no." },
      { value: 1, label: "Occasionally, for clearly justified tools, but the process is slow and uncertain." },
      { value: 2, label: "There's a defined process and reasonable appetite — it's not easy, but it's possible." },
      { value: 3, label: "There's active investment appetite — leadership is pushing teams to adopt AI tools and allocating budget to do it." },
      { value: 4, label: "We have a dedicated innovation budget, a fast-track procurement path, and leadership that actively wants to be a fast follower on AI adoption." },
    ],
  },

  {
    id: 'org_4',
    dimension: 'd_org',
    text: 'How does your organization handle change management for process shifts?',
    options: [
      { value: 0, label: "It mostly happens by announcement — something changes and people find out after the fact." },
      { value: 1, label: "There's a communications plan, but adoption is hit or miss." },
      { value: 2, label: "We have a basic change management approach — stakeholder comms, training, and a feedback loop." },
      { value: 3, label: "We follow a structured model — change champions, staged rollouts, adoption metrics, retrospectives on the change itself." },
      { value: 4, label: "Change management is a core capability here. Major changes have dedicated program owners, measurable adoption goals, and we treat resistance as design feedback." },
    ],
  },

  {
    id: 'org_5',
    dimension: 'd_org',
    text: 'What\'s the data maturity of your delivery metrics?',
    options: [
      { value: 0, label: "We mostly report story points and sprint completion — the basics that fit on a status slide." },
      { value: 1, label: "We have some dashboards, but data quality is inconsistent and people don't fully trust the numbers." },
      { value: 2, label: "We have reliable delivery metrics (cycle time, throughput, lead time) that the team and leadership both use." },
      { value: 3, label: "We have multi-level metrics — team, program, portfolio — with enough data quality that we make decisions from them rather than just report them." },
      { value: 4, label: "Our metrics are integrated, real-time, and connected to business outcomes. AI can act on them — not just humans reading dashboards." },
    ],
  },
];
