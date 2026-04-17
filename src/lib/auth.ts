// Better Auth configuration for AgileTactix Member-MCP
// D1 bindings are request-scoped on Cloudflare Pages, so we create
// the auth instance per-request via createAuth().

import { betterAuth } from 'better-auth';
import { stripe } from '@better-auth/stripe';
import Stripe from 'stripe';

/**
 * Cloudflare runtime env bindings expected on every request.
 * Set via Cloudflare Pages dashboard -> Environment Variables.
 */
export interface AuthEnv {
  DB: import('@cloudflare/workers-types').D1Database;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRO_PRICE_ID?: string; // Stripe price ID for Pro ($47/mo)
  STRIPE_LAB_PRICE_ID?: string; // Stripe price ID for Lab ($2,500 one-time)
  BETTER_AUTH_URL?: string; // e.g. https://agiletactix.ai
}

/**
 * Create a Better Auth instance scoped to the current request's D1 binding.
 */
export function createAuth(env: AuthEnv) {
  const stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  });

  return betterAuth({
    database: {
      type: 'd1',
      d1: env.DB,
    },
    baseURL: env.BETTER_AUTH_URL || 'https://agiletactix.ai',
    secret: env.BETTER_AUTH_SECRET,

    emailAndPassword: {
      enabled: true,
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },

    plugins: [
      stripe({
        stripeClient: stripeInstance,
        stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
        subscription: {
          enabled: true,
          plans: [
            {
              name: 'free',
              priceId: 'price_free', // placeholder — free tier (no charge)
            },
            {
              name: 'pro',
              priceId: env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder', // $47/mo subscription
            },
            {
              name: 'lab',
              priceId: env.STRIPE_LAB_PRICE_ID || 'price_lab_placeholder', // $2,500 one-time Lab cohort
            },
          ],
        },
      }),
    ],
  });
}

/** Extract Cloudflare runtime env from Astro locals */
export function getEnvFromLocals(locals: Record<string, unknown>): AuthEnv | null {
  const runtime = locals.runtime as { env?: Partial<AuthEnv> } | undefined;
  const env = runtime?.env;
  if (!env?.DB || !env?.BETTER_AUTH_SECRET) return null;
  return env as AuthEnv;
}
