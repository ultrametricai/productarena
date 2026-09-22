#!/bin/sh
# Sequential spike passes for the rest of the self-hosted-assistants roster (--budget-urls 20),
# ≤3 retries per product on transient judge JSON failures (cache resumes). Never two spikes
# in the same arena concurrently.
cd /Users/judegomila/Documents/GitHub/productarena/.claude/worktrees/agent-a6c606f81a86f2eaf || exit 1
for p in open-webui librechat anythingllm khoj lobe-chat; do
  i=0
  ok=0
  while [ $i -lt 3 ]; do
    if pnpm tsx pipeline/scripts/spike-engine.ts --process --category self-hosted-assistants --product "$p" --budget-urls 20 >> ".pa-tmp/spike-sha-$p.log" 2>&1; then
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
