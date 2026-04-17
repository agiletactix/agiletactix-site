# Assessment Worker — Deploy Guide

## Prerequisites

- Node.js 18+
- Wrangler CLI: `npm install -g wrangler` (or use npx from this directory)
- Cloudflare account with Workers enabled

## Local Development

```bash
cd workers/assessment
npm install

# Start local dev server (reads .dev.vars for secrets, TEST_MODE=true)
npx wrangler dev

# In another terminal, run tests
bash test.sh
```

## Deploy to Production

### 1. Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser for OAuth. You only need to do this once per machine.

### 2. Set secrets

```bash
# Paste the Kit API key when prompted (value from ~/.kit-api-key)
wrangler secret put KIT_API_KEY
```

### 3. Deploy

```bash
npm run deploy
# or: npx wrangler deploy
```

This deploys to `agiletactix-assessment.<your-subdomain>.workers.dev`.

### 4. Configure custom domain

To serve the Worker at `api.agiletactix.ai`:

1. Go to Cloudflare Dashboard > Workers & Pages > agiletactix-assessment
2. Settings > Triggers > Custom Domains
3. Add: `api.agiletactix.ai`

Alternatively, if agiletactix.ai DNS is on Cloudflare:

1. Add a CNAME record: `api` -> `agiletactix-assessment.<subdomain>.workers.dev` (proxied)
2. Or use Workers Routes under the agiletactix.ai zone

### 5. Verify

```bash
curl -X POST https://api.agiletactix.ai/assessment/score \
  -H "Content-Type: application/json" \
  -H "Origin: https://agiletactix.ai" \
  -d '{
    "email": "danny@agiletactix.com",
    "first_name": "Danny",
    "role": "practitioner",
    "deployment": "cloud",
    "answers": {"q1":4,"q2":3,"q3":3,"q4":2,"q5":3,"q6":1,"q7":2,"q8":2,"q9":3,"q10":3},
    "consent_marketing": false
  }'
```

## Environment Variables

| Variable | Set via | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | wrangler.toml `[vars]` | "production" |
| `TEST_MODE` | wrangler.toml `[vars]` | "false" in prod, "true" in .dev.vars |
| `KIT_API_KEY` | `wrangler secret put` | Kit v4 API key (starts with `kit_`) |

## Updating

After code changes:

```bash
npx wrangler deploy
```

No downtime — Cloudflare does zero-downtime deploys for Workers.
