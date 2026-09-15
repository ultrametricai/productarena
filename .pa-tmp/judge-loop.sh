#!/bin/sh
# Retry-resume a judge run until the matrix completes (transient LLM output failures resume
# from the committed cache). Usage: sh .pa-tmp/judge-loop.sh <category>
cat=$1
i=0
while [ $i -lt 10 ]; do
  if pnpm pipeline judge --category "$cat" >> ".pa-tmp/judge-$cat.log" 2>&1; then
    echo "JUDGE_LOOP_DONE $cat after $i retries"
    exit 0
  fi
  i=$((i+1))
  echo "judge-loop retry $i" >> ".pa-tmp/judge-$cat.log"
  sleep 20
done
echo "JUDGE_LOOP_GAVE_UP $cat"
exit 1
