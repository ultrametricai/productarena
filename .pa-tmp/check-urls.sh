#!/bin/sh
# Usage: check-urls.sh <file-with-urls>
while IFS= read -r u; do
  [ -z "$u" ] && continue
  code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 20 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" "$u")
  echo "$code $u"
done < "$1"
