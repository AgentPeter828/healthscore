# HealthScore — Post-Build Gap Fixes

Based on Build Lessons from RecoverKit (see second-brain/core/BuildLessonsRecoverKit.md). HealthScore already has onboarding and partial billing — filling remaining gaps.

## 1. Interactive Demo Page (MISSING)

### Build: `src/app/(marketing)/demo/page.tsx`
- Full interactive demo showing HealthScore in action with a fake company
- Example company: "PulseMetrics" (B2B SaaS, 200 customers, 15% churn rate before HealthScore)
- Demo walkthrough steps:
  1. "PulseMetrics connects their CRM and billing data" (show integration setup)
  2. "HealthScore calculates a real-time health score for every customer" (show dashboard with scores: green/amber/red)
  3. "AI predicts which 12 customers are at risk of churning this month" (show churn prediction list)
  4. "Automated playbooks trigger — at-risk customers get check-in emails, CSMs get alerts" (show playbook execution)
  5. "After 3 months, PulseMetrics reduces churn from 15% to 8%" (show before/after metrics)
- Industry switcher: SaaS (default), eCommerce, Agency
- CTA: "Start Free — Up to 100 Customers"

### Nav Update
- Add "Demo" link in marketing header, prominent (before Pricing)
- Only visible for non-authenticated users

## 2. Feature Gating / Plan Limits (PARTIAL — needs enforcement)

### a) Plan Gate Utility (`src/lib/plan-gate.ts`)
- Function: `checkPlanAccess(orgId, feature)` → { allowed, limit, usage, plan }
- HealthScore tiers:
  - Free ($0): 100 customers, 1 user, basic health scores, no AI predictions, no playbooks, no integrations
  - Starter ($49/mo): 500 customers, 3 users, AI predictions, basic playbooks, 2 integrations
  - Growth ($99/mo): 2,000 customers, 10 users, advanced playbooks, unlimited integrations, custom formulas
  - Scale ($199/mo): 10,000 customers, unlimited users, white-label, API access, dedicated support
- In mock mode: always return Growth plan

### b) Usage Tracking (`src/lib/services/usage-tracker.ts`)
- Track customers monitored per org
- Track users per org
- Track integrations connected

### c) Usage Banner Component (`src/components/dashboard/usage-banner.tsx`)
- "Customers: 847 / 2,000" with progress bar
- Green (<70%), amber (70-90%), red (>90%)
- "Upgrade" CTA when approaching limit

### d) API Route Protection
- All API routes must check plan limits before processing
- `/api/ai/predict-churn`: check if plan includes AI predictions
- `/api/playbooks`: check playbook limit per plan
- `/api/integrations`: check integration count limit
- Return 403 with clear error message and upgrade link

## 3. Subscription Management (PARTIAL — needs upgrade/downgrade)

### a) Plan Change API (`src/app/api/billing/change-plan/route.ts`)
- POST: accepts `{ newPlanId }` → Stripe subscription update
- Handle proration
- Update local subscription data
- Audit log: plan_upgraded / plan_downgraded

### b) Billing Page Enhancement (`src/app/(dashboard)/dashboard/settings/billing/page.tsx`)
- Current plan display with usage stats
- Plan comparison cards with upgrade/downgrade buttons
- Payment method display + update button (Stripe SetupIntent)
- Billing history / invoices
- Cancel subscription with confirmation
- In mock mode: show mock billing data

## 4. Testing & Environment (MISSING)

### a) Environment Files
- Create `.env.mock` (NEXT_PUBLIC_MOCK_DATA=true, all other keys empty)
- Create `.env.test` (mock data off, test keys)

### b) Test Simulator (`src/app/(dashboard)/dashboard/settings/test/page.tsx`)
- "Simulate New Customer" — creates a mock customer with random health score
- "Simulate Churn Risk" — flags a customer as at-risk, triggers playbook
- "Simulate Integration Webhook" — sends a test webhook event
- Pass/fail status display

### c) Environment Switch Script (`scripts/env-switch.sh`)

## 5. Marketing Polish

### a) Currency Labels
- All pricing: show "USD" explicitly
- Comparison pages: include currency on competitor prices
- Footer note: "All prices in USD"

### b) Visual Pricing Comparison Chart (`src/components/marketing/pricing-comparison-chart.tsx`)
- Bar chart showing HealthScore vs Gainsight vs ChurnZero vs Custify
- HealthScore bar tiny ($49-$199), competitors massive ($2,500+)

### c) Auth-Aware Navigation
- Marketing header: "Sign In" / "Get Started" for non-auth, user avatar + "Dashboard" for auth
- Demo link visible for non-auth only

### d) Cursor-Pointer Audit
- Add cursor-pointer to ALL clickable elements throughout the app

## 6. AI Presets (MISSING — applicable to churn prediction)

### a) Health Score Formula Presets
- Pre-built formulas for common scoring models:
  - "Usage-Based" — weight login frequency, feature adoption, time in app
  - "Engagement-Based" — weight support tickets, NPS responses, feature requests
  - "Revenue-Based" — weight MRR, expansion, contraction, payment failures
  - "Balanced" — equal weight across all signals
- One-click apply from formula builder

### b) Playbook Templates
- Pre-built playbook templates:
  - "At-Risk Recovery" — trigger when score drops below 40, send check-in email, assign CSM
  - "Expansion Ready" — trigger when score above 80 + usage growing, send upsell nudge
  - "Onboarding Follow-Up" — trigger 7 days after signup if score below 60
  - "Renewal Prep" — trigger 30 days before renewal date
- One-click install templates

### c) AI Churn Prediction Presets
- When showing AI predictions, include preset action recommendations:
  - High risk (>80% churn probability): "Schedule urgent call within 48 hours"
  - Medium risk (40-80%): "Send personalized check-in email"
  - Low risk (<40%): "Monitor — no action needed"

## Build Rules
- Light/white mode only (already done)
- 0 TypeScript errors
- Mock mode must work for ALL new features
- Every new component needs cursor-pointer on interactive elements
- All prices show "USD" currency label
- Don't break existing features — read existing code first
