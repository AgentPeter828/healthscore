# HealthScore — Production Integration Spec

Replace ALL mock/TODO stubs with real implementations. When this is done, the only thing needed is env vars.

## 1. Real Supabase Queries

Replace all mock client usage with real Supabase queries in every API route:

### Pattern for every route:
```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  // createClient() already handles mock vs real — just use the real query patterns
  const { data, error } = await supabase.from('hs_accounts').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

The mock client already implements the Supabase query builder pattern, so most routes should work with both mock and real. But verify:

### Routes to audit and fix:
- `src/app/api/accounts/route.ts` — ensure real CRUD works with hs_accounts
- `src/app/api/ai/predict-churn/route.ts` — ensure real query for account data
- `src/app/api/playbooks/route.ts` — ensure real CRUD with hs_playbooks  
- `src/app/api/alerts/route.ts` — ensure real CRUD with hs_alerts
- `src/app/api/integrations/route.ts` — ensure real CRUD with hs_integrations
- `src/app/api/notes/route.ts` — ensure real CRUD with hs_notes
- `src/app/api/renewals/route.ts` — ensure real query with hs_renewals
- `src/app/api/formula/route.ts` — ensure real formula save/load
- `src/app/api/export/route.ts` — ensure real data export
- `src/app/api/settings/audit-log/route.ts` — ensure real audit log query
- `src/app/api/account/delete/route.ts` — ensure real soft delete

### Plan gate real mode:
- `src/lib/plan-gate.ts` — in real mode, query hs_subscriptions for plan tier
- Currently uses `checkFeatureAccess(plan, feature)` which works if plan is passed correctly
- Need to add: `getCurrentPlan(orgId)` function that queries real subscription data

## 2. Real Stripe Integration

### `src/app/api/billing/webhook/route.ts`
- Verify Stripe signature with real `stripe.webhooks.constructEvent()`
- Handle: checkout.session.completed → create hs_subscriptions record
- Handle: customer.subscription.updated → update plan tier
- Handle: customer.subscription.deleted → downgrade to free
- Handle: invoice.payment_failed → set past_due status
- Handle: invoice.paid → clear past_due

### `src/app/api/billing/checkout/route.ts`
- In real mode: create real Stripe Checkout Session with correct price ID
- Map plan names to Stripe price IDs via env vars: STRIPE_PRICE_STARTER, STRIPE_PRICE_GROWTH, STRIPE_PRICE_SCALE

### `src/app/api/billing/portal/route.ts`
- In real mode: create real Stripe Customer Portal session

### `src/app/api/billing/change-plan/route.ts`
- Use Stripe SDK to update subscription
- Handle proration
- Log to audit trail

## 3. Real AI Churn Prediction

### `src/lib/ai/churn-predictor.ts` (NEW)
- Function: `predictChurn(accountData)`:
  1. Gather account metrics: health score, login frequency, feature adoption, support tickets, MRR trend, days since last activity
  2. Build prompt for Claude/GPT: "Analyze this customer's data and predict churn probability. Explain the key risk factors."
  3. Parse response: extract probability (0-1), risk_level (high/medium/low), factors array, recommendation
  4. Return structured prediction

### `src/app/api/ai/predict-churn/route.ts`
- Replace mock prediction with real AI call
- Fetch real account data from hs_accounts + hs_health_scores
- Call churn predictor
- Return: `{ probability, risk_level, risk_label, factors, recommendation }`
- Gate behind plan check (free plan = 403)

## 4. Real Custom Formula Evaluation

### `src/lib/formula/evaluator.ts` (NEW)
- Parse formula components (metric, weight pairs)
- Fetch real metric values for an account from hs_health_scores
- Available metrics: login_frequency, feature_adoption, nps_score, support_tickets, mrr, days_since_last_activity, contract_value
- Calculate weighted score (0-100)
- Return: `{ score, breakdown: [{ metric, value, weight, contribution }] }`

### `src/app/api/formula/route.ts`
- POST: Save formula to hs_formulas table
- GET: Fetch saved formulas
- POST with testAccountId: Evaluate formula against real account data

## 5. Real Export

### `src/app/api/export/route.ts`
Install `xlsx` (SheetJS) and implement:
- CSV export: Query real account data, format as CSV with headers
- XLSX export: Create workbook with Account Name, Health Score, Status, MRR, Last Activity, Renewal Date
- Apply filters from request (status, score range, date range)
- Stream file with correct headers

## 6. Email Integration

### `src/lib/email/resend.ts` (NEW)
- Initialize Resend from RESEND_API_KEY
- Templates: `sendAlertEmail()`, `sendPlaybookNotification()`, `sendChurnWarningEmail()`, `sendWelcomeEmail()`, `sendUsageWarningEmail()`
- HTML email templates

### Wire into:
- Alerts → email notification to assigned CSM
- Playbook triggers → email notification
- Churn prediction high risk → email to CSM
- Signup → welcome email
- Usage at 80% of plan limit → warning email

## 7. Production Rate Limiting

### `src/lib/rate-limit.ts` (NEW)
- Use `@upstash/ratelimit` + `@upstash/redis`
- AI prediction = 10 requests/minute per org
- General API = 100 requests/minute per org
- Falls back to in-memory if Upstash not configured

## 8. Error Monitoring

### Sentry integration
- Install `@sentry/nextjs`
- Create config files
- Wrap API routes
- Works when SENTRY_DSN env var is set

## 9. Webhook Signature Verification for Integrations

### `src/app/api/webhooks/[integrationId]/route.ts`
- Currently validates against mock secrets
- Add real HMAC signature verification
- Each integration stores its webhook_secret in hs_integrations
- Verify: `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')` matches header

## Build Rules
- Light/white mode only
- 0 TypeScript errors
- Mock mode MUST still work
- Every real integration must gracefully handle missing env vars
- Install all new dependencies via npm
- Test that `npm run build` succeeds
