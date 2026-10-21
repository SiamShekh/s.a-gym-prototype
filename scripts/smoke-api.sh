#!/usr/bin/env bash
# Usage: ./scripts/smoke-api.sh https://your-host.up.railway.app
set -euo pipefail
BASE="${1:-http://127.0.0.1:4000}"
BASE="${BASE%/}"

echo "Smoke testing $BASE"

health="$(curl -sS -o /tmp/smoke-health.json -w '%{http_code}|%{content_type}' "$BASE/api/health")"
code="${health%%|*}"
ctype="${health#*|}"
echo "GET /api/health → $code ($ctype)"
if [[ "$code" != "200" ]] || [[ "$ctype" != application/json* ]]; then
  echo "FAIL: /api/health must return 200 application/json (got HTML/405 means static host, not Express)."
  head -c 200 /tmp/smoke-health.json; echo
  exit 1
fi

login="$(curl -sS -o /tmp/smoke-login.json -w '%{http_code}|%{content_type}' \
  -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"phone":"01746933966","password":"123456"}')"
lcode="${login%%|*}"
lctype="${login#*|}"
echo "POST /api/auth/login → $lcode ($lctype)"
if [[ "$lcode" == "405" ]]; then
  echo "FAIL: 405 Method Not Allowed — this host is not running the Express API."
  exit 1
fi
if [[ "$lctype" != application/json* ]]; then
  echo "FAIL: login response is not JSON."
  head -c 200 /tmp/smoke-login.json; echo
  exit 1
fi

echo "OK: API is reachable on $BASE"
