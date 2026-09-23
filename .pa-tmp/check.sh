#!/bin/sh
# URL liveness checker: status code + first bytes of body (bot-wall detection).
while IFS= read -r u; do
  [ -z "$u" ] && continue
  body=$(curl -sL --max-time 20 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" -w "\n__CODE__%{http_code}" "$u" 2>/dev/null)
  code=$(printf '%s' "$body" | tail -1 | sed 's/__CODE__//')
  snippet=$(printf '%s' "$body" | sed '$d' | head -c 400 | tr -d '\n\r' | tr -s ' ' | cut -c1-160)
  echo "$code | $u | $snippet"
done
