#!/bin/sh
# Poll the incident-management judge cache until complete (270 cells) or ~9 minutes pass.
i=0
while [ $i -lt 54 ]; do
  n=$(find pipeline/cache/judge/incident-management -name '*.json' | wc -l | tr -d ' ')
  if [ -f data/incident-management/verdicts.json ]; then
    echo "verdicts.json written (cells: $n)"
    exit 0
  fi
  echo "cells: $n"
  sleep 10
  i=$((i+1))
done
echo "still running"
