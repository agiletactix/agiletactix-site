// GET /api/assessment/retrieve?t=<token>
// Looks up an assessment by its token (ID) and returns the result data.

import type { APIRoute } from 'astro';
import { getDb, getAssessmentById, getMemberById } from '../../../lib/db';

export const prerender = false;

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ url, locals }) => {
  const token = url.searchParams.get('t');
  if (!token) {
    return jsonError('Missing required query param: t', 400);
  }

  const runtime = (locals as Record<string, unknown>).runtime as { env?: { DB?: import('@cloudflare/workers-types').D1Database } } | undefined;
  const d1Binding = runtime?.env?.DB;

  if (!d1Binding) {
    return jsonError('Database not available', 503);
  }

  const db = getDb(d1Binding);

  const assessment = await getAssessmentById(db, token);
  if (!assessment) {
    return jsonError('Assessment not found', 404);
  }

  const member = assessment.memberId ? await getMemberById(db, assessment.memberId) : null;

  // Parse stored dimension scores
  let dimensionScores: Record<string, number> = {};
  try {
    const parsed = JSON.parse(assessment.dimensionScores ?? '{}') as Record<string, number>;
    dimensionScores = parsed;
  } catch {
    // leave empty
  }

  const responseBody = {
    name: member?.firstName ?? '',
    email: member?.email ?? '',
    scores: {
      d_atlassian:  dimensionScores.d_atlassian  ?? 0,
      d_automation: dimensionScores.d_automation ?? 0,
      d_ai:         dimensionScores.d_ai         ?? 0,
      d_influence:  dimensionScores.d_influence  ?? 0,
      d_org:        dimensionScores.d_org        ?? 0,
    },
    tier: assessment.tier ?? 'facilitator',
    overall_score_pct: assessment.overallScorePct ?? 0,
  };

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
