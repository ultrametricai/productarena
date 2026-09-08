#!/bin/sh
# Curl-verify a list of URLs: prints final status + effective URL for each.
while read -r u; do
  [ -z "$u" ] && continue
  out=$(curl -s -o /dev/null -w "%{http_code} -> %{url_effective}" -L --max-time 20 "$u")
  echo "$u :: $out"
done
