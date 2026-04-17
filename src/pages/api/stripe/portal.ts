// POST /api/stripe/portal
// Creates a Stripe Billing Portal Session for existing subscribers.
// Requires authentication. Returns { url } for redirect to Stripe's billing portal.

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createAuth, getEnvFromLocals, type AuthEnv } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, url }) => {
  const headers = { 'Content-Type': 'application/json' };

  // ── Auth check ──────────────────────────────────────────────────────
  const env = getEnvFromLocals(locals as Record<string, unknown>);

  if (!env) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 503,
      headers,
    });
  }

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response(JSON.stringify({ error: 'unauthenticated' }), {
      status: 401,
      headers,
    });
  }

  // ── Look up Stripe customer ID from D1 ─────────────────────────────
  // Query the members table for the stripe_customer_id linked to this user
  const db = (env as AuthEnv & { DB: import('@cloudflare/workers-types').D1Database }).DB;

  let stripeCustomerId: string | null = null;
  try {
    const result = await db
      .prepare('SELECT stripe_customer_id FROM members WHERE better_auth_user_id = ?')
      .bind(session.user.id)
      .first<{ stripe_customer_id: string | null }>();
    stripeCustomerId = result?.stripe_customer_id ?? null;
  } catch (err) {
    console.error('[stripe/portal] D1 query failed:', err);
  }

  if (!stripeCustomerId) {
    return new Response(
      JSON.stringify({ error: 'No Stripe customer found. Please subscribe first.' }),
      { status: 400, headers },
    );
  }

  // ── Create Stripe Billing Portal Session ────────────────────────────
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  });

  const origin = url.origin;

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/member/dashboard`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe portal creation failed';
    console.error('[stripe/portal] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers,
    });
  }
};
