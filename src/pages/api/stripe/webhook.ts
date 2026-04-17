// POST /api/stripe/webhook
// Receives Stripe webhook events. NO auth — verified via webhook signature.
// Handles subscription lifecycle: checkout complete, subscription updates, cancellations, payment failures.

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getEnvFromLocals, type AuthEnv } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = { 'Content-Type': 'application/json' };

  // ── Env check ───────────────────────────────────────────────────────
  const env = getEnvFromLocals(locals as Record<string, unknown>);

  if (!env) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 503,
      headers,
    });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  });

  // ── Verify webhook signature ────────────────────────────────────────
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers,
    });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    console.error('[stripe/webhook] Signature verification failed:', message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers,
    });
  }

  // ── D1 helper ───────────────────────────────────────────────────────
  const db = (env as AuthEnv & { DB: import('@cloudflare/workers-types').D1Database }).DB;

  async function updateMemberByStripeCustomer(
    customerId: string,
    updates: { membershipStatus?: string; stripeCustomerId?: string },
  ) {
    const setClauses: string[] = [];
    const values: string[] = [];

    if (updates.membershipStatus) {
      setClauses.push('membership_status = ?');
      values.push(updates.membershipStatus);
    }
    if (updates.stripeCustomerId) {
      setClauses.push('stripe_customer_id = ?');
      values.push(updates.stripeCustomerId);
    }
    setClauses.push("updated_at = datetime('now')");

    if (setClauses.length === 1) return; // only updated_at, skip

    values.push(customerId);
    const sql = `UPDATE members SET ${setClauses.join(', ')} WHERE stripe_customer_id = ?`;

    try {
      await db.prepare(sql).bind(...values).run();
    } catch (err) {
      console.error('[stripe/webhook] D1 update failed:', err);
    }
  }

  async function linkStripeCustomerByAuthUserId(
    betterAuthUserId: string,
    customerId: string,
    membershipStatus: string,
  ) {
    try {
      await db
        .prepare(
          "UPDATE members SET stripe_customer_id = ?, membership_status = ?, updated_at = datetime('now') WHERE better_auth_user_id = ?",
        )
        .bind(customerId, membershipStatus, betterAuthUserId)
        .run();
    } catch (err) {
      console.error('[stripe/webhook] D1 link failed:', err);
    }
  }

  // ── Handle events ───────────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const betterAuthUserId = session.metadata?.betterAuthUserId ?? session.client_reference_id;

        if (customerId && betterAuthUserId) {
          await linkStripeCustomerByAuthUserId(betterAuthUserId, customerId, 'active');
        }
        console.log('[stripe/webhook] checkout.session.completed:', {
          customerId,
          betterAuthUserId,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;

        if (customerId) {
          let status = 'active';
          if (subscription.status === 'past_due') status = 'past_due';
          else if (subscription.status === 'canceled') status = 'cancelled';
          else if (subscription.status === 'unpaid') status = 'expired';
          else if (subscription.status === 'active') status = 'active';

          await updateMemberByStripeCustomer(customerId, { membershipStatus: status });
          console.log('[stripe/webhook] subscription.updated:', { customerId, status });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;

        if (customerId) {
          await updateMemberByStripeCustomer(customerId, { membershipStatus: 'cancelled' });
          console.log('[stripe/webhook] subscription.deleted:', { customerId });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

        if (customerId) {
          await updateMemberByStripeCustomer(customerId, { membershipStatus: 'past_due' });
          console.log('[stripe/webhook] invoice.payment_failed:', { customerId });
        }
        break;
      }

      default:
        console.log('[stripe/webhook] Unhandled event type:', event.type);
    }
  } catch (err) {
    console.error('[stripe/webhook] Event handling error:', err);
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500,
      headers,
    });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers });
};
