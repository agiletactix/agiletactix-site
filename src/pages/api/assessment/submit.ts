// POST /api/assessment/submit — Legacy assessment (questions.astro) submission
// Validates scores, computes tier, stores in D1, optionally subscribes to Kit.

import type { APIRoute } from 'astro';
import { createOrUpdateSubscriber } from '../../../lib/rovo/kit';
import { getDb, upsertMember, createAssessment } from '../../../lib/db';

export const prerender = false;

interface ScoreBody {
  d_atlassian: number;
  d_automation: number;
  d_ai: number;
  d_influence: number;
  d_org: number;
}

interface RequestBody {
  email: string;
  first_name: string;
  consent_marketing?: boolean;
  scores: ScoreBody;
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isValidScore(v: unknown): v is number {
  return typeof v === 'number' && v >= 0 && v <= 100;
}

export const POST: APIRoute = async ({ request, locals }) => {
  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return jsonError('Invalid request body', 400);
  }

  if (!body.email || typeof body.email !== 'string') {
    return jsonError('Missing required field: email', 400);
  }
  if (!body.first_name || typeof body.first_name !== 'string') {
    return jsonError('Missing required field: first_name', 400);
  }
  if (!body.scores || typeof body.scores !== 'object') {
    return jsonError('Missing required field: scores', 400);
  }

  const { d_atlassian, d_automation, d_ai, d_influence, d_org } = body.scores;
  for (const [key, val] of [
    ['d_atlassian', d_atlassian],
    ['d_automation', d_automation],
    ['d_ai', d_ai],
    ['d_influence', d_influence],
    ['d_org', d_org],
  ] as [string, unknown][]) {
    if (!isValidScore(val)) {
      return jsonError(`Invalid or missing score: ${key} (must be 0–100)`, 400);
    }
  }

  // Compute tier
  const capAvg = (d_atlassian + d_automation + d_ai + d_influence) / 4;
  const total = Math.round(capAvg * 0.8 + d_org * 0.2);
  const tier = total >= 75 ? 'orchestrator' : total >= 50 ? 'builder' : 'facilitator';

  // Generate token (used as assessment ID)
  const token = crypto.randomUUID();

  // D1 write
  const runtime = (locals as Record<string, unknown>).runtime as { env?: { DB?: import('@cloudflare/workers-types').D1Database; KIT_API_KEY?: string } } | undefined;
  const d1Binding = runtime?.env?.DB;

  if (d1Binding) {
    try {
      const db = getDb(d1Binding);
      const memberId = await upsertMember(db, {
        id: crypto.randomUUID(),
        email: body.email,
        firstName: body.first_name,
        tier,
      });
      await createAssessment(db, {
        id: token,
        memberId,
        overallScorePct: total,
        tier,
        dimensionScores: { d_atlassian, d_automation, d_ai, d_influence, d_org },
        weakDimensions: [],
        deploymentOverride: false,
      });
    } catch (err) {
      console.error('[D1] assessment/submit write failed:', err);
      // Non-fatal — return error so client can retry
      return jsonError('Database error — please try again', 500);
    }
  } else {
    console.log('[D1] No DB binding — skipping database write');
    // In dev without D1 we still return a token so the flow works
  }

  // Kit subscribe (only if consent given and key available)
  const kitApiKey = runtime?.env?.KIT_API_KEY;
  if (body.consent_marketing === true && kitApiKey) {
    const tagMap: Record<string, string[]> = {
      facilitator: ['assessment-facilitator'],
      builder: ['assessment-builder'],
      orchestrator: ['assessment-orchestrator'],
    };
    const tags = tagMap[tier] ?? [];
    const resultsUrl = `https://agiletactix.ai/assessment/results?t=${token}`;
    const kitResult = await createOrUpdateSubscriber(
      body.email,
      body.first_name,
      tags,
      kitApiKey,
      {
        assessment_results_url: resultsUrl,
        assessment_tier: tier.charAt(0).toUpperCase() + tier.slice(1),
        assessment_score: String(total),
      },
    );
    if (kitResult.status === 'failed') {
      console.error('[Kit] assessment/submit subscribe failed:', kitResult.error);
    }
  }

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
