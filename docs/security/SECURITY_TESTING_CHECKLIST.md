# Security Testing Checklist - VoiceTracker V2

## 🎯 Overview

This checklist provides a comprehensive security validation procedure for VoiceTracker V2 after implementing Phase 1 (Critical Fixes) and Phase 2 (Production Hardening).

**Estimated Time:** 3-4 hours
**Environment:** Development/Staging
**Status:** Ready for Execution

---

## ✅ Pre-Flight Checks

### Database Security

- [ ] **RLS Policies Applied**
  ```sql
  -- Execute in Supabase SQL Editor
  SELECT tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename;
  ```
  - Expected: 25+ policies across tables: `transactions`, `debts`, `credits`, `budget_recurring_charges`, `budgets`, `recurring_charges`, `ceiling_rules`, `account_balances`, `audit_logs`

- [ ] **Audit Logs Table Created**
  ```sql
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
  );
  ```
  - Expected: `true`

- [ ] **Service Role Key Secured**
  - [ ] Located in `.env.local` (not `.env`)
  - [ ] `.env.local` in `.gitignore`
  - [ ] Never committed to git

### Application Build

- [ ] **Build Succeeds**
  ```bash
  npm run build
  ```
  - Expected: No errors

- [ ] **Development Server Starts**
  ```bash
  npm run dev
  ```
  - Expected: Server running on port 3000

---

## 🔐 Phase 1: Critical Security Tests

### Test 1.1: Row Level Security (RLS) - Transactions

**Objective:** Verify users can only access their own transactions

**Steps:**
1. Create User A and User B in Supabase Auth
2. User A creates a transaction via API
3. User B attempts to read User A's transaction

**Commands:**
```bash
# User A creates transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Cookie: <USER_A_SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-15",
    "label": "Test Transaction A",
    "amount": 100,
    "category": "food",
    "account": "SG"
  }'

# Note the transaction ID: TX_ID

# User B attempts to access (should fail)
curl http://localhost:3000/api/transactions?month=2025-12 \
  -H "Cookie: <USER_B_SESSION>"
```

**Expected Result:**
- ✅ User B sees ONLY their own transactions (empty list if none created)
- ✅ User A's transaction NOT visible to User B

**If Failed:** RLS not active. Execute `docs/security/rls-transactions.sql`

---

### Test 1.2: RLS - Debts

**Steps:**
```bash
# User A creates debt
curl -X POST http://localhost:3000/api/debts \
  -H "Cookie: <USER_A_SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Test Debt A",
    "amount": 5000,
    "start_month": "2025-01",
    "end_month": "2025-12",
    "monthly_payment": 500
  }'

# User B attempts to access all debts
curl http://localhost:3000/api/debts \
  -H "Cookie: <USER_B_SESSION>"
```

**Expected Result:**
- ✅ User B sees 0 debts (or only their own)

---

### Test 1.3: RLS - Budget-Recurring Charge Links

**Steps:**
```bash
# User A creates budget and recurring charge, then links them
# User B attempts to access /api/budgets/<USER_A_BUDGET_ID>/charges

curl http://localhost:3000/api/budgets/<USER_A_BUDGET_ID>/charges \
  -H "Cookie: <USER_B_SESSION>"
```

**Expected Result:**
- ✅ `404 Not Found` or `403 Forbidden`
- ✅ User B CANNOT access User A's budget charges

---

### Test 1.4: Authorization Bypass Fix

**Objective:** Verify the fix in [/api/budgets/[id]/charges/route.ts](app/api/budgets/[id]/charges/route.ts)

**Steps:**
```bash
# User A creates budget
curl -X POST http://localhost:3000/api/budgets/manage \
  -H "Cookie: <USER_A_SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Food Budget A",
    "type": "CATEGORY",
    "category": "food",
    "amount": 500,
    "period": "monthly"
  }'
# Note budget ID: BUDGET_ID_A

# User B attempts to read charges for User A's budget
curl http://localhost:3000/api/budgets/BUDGET_ID_A/charges \
  -H "Cookie: <USER_B_SESSION>"
```

**Expected Result:**
- ✅ `404 Not Found` with message: "Budget non trouvé ou accès non autorisé"

