// Better Auth configuration for AgileTactix Member-MCP
// D1 bindings are request-scoped on Cloudflare Pages, so we create
// the auth instance per-request via createAuth().

import { betterAuth } from 'better-auth';
import { stripe } from '@better-auth/stripe';
import Stripe from 'stripe';
import { getDb, linkAuthUserToMember } from './db';

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
  VIDEO_BUCKET?: import('@cloudflare/workers-types').R2Bucket; // R2 bucket for video storage
  OPENAI_API_KEY?: string; // For Whisper transcription
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

    databaseHooks: {
      session: {
        create: {
          after: async (session) => {
            try {
              // Resolve user email from the session's userId via the Better Auth
              // user table. We pass the raw D1 binding through getDb() so we can
              // reuse our Drizzle helpers without a circular dependency.
              const db = getDb(env.DB);
              // session.userId is the Better Auth user.id
              // We need the email — fetch from Better Auth's own user table.
              const authUser = await env.DB.prepare(
                'SELECT email FROM user WHERE id = ?'
              ).bind(session.userId).first<{ email: string }>();

              if (authUser?.email) {
                await linkAuthUserToMember(db, authUser.email, session.userId);
              }
            } catch {
              // Never break login due to linking failure
            }
          },
        },
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
