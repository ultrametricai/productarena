#!/bin/sh
for u in \
  https://claude.com/product/cowork \
  https://claude.com/product/tag \
  https://claude.com/product/claude-science \
  https://claude.com/product/claude-security \
  https://claude.com/claude-in-chrome \
  https://claude.com/claude-for-microsoft-365 \
  https://developers.openai.com/codex \
  https://developers.openai.com/api/docs/guides/agents \
  https://developers.openai.com/plugins \
  https://developers.openai.com/api/docs \
  https://learn.chatgpt.com/docs \
  https://gemini.google/overview/gemini-in-chrome/ \
  https://flow.google.com \
  https://ai.google.dev/aistudio \
  https://docs.cloud.google.com/gemini/docs/codeassist/overview \
  https://adk.dev \
  https://geminicli.com \
  https://docs.x.ai/build/overview.md \
  https://docs.x.ai/grok-bot/overview.md \
  https://docs.x.ai/developers/model-capabilities/imagine.md \
  https://grokipedia.com \
  https://docs.x.ai \
  https://jules.google/docs \
  https://support.google.com/gemini \
  ; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 15 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" "$u")
  echo "$code $u"
done