**Code Reference:** [app/api/budgets/[id]/charges/route.ts:24-34](app/api/budgets/[id]/charges/route.ts#L24-L34)

---

## 🛡️ Phase 2: Production Hardening Tests

### Test 2.1: Security Headers

**Objective:** Verify all security headers are present

**Commands:**
```bash
# Test homepage
curl -I http://localhost:3000/

# Test API endpoint
curl -I http://localhost:3000/api/transactions?month=2025-12 \
  -H "Cookie: <SESSION>"
```

**Expected Headers:**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; ...
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()

# API routes only:
Cache-Control: no-store, no-cache, must-revalidate, private
Pragma: no-cache
Expires: 0

# Production only:
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Verification:**
- [ ] All headers present on homepage
- [ ] Cache-Control headers present on API routes
- [ ] CSP includes Supabase domain

**Code Reference:** [proxy.ts:8-53](proxy.ts#L8-L53)

---

### Test 2.2: Rate Limiting - Projection Endpoint

**Objective:** Verify rate limiting works (20 req/min limit)

**Commands:**
```bash
# Send 25 rapid requests
for i in {1..25}; do
  echo "Request $i"
  curl -w "\nStatus: %{http_code}\n" \
    http://localhost:3000/api/engine/projection?account=SG&month=2025-01&months=12 \
    -H "Cookie: <SESSION>"
  sleep 1
done
```

**Expected Result:**
- ✅ Requests 1-20: `200 OK`
- ✅ Requests 21+: `429 Too Many Requests`

**Response Body (429):**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many projection requests. Please try again in X seconds.",
  "limit": 20,
  "retryAfter": X
}
```

**Headers:**
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: <timestamp>
Retry-After: <seconds>
```

**Code Reference:** [app/api/engine/projection/route.ts:40-73](app/api/engine/projection/route.ts#L40-L73)

---

### Test 2.3: Rate Limiting - Transaction Write

**Objective:** Verify write rate limiting (50 req/min)

**Commands:**
```bash
# Send 55 rapid POST requests
for i in {1..55}; do
  echo "Request $i"
  curl -X POST -w "\nStatus: %{http_code}\n" \
    http://localhost:3000/api/transactions \
    -H "Cookie: <SESSION>" \
    -H "Content-Type: application/json" \
    -d "{
      \"date\": \"2025-12-15\",
      \"label\": \"Test Transaction $i\",
      \"amount\": 10,
      \"category\": \"food\",
      \"account\": \"SG\"
    }"
  sleep 0.5
done
```

**Expected Result:**
- ✅ Requests 1-50: `201 Created`
- ✅ Requests 51+: `429 Too Many Requests`

**Code Reference:** [app/api/transactions/route.ts:89-101](app/api/transactions/route.ts#L89-L101)

---

### Test 2.4: Audit Logging - Transaction Create

**Objective:** Verify audit logs are created for transaction creation

**Steps:**
1. Create a transaction via API
2. Check `audit_logs` table in Supabase

**Commands:**
```bash
# Create transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Cookie: <SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-15",
    "label": "Audit Test Transaction",
    "amount": 99.99,
    "category": "food",
    "account": "SG"
  }'
```

**Verification in Supabase:**
```sql
SELECT
  action,
  resource_type,
  resource_id,
  details,
  ip_address,
  user_agent,
  status,
  created_at
FROM audit_logs
WHERE action = 'transaction.create'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result:**
- ✅ New row with:
  - `action`: `transaction.create`
  - `resource_type`: `transaction`
  - `resource_id`: The transaction UUID
  - `details`: `{"amount": 99.99, "category": "food", "account": "SG", "type": "EXPENSE", "label": "Audit Test Transaction"}`
  - `ip_address`: Client IP
  - `user_agent`: Client user agent
  - `status`: `success`

**Code Reference:** [app/api/transactions/route.ts:163-171](app/api/transactions/route.ts#L163-L171)

---

### Test 2.5: Audit Logging - Non-Blocking

**Objective:** Verify audit logging failures don't break requests

**Steps:**
1. Temporarily break audit logging (e.g., drop `audit_logs` table)
2. Create a transaction
3. Verify transaction is created successfully
4. Restore `audit_logs` table

**Commands:**
```bash
# In Supabase SQL Editor (TEST ENVIRONMENT ONLY)
DROP TABLE IF EXISTS audit_logs CASCADE;

# Create transaction (should succeed despite audit failure)
curl -X POST http://localhost:3000/api/transactions \
  -H "Cookie: <SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-15",
    "label": "Non-Blocking Test",
    "amount": 50,
    "category": "food",
    "account": "SG"
  }'

# Restore audit_logs table
# Execute: docs/security/audit-logs-schema.sql
```

**Expected Result:**
- ✅ Transaction created successfully (`201 Created`)
- ✅ Server logs show `[AUDIT_LOG] Failed:` error
- ✅ Application does NOT crash or return 500

**Design Pattern:** Fail-safe `.catch()` handler ensures non-blocking operation

---

## 🔍 Penetration Testing

### Test 3.1: SQL Injection

**Objective:** Verify Supabase SDK protects against SQL injection

**Commands:**
```bash
# Attempt SQL injection in query parameter
curl "http://localhost:3000/api/transactions?month=' OR '1'='1" \
  -H "Cookie: <SESSION>"

# Attempt in POST body
curl -X POST http://localhost:3000/api/transactions \
  -H "Cookie: <SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-15",
    "label": "Test'\'' OR '\''1'\''='\''1",
    "amount": 100,
    "category": "food'\'' OR '\''1'\''='\''1",
    "account": "SG"
  }'
```

**Expected Result:**
- ✅ No SQL injection occurs
- ✅ String values are properly escaped and treated as literals

**Protection:** Supabase SDK uses parameterized queries

---

### Test 3.2: Cross-Site Scripting (XSS)

**Objective:** Verify inputs are properly escaped

**Commands:**
```bash
# Attempt XSS in transaction label
curl -X POST http://localhost:3000/api/transactions \
  -H "Cookie: <SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-15",
    "label": "<script>alert(\"XSS\")</script>",
    "amount": 100,
    "category": "food",
    "account": "SG"
  }'
