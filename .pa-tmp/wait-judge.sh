#!/bin/sh
# Poll the judge cell cache until the data-pipelines matrix is complete (bounded).
n=0
while [ $n -lt 190 ]; do
  c=$(find pipeline/cache/judge/data-pipelines -name '*.json' | wc -l | tr -d ' ')
  if [ "$c" = "265" ]; then break; fi
  sleep 3
  n=$((n+1))
done
find pipeline/cache/judge/data-pipelines -name '*.json' | wc -l
