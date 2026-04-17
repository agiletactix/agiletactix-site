// Better Auth catch-all API route
// Handles: signup, login, logout, session, OAuth callbacks, Stripe webhooks
// Runs on Cloudflare Pages edge runtime (no Node.js APIs)

import type { APIRoute } from 'astro';
import { createAuth, getEnvFromLocals } from '../../../lib/auth';

export const prerender = false;

const handler: APIRoute = async ({ request, locals }) => {
  const env = getEnvFromLocals(locals as Record<string, unknown>);
  if (!env) {
    return new Response(JSON.stringify({ error: 'Auth not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const auth = createAuth(env);
  return auth.handler(request);
};

// Better Auth uses GET and POST
export const GET = handler;
export const POST = handler;