```

**Verification:**
1. Open transactions page in browser
2. Inspect HTML (F12)
3. Verify script tag is escaped: `&lt;script&gt;alert("XSS")&lt;/script&gt;`

**Expected Result:**
- ✅ Script stored as text
- ✅ Script NOT executed in browser
- ✅ React automatically escapes output

---

### Test 3.3: Insecure Direct Object Reference (IDOR)

**Objective:** Covered in Test 1.1-1.3 (RLS tests)

**Reference:** See Phase 1 tests above

---

### Test 3.4: Sensitive Data Exposure

**Objective:** Verify no secrets in git, no stack traces in errors

**Commands:**
```bash
# Install gitleaks if not already installed
brew install gitleaks

# Scan repository for secrets
gitleaks detect --source . --verbose

# Scan full git history
gitleaks detect --source . --log-opts="--all"
```

**Expected Result:**
- ✅ `No leaks found`

**If Failed:** Remove secrets from git, add to `.env.local`, rotate compromised keys

---

### Test 3.5: Error Handling

**Objective:** Verify errors don't expose sensitive information

**Commands:**
```bash
# Trigger validation error
curl -X POST http://localhost:3000/api/transactions \
  -H "Cookie: <SESSION>" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Trigger server error (if possible)
curl -X POST http://localhost:3000/api/transactions \
  -H "Cookie: <SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "invalid-date",
    "label": "Test",
    "amount": "not-a-number",
    "category": "food",
    "account": "SG"
  }'
```

**Expected Result:**
- ✅ Generic error messages returned
- ✅ NO stack traces in response
- ✅ NO database schema information
- ✅ NO file paths or internal details

**Example Good Error:**
```json
{
  "error": "Invalid date format. Expected YYYY-MM-DD."
}
```

**Example Bad Error (should NOT happen):**
```json
{
  "error": "Error: Cannot read property 'toISOString' of undefined\n    at /Users/user/app/api/transactions/route.ts:106:24"
}
```

---

## 🚀 Automated Testing with OWASP ZAP

### Setup

```bash
# Install OWASP ZAP
brew install --cask owasp-zap

# Or use Docker
docker pull zaproxy/zap-stable
```

### Quick Scan

```bash
# Launch ZAP GUI
open -a "ZAP"

# Or run automated scan via CLI
zap-cli quick-scan http://localhost:3000

# Or via Docker
docker run -t zaproxy/zap-stable zap-baseline.py \
  -t http://host.docker.internal:3000
```

### Expected Results

- 🟢 **High/Critical Alerts:** 0
- 🟢 **Medium Alerts:** 0-2 (review individually)
- 🟡 **Low/Info Alerts:** Acceptable

**Common False Positives:**
- CSP warnings about `'unsafe-inline'` (required for Next.js)
- Cookie without SameSite (handled by Supabase)

---

## 📋 Final Validation Checklist

### Authentication
- [ ] Cannot access protected routes without authentication
- [ ] Session expires appropriately
- [ ] Logout invalidates session

### Authorization
- [ ] RLS active on all tables (25+ policies)
- [ ] Users cannot access other users' data (IDOR tests pass)
- [ ] Budget ownership verified in all endpoints

### Data Validation
- [ ] Invalid inputs rejected with clear error messages
- [ ] No SQL injection possible
- [ ] No XSS possible

### Security Configuration
- [ ] All security headers present
- [ ] HSTS enabled in production
- [ ] No sensitive files accessible (.env, .git)
- [ ] No secrets in git history

### Rate Limiting
- [ ] Projection endpoint limited to 20/min
- [ ] Write endpoints limited to 50/min
- [ ] 429 responses include Retry-After header
- [ ] Rate limiter fails open (doesn't break on error)

### Audit Logging
- [ ] Transaction creates logged
- [ ] Logs include IP, user-agent, details
- [ ] Logging failures don't break requests (non-blocking)
- [ ] RLS active on audit_logs table

### Error Handling
- [ ] No stack traces in responses
- [ ] Generic error messages
- [ ] All errors logged server-side

---

## 🎯 Success Criteria

**Minimum Requirements for Production:**
- ✅ All Phase 1 Critical tests pass
- ✅ All security headers present
- ✅ Rate limiting functional on ≥2 endpoints
- ✅ Audit logging functional
- ✅ No High/Critical alerts from OWASP ZAP
- ✅ No secrets in git (gitleaks clean)

**Security Score:** 9.5/10 (from initial 6.5/10)

---

## 📞 Support

For detailed guides, see:
- [PENETRATION_TESTING_GUIDE.md](./PENETRATION_TESTING_GUIDE.md) - In-depth pentesting
- [PHASE2_SUMMARY.md](./PHASE2_SUMMARY.md) - Implementation summary
- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) - Initial audit findings

---

## ✅ Sign-Off

**Tester Name:** _________________
**Date:** _________________
**All Tests Passed:** ☐ Yes ☐ No
**Issues Found:** _________________
**Ready for Production:** ☐ Yes ☐ No

**Notes:**
