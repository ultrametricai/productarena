#!/bin/sh
# Sequential spike passes for the rest of the frontier-models roster (--budget-urls 20),
# ≤3 retries per product on transient judge JSON failures (cache resumes). Never two spikes
# in the same arena concurrently. Jev runs FIRST and separately at --budget-urls 40 (founder
# emphasis) — see .pa-tmp/spike-fm-jev.log.
cd /Users/judegomila/Documents/GitHub/productarena/.claude/worktrees/agent-a7de3fb215d00e627 || exit 1
for p in claude gpt gemini llama deepseek mistral; do
  i=0
  ok=0
  while [ $i -lt 3 ]; do
    if pnpm tsx pipeline/scripts/spike-engine.ts --process --category frontier-models --product "$p" --budget-urls 20 >> ".pa-tmp/spike-fm-$p.log" 2>&1; then
      echo "SPIKE_OK $p after $i retries"
      ok=1
      break
    fi
    i=$((i+1))
    echo "SPIKE_RETRY $p $i"
    sleep 15
  done
  [ $ok -eq 1 ] || echo "SPIKE_FAILED $p"
done
echo "ALL_SPIKES_DONE"
