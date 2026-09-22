#!/bin/sh
# Jev deep spike FIRST (--budget-urls 40, founder emphasis), ≤3 retries on transient judge
# JSON failures (cache resumes).
cd /Users/judegomila/Documents/GitHub/productarena/.claude/worktrees/agent-a7de3fb215d00e627 || exit 1
i=0
ok=0
while [ $i -lt 3 ]; do
  if pnpm tsx pipeline/scripts/spike-engine.ts --process --category frontier-models --product jev --budget-urls 40 >> .pa-tmp/spike-fm-jev.log 2>&1; then
    echo "SPIKE_OK jev after $i retries"
    ok=1
    break
  fi
  i=$((i+1))
  echo "SPIKE_RETRY jev $i"
  sleep 15
done
[ $ok -eq 1 ] || echo "SPIKE_FAILED jev"
echo "JEV_SPIKE_DONE"
