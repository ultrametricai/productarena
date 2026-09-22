#!/bin/sh
# Batch URL status checker: reads URLs from stdin, prints "code url".
while IFS= read -r u; do
  [ -n "$u" ] || continue
  code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 20 "$u")
  echo "$code $u"
done
