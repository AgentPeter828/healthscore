# HealthScore — E2E Test Plan (Council + Peter Synthesis)

## Test Environment
- Dev server: `PORT=3064 npm run dev`
- Mock mode: `NEXT_PUBLIC_MOCK_DATA=true`
- Base URL: `http://localhost:3064`

## 1. Page Load Tests (all must return 200 with text/html)

```
/ (homepage)
/pricing
/features
/demo (new — gap fix)
/alternative-to-gainsight
/alternative-to-churnzero
/alternative-to-custify
/login
/signup
/dashboard
/dashboard/health-scores
/dashboard/accounts
/dashboard/playbooks
/dashboard/alerts
/dashboard/integrations
/dashboard/settings
/dashboard/settings/billing (new — gap fix)
/dashboard/settings/test (new — gap fix)
/dashboard/onboarding
```

For each: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3064/[path]`
- PASS: 200
- FAIL: 404, 500, or error in server logs

Also test: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3064/nonexistent-page` → must be 404 (not 500)

## 2. API Route Tests

### GET/POST /api/accounts
```bash
# GET — list accounts
curl -s http://localhost:3064/api/accounts
```
- PASS: 200, array of account objects with `id`, `name`, `healthScore`, `status`
- Test POST with valid account → 200/201
- Test POST with missing required fields → 400

### POST /api/ai/predict-churn
```bash
curl -s -X POST http://localhost:3064/api/ai/predict-churn \
  -H "Content-Type: application/json" \
  -d '{"accountId":"mock_account_1"}'
```
- PASS: 200, response has `probability` (0-1), `risk_level` (high/medium/low), `factors` (array), `recommendation`
- Test non-existent account → must be 404
- Test missing accountId → must be 400
- Test account with perfect health score → should return low risk

### GET/POST /api/playbooks
```bash
curl -s http://localhost:3064/api/playbooks
```
- PASS: 200, array of playbook objects with `id`, `name`, `trigger`, `actions`, `status`
- Test POST new playbook → 200/201
- Test POST with invalid trigger condition → 400

### GET/POST /api/alerts
```bash
curl -s http://localhost:3064/api/alerts
```
- PASS: 200, array of alert objects
- Test POST acknowledge alert → 200

### GET/POST /api/integrations
```bash
curl -s http://localhost:3064/api/integrations
```
- PASS: 200, array of integration configs
- Test POST new integration → 200/201

### POST /api/webhooks/[integrationId]
```bash
curl -s -X POST http://localhost:3064/api/webhooks/mock_integration_1 \
  -H "Content-Type: application/json" \
  -d '{"event":"customer.updated","data":{"id":"cust_123","mrr":500}}'
```
- PASS: 200
- Test invalid integrationId → 404
- Test malformed JSON → 400

### GET/POST /api/notes
```bash
curl -s http://localhost:3064/api/notes?accountId=mock_account_1
```
- PASS: 200, array of notes

### GET/POST /api/renewals
```bash
curl -s http://localhost:3064/api/renewals
```
- PASS: 200, array of renewal records with `accountId`, `renewalDate`, `status`

### POST /api/formula
```bash
curl -s -X POST http://localhost:3064/api/formula \
  -H "Content-Type: application/json" \
  -d '{"formula":"(login_frequency * 0.4) + (feature_adoption * 0.3) + (nps_score * 0.3)","testAccountId":"mock_account_1"}'
```
- PASS: 200, computed score
- Test invalid formula syntax → 400 (not 500)
- Test division by zero → handled gracefully

### POST /api/export
```bash
curl -s -X POST http://localhost:3064/api/export \
  -H "Content-Type: application/json" \
  -d '{"format":"csv","filters":{"status":"at_risk"}}'
```
- PASS: 200, CSV content
- Test invalid format → 400

### POST /api/billing/checkout
```bash
curl -s -X POST http://localhost:3064/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{"planId":"growth"}'
```
- PASS: 200 with checkout URL (mock)
- Test invalid planId → 400

### POST /api/billing/portal
```bash
curl -s -X POST http://localhost:3064/api/billing/portal
```
- PASS: 200 with portal URL (mock)

