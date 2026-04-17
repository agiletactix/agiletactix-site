# Better Auth Setup — AgileTactix Member-MCP

Better Auth handles authentication for the member portal. All config is via environment variables set in the Cloudflare Pages dashboard.

## Required Environment Variables

Set these in **Cloudflare Pages > Settings > Environment Variables** (both Production and Preview):

| Variable | Description | How to generate |
|----------|-------------|-----------------|
| `BETTER_AUTH_SECRET` | Random string for session signing | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Public URL of the site | `https://agiletactix.ai` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret | Same as above |
| `STRIPE_SECRET_KEY` | Stripe API secret key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe Dashboard > Webhooks > Signing secret |

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application type)
3. Add authorized redirect URI: `https://agiletactix.ai/api/auth/callback/google`
4. Copy Client ID and Client Secret to Cloudflare env vars

## Stripe Setup

1. Create products/prices in Stripe for each plan (free, lab)
2. Update price IDs in `src/lib/auth.ts` (the `plans` array)
3. Create a webhook endpoint: `https://agiletactix.ai/api/auth/stripe/webhook`
4. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Database Migration

Better Auth needs its own tables in D1. Run the migration:

```bash
npx wrangler d1 execute agiletactix-db --file=drizzle/migrations/0001_better_auth_tables.sql
```

This creates: `user`, `session`, `account`, `verification`, `subscription` tables and adds `better_auth_user_id` to the existing `members` table.

## Architecture Notes

- **D1 bindings are request-scoped**: The auth instance is created per-request via `createAuth()` in `src/lib/auth.ts`. There is no global singleton.
- **Option A separation**: Better Auth manages its own `user` table. The custom `members` table links via `better_auth_user_id` column. This keeps Better Auth's schema clean and avoids conflicts with Drizzle migrations.
- **Protected routes**: `/member/*`, `/dashboard/*`, `/lessons/*` are guarded by `src/middleware.ts`. Unauthenticated users are redirected to `/login`.
- **Public routes**: Everything else (/, /rovo/*, /api/assessment/*, /blog/*, etc.) passes through without auth checks.

## Local Development

Without Cloudflare bindings (plain `astro dev`), auth features are unavailable. The middleware will redirect protected routes to `/login`, and the auth API will return 503.

For full local auth testing, use `npx wrangler pages dev`:

```bash
npx wrangler pages dev -- astro dev
```

Set env vars in `.dev.vars` (gitignored):

```
BETTER_AUTH_SECRET=local-dev-secret-change-me
BETTER_AUTH_URL=http://localhost:4321
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
