#!/bin/sh
# Usage: wait-judge.sh <category> <expected-cell-count>
dir="pipeline/cache/judge/$1"
want="$2"
while :; do
  n=$(find "$dir" -name '*.json' | wc -l | tr -d ' ')
  if [ "$n" -ge "$want" ]; then echo "DONE: $n cells"; exit 0; fi
  sleep 15
done
