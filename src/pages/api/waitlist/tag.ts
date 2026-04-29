import type { APIRoute } from 'astro';
import { createOrUpdateSubscriber } from '../../../lib/rovo/kit';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  let body: { email?: string; first_name?: string; tag?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  if (!body.email || !body.tag) {
    return new Response(JSON.stringify({ error: 'Missing email or tag' }), { status: 400 });
  }

  const runtime = (locals as Record<string, unknown>).runtime as { env?: { KIT_API_KEY?: string } } | undefined;
  const kitApiKey = runtime?.env?.KIT_API_KEY;

  if (!kitApiKey) {
    return new Response(JSON.stringify({ error: 'Kit not configured' }), { status: 503 });
  }

  const result = await createOrUpdateSubscriber(
    body.email,
    body.first_name,
    [body.tag],
    kitApiKey,
  );

  if (result.status === 'failed') {
    return new Response(JSON.stringify({ error: result.error }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
