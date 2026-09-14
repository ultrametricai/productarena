#!/bin/sh
set -x
pnpm pipeline judge --category ai-coding --product antigravity
pnpm pipeline judge --category ai-research-agents --product notebooklm
pnpm pipeline judge --category ai-assistants --product grok
pnpm pipeline judge --category design-tools --product claude-design
echo JUDGE_DONE
