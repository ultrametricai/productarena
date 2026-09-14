#!/bin/sh
set -x
pnpm pipeline logos --category ai-coding --product antigravity
pnpm pipeline logos --category ai-research-agents --product notebooklm
pnpm pipeline logos --category ai-assistants --product grok
pnpm pipeline logos --category design-tools --product claude-design
echo LOGOS_DONE