### POST /api/billing/webhook
```bash
curl -s -X POST http://localhost:3064/api/billing/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: invalid_sig" \
  -d '{"type":"checkout.session.completed"}'
```
- Test invalid signature → reject
- Test valid mock event → process

### GET /api/settings/audit-log
```bash
curl -s http://localhost:3064/api/settings/audit-log
```
- PASS: 200, array of audit events with `action`, `timestamp`, `userId`

### POST /api/account/delete
```bash
curl -s -X POST http://localhost:3064/api/account/delete \
  -H "Content-Type: application/json" \
  -d '{"confirmation":"DELETE MY ACCOUNT"}'
```
- PASS: 200 (soft delete, 30-day retention)
- Test without confirmation string → 400
- Test wrong confirmation → 400

## 3. Edge Cases

### HS-EDGE-001: Health Score Boundaries
- Test account with score exactly 0 → renders correctly
- Test account with score exactly 100 → renders correctly
- Test account with score -1 or 101 → handled (clamped or rejected)

### HS-EDGE-002: Churn Prediction on New Account (No Data)
```bash
curl -s -X POST http://localhost:3064/api/ai/predict-churn \
  -H "Content-Type: application/json" \
  -d '{"accountId":"brand_new_account_no_history"}'
```
- Must not crash. Should return "insufficient data" or low-confidence prediction

### HS-EDGE-003: Playbook Trigger with No Matching Accounts
- Create playbook with trigger "score < 10" when no accounts have score < 10
- Should succeed but execute 0 actions

### HS-EDGE-004: Special Characters in Account Names
```bash
curl -s -X POST http://localhost:3064/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp <script>alert(1)</script>","domain":"acme.com"}'
```
- PASS: 200, name sanitized or stored safely (no XSS)

### HS-EDGE-005: Formula with Invalid Variables
```bash
curl -s -X POST http://localhost:3064/api/formula \
  -H "Content-Type: application/json" \
  -d '{"formula":"nonexistent_variable * 0.5","testAccountId":"mock_account_1"}'
```
- Must be 400 with clear error about unknown variable (not 500)

### HS-EDGE-006: Plan Limit — Free Plan Churn Prediction
- Free plan should NOT have access to AI predictions
- Verify `/api/ai/predict-churn` returns 403 for free plan users

### HS-EDGE-007: Concurrent Account Updates
- Fire 10 simultaneous POST requests updating the same account
- No race conditions, last write wins or proper conflict handling

### HS-EDGE-008: GDPR Account Deletion Cascade
- After `/api/account/delete`, verify related data (notes, alerts, playbook history) is also soft-deleted

## 4. Data Integrity

### HS-DATA-001: Mock Data Consistency
- Every account has valid `id`, `name`, `healthScore` (0-100), `status`
- Every playbook references valid trigger conditions
- Every alert references a valid account
- Every renewal has a valid future date
- No duplicate IDs

### HS-DATA-002: Health Score Calculation
- Verify mock health scores are within 0-100 range
- Verify color coding: green (70-100), amber (40-69), red (0-39) — matches UI thresholds

## 5. Build & Type Safety

### HS-BUILD-001: TypeScript Check
```bash
npx tsc --noEmit
```
- PASS: exit code 0

### HS-BUILD-002: Production Build
```bash
npm run build
```
- PASS: exit code 0, all routes in output

## 6. Security (Mock Mode)

### HS-SEC-001: No Secrets in Client Bundle
```bash
grep -r "sk_test\|sk_live\|SUPABASE_SERVICE_ROLE\|OPENAI_API_KEY" .next/static/ 2>/dev/null
```
- PASS: no matches

### HS-SEC-002: Webhook Signature Validation Code Exists
```bash
grep -r "stripe-signature\|verifySignature\|constructEvent" src/app/api/billing/
```
- PASS: exists

### HS-SEC-003: GDPR Soft Delete Honors 30-Day Retention
- Verify account delete doesn't hard-delete immediately
- Check for retention period logic in code

## Report Format

Create `/tmp/healthscore_test_report.md` with same format as BidFlow report.
