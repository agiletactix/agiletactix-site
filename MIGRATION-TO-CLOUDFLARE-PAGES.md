# Migration: GitHub Pages to Cloudflare Pages

This document covers the manual steps needed in the Cloudflare dashboard to complete the migration. All code changes are already in place on the `feature/rovo-readiness-assessment` branch.

## What changed in code

- Astro config: `output: 'hybrid'` + `@astrojs/cloudflare` adapter
- Assessment scoring API: moved from separate Cloudflare Worker (`workers/assessment/`) to Astro API route (`src/pages/api/assessment/score.ts`)
- Kit API client: `src/lib/rovo/kit.ts` (ported from Worker, used by API route)
- QuizForm: now posts to `/api/assessment/score` (same-origin, no CORS)
- GitHub Pages deploy workflow: disabled (`.yml.bak`)
- CI workflow: `astro check` still runs on push

## Cloudflare dashboard steps

### 1. Create Cloudflare Pages project

1. Log in to [Cloudflare dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** > **Pages** > **Create a project** > **Connect to Git**
3. Select the `agiletactix/agiletactix-site` repository
4. Configure build settings:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: 22 (set `NODE_VERSION=22` in environment variables)

### 2. Set environment variables

In **Settings** > **Environment variables**, add:

| Variable | Production value | Preview value |
|----------|-----------------|---------------|
| `KIT_API_KEY` | `<value from ~/.kit-api-key>` | `<same>` |
| `TEST_MODE` | `false` | `true` |
| `NODE_VERSION` | `22` | `22` |

### 3. Custom domain

1. Go to **Custom domains** tab on the Pages project
2. Add `agiletactix.ai`
3. If `agiletactix.ai` is already on Cloudflare DNS: Pages handles the DNS record automatically
4. If not on Cloudflare DNS yet: add a CNAME record pointing `agiletactix.ai` to `agiletactix-site.pages.dev`

### 4. Disable GitHub Pages

1. Go to the GitHub repo **Settings** > **Pages**
2. Set **Source** to **None** (or **GitHub Actions** with no workflow)
3. Remove the A records pointing to GitHub Pages IPs (185.199.x.153) from DNS
4. The `public/CNAME` file is no longer needed for Cloudflare Pages but won't cause issues if left

### 5. Disable the separate Worker

The Worker at `api.agiletactix.ai` is no longer needed:
1. In Cloudflare dashboard > **Workers & Pages**, find the assessment Worker
2. Delete or disable it
3. Remove the `api.agiletactix.ai` DNS record (or leave it — traffic will 404 harmlessly)

### 6. Verify

1. Visit `https://agiletactix.ai` — site loads
2. Navigate to the Rovo assessment page
3. Complete the quiz, submit email
4. Verify scoring works (check browser DevTools Network tab for `/api/assessment/score` 200 response)
5. Verify Kit subscriber is created (check Kit dashboard) if `TEST_MODE=false`

## Rollback

If something goes wrong:
1. Re-enable the GitHub Pages workflow: rename `.github/workflows/deploy-github-pages.yml.bak` back to `deploy.yml`
2. Revert `astro.config.mjs` to `output: 'static'` and remove the cloudflare adapter
3. Revert QuizForm API URL to `https://api.agiletactix.ai/assessment/score`
4. Re-enable the Worker deployment
5. Restore GitHub Pages DNS (A records to 185.199.x.153)
