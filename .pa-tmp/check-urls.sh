#!/bin/sh
# Curl-verify a list of URLs (one per arg or stdin): prints "CODE FINAL_URL <- INPUT"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
while IFS= read -r u; do
  [ -z "$u" ] && continue
  out=$(curl -s -o /dev/null -w "%{http_code} %{url_effective}" -L --max-time 25 -A "$UA" "$u")
  echo "$out <- $u"
done
