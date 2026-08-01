#!/usr/bin/env bash

set -euo pipefail

BASE="${1:-http://localhost:3000}"
SAP_SECRET="${SAP_WEBHOOK_SECRET:-sap-demo-secret}"
PASS=0
FAIL=0

check() {
  if [ "$2" = "$3" ]; then
    PASS=$((PASS + 1)); echo "  ok   $1 ($3)"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL $1 (expected $2, got $3)"
  fi
}

status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

echo "== health =="
check "GET /api/health" 200 "$(status "$BASE/api/health")"

echo "== auth =="
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"username":"supervisor1","password":"arvind123"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')
[ -n "$TOKEN" ] && { PASS=$((PASS+1)); echo "  ok   login returns token"; } || { FAIL=$((FAIL+1)); echo "  FAIL login"; }
AUTH="Authorization: Bearer $TOKEN"
check "bad credentials" 401 "$(status -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d '{"username":"supervisor1","password":"x"}')"
check "list without token" 401 "$(status "$BASE/api/inspections")"

echo "== inspections =="
BODY='{"inspection_date":"2026-07-31","machine_id":"SMOKE-1","defect_type":"Other","severity":"Minor","remarks":"smoke test"}'
CREATED=$(curl -s -X POST "$BASE/api/inspections" -H "$AUTH" -H 'Content-Type: application/json' -d "$BODY")
ID=$(echo "$CREATED" | sed -E 's/.*"id":"([^"]+)".*/\1/')
[ -n "$ID" ] && { PASS=$((PASS+1)); echo "  ok   create returns id"; } || { FAIL=$((FAIL+1)); echo "  FAIL create"; }
check "invalid create" 400 "$(status -X POST "$BASE/api/inspections" -H "$AUTH" -H 'Content-Type: application/json' -d '{}')"
check "list with filters" 200 "$(status "$BASE/api/inspections?severity=Minor&status=Open&from=2026-01-01" -H "$AUTH")"
check "invalid filter" 400 "$(status "$BASE/api/inspections?severity=Bogus" -H "$AUTH")"
check "detail" 200 "$(status "$BASE/api/inspections/$ID" -H "$AUTH")"
check "summary" 200 "$(status "$BASE/api/inspections/summary" -H "$AUTH")"

echo "== resolve =="
check "resolve without note" 400 "$(status -X PATCH "$BASE/api/inspections/$ID" -H "$AUTH" -H 'Content-Type: application/json' -d '{"status":"Resolved"}')"
check "resolve with note" 200 "$(status -X PATCH "$BASE/api/inspections/$ID" -H "$AUTH" -H 'Content-Type: application/json' -d '{"status":"Resolved","resolution_note":"fixed"}')"
check "resolve again" 409 "$(status -X PATCH "$BASE/api/inspections/$ID" -H "$AUTH" -H 'Content-Type: application/json' -d '{"status":"Resolved","resolution_note":"again"}')"
check "unknown id" 404 "$(status "$BASE/api/inspections/00000000-0000-4000-8000-000000000000" -H "$AUTH")"

echo "== sap webhook =="
SAP='{"plant_code":"GJ-01","machine":"LOOM-14","defect_code":"WEAVE","severity":"HIGH","notes":"smoke"}'
check "wrong secret" 401 "$(status -X POST "$BASE/api/sap-webhook" -H 'Content-Type: application/json' -H 'X-SAP-Secret: wrong' -d "$SAP")"
check "valid payload" 201 "$(status -X POST "$BASE/api/sap-webhook" -H 'Content-Type: application/json' -H "X-SAP-Secret: $SAP_SECRET" -d "$SAP")"
check "invalid payload" 400 "$(status -X POST "$BASE/api/sap-webhook" -H 'Content-Type: application/json' -H "X-SAP-Secret: $SAP_SECRET" -d '{"plant_code":"GJ-01"}')"

echo
echo "passed: $PASS, failed: $FAIL"
[ "$FAIL" -eq 0 ]
