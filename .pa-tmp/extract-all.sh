#!/bin/sh
set -x
pnpm pipeline extract --category ai-coding --product antigravity
pnpm pipeline extract --category ai-research-agents --product notebooklm
pnpm pipeline extract --category ai-assistants --product grok
pnpm pipeline extract --category design-tools --product claude-design
echo EXTRACT_DONE
