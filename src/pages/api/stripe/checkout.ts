// POST /api/stripe/checkout
// Creates a Stripe Checkout Session for Pro (subscription) or Lab (one-time payment).
// Requires authentication. Returns { url } for redirect to Stripe's hosted checkout.

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createAuth, getEnvFromLocals, type AuthEnv } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, url }) => {
  const headers = { 'Content-Type': 'application/json' };

  // ── Auth check ──────────────────────────────────────────────────────
  const env = getEnvFromLocals(locals as Record<string, unknown>) as AuthEnv & {
    STRIPE_PRO_PRICE_ID?: string;
    STRIPE_LAB_PRICE_ID?: string;
  } | null;

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

  // ── Parse body ──────────────────────────────────────────────────────
  let body: { priceType?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers,
    });
  }

  const priceType = body.priceType;
  if (priceType !== 'pro' && priceType !== 'lab') {
    return new Response(JSON.stringify({ error: 'Invalid priceType. Must be "pro" or "lab".' }), {
      status: 400,
      headers,
    });
  }

  // ── Resolve price ID and mode ───────────────────────────────────────
  const proPriceId = env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder';
  const labPriceId = env.STRIPE_LAB_PRICE_ID || 'price_lab_placeholder';

  const priceId = priceType === 'pro' ? proPriceId : labPriceId;
  const mode = priceType === 'pro' ? 'subscription' as const : 'payment' as const;

  // ── Create Stripe Checkout Session ──────────────────────────────────
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  });

  const origin = url.origin;

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/member/dashboard?upgraded=true`,
      cancel_url: `${origin}/pricing`,
      customer_email: session.user.email,
      client_reference_id: session.user.id,
      metadata: {
        betterAuthUserId: session.user.id,
        priceType,
      },
    });

    return new Response(JSON.stringify({ url: checkoutSession.url }), {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe checkout creation failed';
    console.error('[stripe/checkout] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers,
    });
  }
};
