// POST /api/assessment/score — Rovo-Readiness Assessment scoring endpoint
// Replaces the separate Cloudflare Worker at workers/assessment/
// Imports scoring logic directly from src/lib/rovo/ (no duplication).

import type { APIRoute } from 'astro';
import { calculateScoring } from '../../../lib/rovo/scoring';
import { createOrUpdateSubscriber } from '../../../lib/rovo/kit';
import {
  ROLE_OPTIONS,
  DEPLOYMENT_OPTIONS,
  type Role,
  type Deployment,
} from '../../../lib/rovo/questions';

// Derive valid values from the source-of-truth option arrays
const VALID_ROLES: Role[] = [...new Set(ROLE_OPTIONS.map(r => r.role))];
const VALID_DEPLOYMENTS: Deployment[] = DEPLOYMENT_OPTIONS.map(d => d.id);

const REQUIRED_QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];

interface RequestBody {
  email: string;
  first_name?: string;
  role: string;
  role_id?: string;
  deployment: string;
  answers: Record<string, number>;
  consent_marketing?: boolean;
  timestamp?: string;
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const prerender = false; // Server-rendered (not static)

export const POST: APIRoute = async ({ request }) => {
  // Parse body
  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return jsonError('Invalid request body', 400);
  }

  // Validate required fields
  if (!body.email || typeof body.email !== 'string') {
    return jsonError('Missing required field: email', 400);
  }
  if (!body.role || !VALID_ROLES.includes(body.role as Role)) {
    return jsonError('Missing required field: role', 400);
  }
  if (!body.deployment || !VALID_DEPLOYMENTS.includes(body.deployment as Deployment)) {
    return jsonError('Missing required field: deployment', 400);
  }
  if (!body.answers || typeof body.answers !== 'object') {
    return jsonError('Missing required field: answers', 400);
  }

  // Validate all 10 answers present and numeric
  for (const qId of REQUIRED_QUESTIONS) {
    if (typeof body.answers[qId] !== 'number') {
      return jsonError(`Missing required field: answers.${qId}`, 400);
    }
    if (body.answers[qId] < 0 || body.answers[qId] > 4) {
      return jsonError(`Invalid answer value for ${qId}: must be 0-4`, 400);
    }
  }

  // Run scoring
  let scoringResult;
  try {
    scoringResult = calculateScoring(
      body.answers,
      body.role as Role,
      body.deployment as Deployment,
    );
  } catch (err) {
    console.error('Scoring error:', err);
    return jsonError('Internal server error', 500);
  }

  // Kit API call (or stub in test mode)
  const isTestMode = import.meta.env.TEST_MODE === 'true';
  const kitApiKey = import.meta.env.KIT_API_KEY;
  let kitStatus: 'success' | 'failed' | 'skipped' = 'skipped';
  let kitSubscriberId: string | undefined;

  if (isTestMode) {
    console.log('[TEST_MODE] Kit API call stubbed. Would send:', JSON.stringify({
      email: body.email,
      first_name: body.first_name,
      tags: scoringResult.kit_tags,
    }));
    kitStatus = 'skipped';
  } else if (body.consent_marketing !== false && kitApiKey) {
    // Call Kit API (default to opting in unless explicitly false)
    const kitResult = await createOrUpdateSubscriber(
      body.email,
      body.first_name,
      scoringResult.kit_tags,
      kitApiKey,
    );
    kitStatus = kitResult.status;
    kitSubscriberId = kitResult.subscriber_id;

    if (kitResult.status === 'failed') {
      console.error('Kit API failed:', kitResult.error);
    }
  }

  // Generate session ID
  const session = crypto.randomUUID();

  // Build response
  const response = {
    tier: scoringResult.tier,
    tier_label: scoringResult.tier_label,
    overall_score_pct: scoringResult.overall_score_pct,
    dimension_scores: scoringResult.dimension_scores,
    weak_dimensions: scoringResult.weak_dimensions,
    deployment_override: scoringResult.deployment_override,
    role: scoringResult.role,
    deployment: scoringResult.deployment,
    kit_status: kitStatus,
    ...(kitSubscriberId && { kit_subscriber_id: kitSubscriberId }),
    session,
    test_mode: isTestMode,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
