# Stripe Setup -- AgileTactix Member-MCP

Stripe handles payments for Pro subscriptions and Lab cohort purchases.

## 1. Create Stripe Account

Sign up or log in at [dashboard.stripe.com](https://dashboard.stripe.com).

Use **Test mode** during development (toggle in top-right of Stripe dashboard).

## 2. Create Products + Prices

In Stripe Dashboard > Products, create two products:

### AgileTactix Pro

- **Type**: Recurring
- **Price**: $47/month
- **Name**: AgileTactix Pro
- Copy the `price_xxx` ID for `STRIPE_PRO_PRICE_ID`

### AgileTactix Lab

- **Type**: One-time
- **Price**: $2,500
- **Name**: AgileTactix Lab Cohort
- Copy the `price_xxx` ID for `STRIPE_LAB_PRICE_ID`

## 3. Set Up Webhook Endpoint

In Stripe Dashboard > Developers > Webhooks:

1. Click **Add endpoint**
2. Endpoint URL: `https://agiletactix.ai/api/stripe/webhook`
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Click **Add endpoint**
5. Copy the **Signing secret** (`whsec_...`) for `STRIPE_WEBHOOK_SECRET`

## 4. Environment Variables

Set in **Cloudflare Pages > Settings > Environment Variables** (both Production and Preview):

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |
| `STRIPE_PRO_PRICE_ID` | Price ID for Pro plan | `price_1Abc...` |
| `STRIPE_LAB_PRICE_ID` | Price ID for Lab cohort | `price_1Xyz...` |

For local development, add to `.dev.vars`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_LAB_PRICE_ID=price_...
```

## 5. Configure Billing Portal

In Stripe Dashboard > Settings > Billing > Customer portal:

1. Enable the customer portal
2. Configure which features customers can access:
   - Cancel subscription: Yes
   - Update payment method: Yes
   - View invoices: Yes
3. Set return URL: `https://agiletactix.ai/member/dashboard`

## 6. Local Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:4321/api/stripe/webhook

# Copy the webhook signing secret printed by the CLI into .dev.vars
```

Then in a separate terminal:
```bash
npx wrangler pages dev -- astro dev
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/stripe/checkout` | POST | Required | Creates Stripe Checkout Session |
| `/api/stripe/portal` | POST | Required | Creates Stripe Billing Portal Session |
| `/api/stripe/webhook` | POST | None (signature verified) | Handles Stripe webhook events |

## Architecture Notes

- **Checkout flow**: Frontend POST to `/api/stripe/checkout` with `{ priceType: "pro" | "lab" }` -> returns `{ url }` -> redirect to Stripe hosted checkout -> Stripe redirects back to `/member/dashboard?upgraded=true`
- **Portal flow**: Frontend POST to `/api/stripe/portal` -> returns `{ url }` -> redirect to Stripe billing portal -> customer returns to `/member/dashboard`
- **Webhook flow**: Stripe POSTs events to `/api/stripe/webhook` -> verified via signature -> updates `members` table in D1
- **Middleware**: `/api/stripe/webhook` is explicitly excluded from auth checks (verified by Stripe signature instead)
- The `members.stripe_customer_id` column links the D1 member record to the Stripe customer
- The `members.membership_status` column tracks: `free`, `active`, `past_due`, `cancelled`, `expired`
