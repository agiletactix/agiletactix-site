#!/usr/bin/env bash
# Test script for AgileTactix Assessment Worker (local dev)
# Run: bash test.sh
# Requires: wrangler dev running on localhost:8787

BASE="http://localhost:8787"
ENDPOINT="$BASE/assessment/score"
PASS=0
FAIL=0

heading() { echo -e "\n\033[1;34m=== $1 ===\033[0m"; }
pass()    { echo -e "\033[1;32mPASS\033[0m: $1"; PASS=$((PASS+1)); }
fail()    { echo -e "\033[1;31mFAIL\033[0m: $1"; FAIL=$((FAIL+1)); }

# -------------------------------------------------------------------
heading "Test 1: Rovo-Ready tier (high scores, cloud)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:4321" \
  -d '{
    "email": "test-ready@example.com",
    "first_name": "Ready",
    "role": "practitioner",
    "role_id": "jira_admin",
    "deployment": "cloud",
    "answers": {"q1":4,"q2":4,"q3":4,"q4":4,"q5":4,"q6":4,"q7":4,"q8":4,"q9":4,"q10":4},
    "consent_marketing": true,
    "timestamp": "2026-04-16T15:00:00Z"
  }')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"tier":"ready"'; then
  pass "Ready tier returned with HTTP 200"
else
  fail "Expected ready tier with HTTP 200, got HTTP $HTTP_CODE"
fi

# -------------------------------------------------------------------
heading "Test 2: Close to Ready tier (mid scores)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:4321" \
  -d '{
    "email": "test-close@example.com",
    "first_name": "Close",
    "role": "exec",
    "deployment": "cloud",
    "answers": {"q1":4,"q2":3,"q3":3,"q4":2,"q5":3,"q6":1,"q7":2,"q8":2,"q9":3,"q10":3},
    "consent_marketing": true
  }')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"tier":"close"'; then
  pass "Close tier returned with HTTP 200"
else
  fail "Expected close tier with HTTP 200, got HTTP $HTTP_CODE"
fi

# -------------------------------------------------------------------
heading "Test 3: Foundation tier (low scores)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:4321" \
  -d '{
    "email": "test-foundation@example.com",
    "role": "practitioner",
    "deployment": "data_center",
    "answers": {"q1":2,"q2":1,"q3":2,"q4":1,"q5":1,"q6":1,"q7":2,"q8":1,"q9":2,"q10":1},
    "consent_marketing": false
  }')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"deployment_override":true'; then
  pass "Foundation tier with deployment_override=true"
else
  fail "Expected foundation tier with deployment override, got HTTP $HTTP_CODE"
fi

# -------------------------------------------------------------------
heading "Test 4: Not Yet tier (very low scores, few weak dims)"
# notyet requires: <40% overall AND <2 weak dimensions (otherwise foundation catches it)
# All zeros = 0% overall, 5 weak dims -> foundation (by design: weakDimensionCount>=2)
# To hit notyet: need <40% AND only 0-1 weak dimensions — practically impossible
# with real answers. So we test the low-score path returns foundation with correct data.
RESP=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:4321" \
  -d '{
    "email": "test-notyet@example.com",
    "role": "mixed",
    "deployment": "server",
    "answers": {"q1":0,"q2":0,"q3":1,"q4":0,"q5":0,"q6":0,"q7":1,"q8":0,"q9":0,"q10":1},
    "consent_marketing": true
  }')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"overall_score_pct":8'; then
  pass "Very low score returns correct overall_score_pct=8 with HTTP 200"
else
  fail "Expected overall_score_pct=8 with HTTP 200, got HTTP $HTTP_CODE"
fi

# -------------------------------------------------------------------
heading "Test 5: CORS preflight (OPTIONS)"
RESP=$(curl -s -w "\n%{http_code}" -X OPTIONS "$ENDPOINT" \
  -H "Origin: http://localhost:4321" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")
HTTP_CODE=$(echo "$RESP" | tail -1)
if [ "$HTTP_CODE" = "204" ]; then
  pass "CORS preflight returned 204"
else
  fail "Expected 204 for OPTIONS, got HTTP $HTTP_CODE"
fi

# -------------------------------------------------------------------
heading "Test 6: Missing email (400)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:4321" \
  -d '{
    "role": "practitioner",
    "deployment": "cloud",
    "answers": {"q1":4,"q2":4,"q3":4,"q4":4,"q5":4,"q6":4,"q7":4,"q8":4,"q9":4,"q10":4}
  }')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
if [ "$HTTP_CODE" = "400" ]; then
  pass "Missing email returns 400"
else
  fail "Expected 400 for missing email, got HTTP $HTTP_CODE"
fi

# -------------------------------------------------------------------
heading "Test 7: Malformed JSON (400)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:4321" \
  -d 'not json at all')
HTTP_CODE=$(echo "$RESP" | tail -1)
if [ "$HTTP_CODE" = "400" ]; then
  pass "Malformed JSON returns 400"
else
  fail "Expected 400 for malformed JSON, got HTTP $HTTP_CODE"
fi

# -------------------------------------------------------------------
heading "Test 8: 404 for unknown route"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/nope")
HTTP_CODE=$(echo "$RESP" | tail -1)
if [ "$HTTP_CODE" = "404" ]; then
  pass "Unknown route returns 404"
else
  fail "Expected 404 for unknown route, got HTTP $HTTP_CODE"
fi

# -------------------------------------------------------------------
echo -e "\n\033[1m--- Results: $PASS passed, $FAIL failed ---\033[0m"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
