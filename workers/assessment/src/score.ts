// POST /assessment/score handler

import { calculateScoring } from './scoring';
import { createOrUpdateSubscriber } from './kit';
import { VALID_DEPLOYMENTS, VALID_ROLES, type Role, type Deployment } from './questions';

interface Env {
  KIT_API_KEY: string;
  TEST_MODE: string;
  ENVIRONMENT: string;
}

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

const REQUIRED_QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleScore(request: Request, env: Env): Promise<Response> {
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
  const isTestMode = env.TEST_MODE === 'true';
  let kitStatus: 'success' | 'failed' | 'skipped' = 'skipped';
  let kitSubscriberId: string | undefined;

  if (isTestMode) {
    console.log('[TEST_MODE] Kit API call stubbed. Would send:', JSON.stringify({
      email: body.email,
      first_name: body.first_name,
      tags: scoringResult.kit_tags,
    }));
    kitStatus = 'skipped';
  } else if (body.consent_marketing !== false) {
    // Call Kit API (default to opting in unless explicitly false)
    const kitResult = await createOrUpdateSubscriber(
      body.email,
      body.first_name,
      scoringResult.kit_tags,
      env.KIT_API_KEY,
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
}
