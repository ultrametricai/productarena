#!/bin/sh
set -x
pnpm pipeline claims --category ai-coding --product antigravity
pnpm pipeline claims --category ai-research-agents --product notebooklm
pnpm pipeline claims --category ai-assistants --product grok
pnpm pipeline claims --category design-tools --product claude-design
pnpm pipeline derive --category ai-coding
pnpm pipeline derive --category ai-research-agents
pnpm pipeline derive --category ai-assistants
pnpm pipeline derive --category design-tools
pnpm exec tsx pipeline/scripts/compute-confidence-intervals.ts --category ai-coding
pnpm exec tsx pipeline/scripts/compute-confidence-intervals.ts --category ai-research-agents
pnpm exec tsx pipeline/scripts/compute-confidence-intervals.ts --category ai-assistants
pnpm exec tsx pipeline/scripts/compute-confidence-intervals.ts --category design-tools
echo POST_JUDGE_DONE
