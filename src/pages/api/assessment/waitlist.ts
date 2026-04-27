import type { APIRoute } from 'astro';
import { createOrUpdateSubscriber } from '../../../lib/rovo/kit';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  let body: { email: string; first_name?: string; tags: string[] };
  try {
    body = await request.json() as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!body.email || typeof body.email !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing email' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const allowedTags = ['builder', 'orchestrator', 'facilitator', 'community_waitlist', 'orchestrator_waitlist', 'b2b_waitlist'];
  const tags = (body.tags || []).filter(t => allowedTags.includes(t));

  const runtime = (locals as Record<string, unknown>).runtime as { env?: Record<string, string> } | undefined;
  const kitApiKey = runtime?.env?.KIT_API_KEY;

  if (!kitApiKey) {
    return new Response(JSON.stringify({ status: 'skipped', reason: 'No API key' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const result = await createOrUpdateSubscriber(body.email, body.first_name, tags, kitApiKey);
  return new Response(JSON.stringify(result), { status: result.status === 'success' ? 200 : 500, headers: { 'Content-Type': 'application/json' } });
};
