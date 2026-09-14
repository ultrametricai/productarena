#!/bin/sh
set -x
pnpm pipeline collect-community --category ai-coding --product antigravity
pnpm pipeline collect-community --category ai-research-agents --product notebooklm
pnpm pipeline collect-community --category ai-assistants --product grok
pnpm pipeline collect-community --category design-tools --product claude-design
pnpm pipeline probe --category ai-coding --product antigravity
pnpm pipeline probe --category ai-research-agents --product notebooklm
pnpm pipeline probe --category ai-assistants --product grok
pnpm pipeline probe --category design-tools --product claude-design
echo COMMUNITY_PROBE_DONE
