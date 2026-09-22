#!/usr/bin/env python3
# Curated HN seeds for self-hosted-assistants — every id returned live by the Algolia search
# API 2026-09-21 (points/comments in parens). Honest mix: OpenClaw gets its rename saga, the
# "what Apple intelligence should have been" rave, AND the "security nightmare" critique;
# open-webui gets its BSD-3 -> Open WebUI License relicensing thread; librechat gets the
# ClickHouse acquisition. lobe-chat has only two substantive on-topic threads — seeded thin
# rather than padded.
import json
p = json.load(open('pipeline/seeds/community.json'))
seeds = {
    'openclaw': [
        'https://hn.algolia.com/api/v1/items/46820783',  # OpenClaw – Moltbot Renamed Again (667)
        'https://hn.algolia.com/api/v1/items/46893970',  # what Apple intelligence should have been (518)
        'https://hn.algolia.com/api/v1/items/47479962',  # security nightmare dressed up as a daydream (397)
    ],
    'open-webui': [
        'https://hn.algolia.com/api/v1/items/43901575',  # license change BSD-3 -> Open WebUI license (73)
        'https://hn.algolia.com/api/v1/items/39415771',  # ChatGPT-style WebUI for Ollama (29)
        'https://hn.algolia.com/api/v1/items/42893411',  # run 1.58bit DeepSeek R1 with Open WebUI (37)
    ],
    'librechat': [
        'https://hn.algolia.com/api/v1/items/45877770',  # ClickHouse acquires LibreChat (118)
        'https://hn.algolia.com/api/v1/items/38502805',  # LibreChat – Enhanced ChatGPT Clone (98)
        'https://hn.algolia.com/api/v1/items/45554692',  # LibreChat + your own MCPs (5)
    ],
    'anythingllm': [
        'https://hn.algolia.com/api/v1/items/41457633',  # Show HN: AnythingLLM desktop AI assistant (368)
        'https://hn.algolia.com/api/v1/items/40090530',  # chat with your documents using any LLM (3)
        'https://hn.algolia.com/api/v1/items/43652908',  # all-in-one AI application (3)
    ],
    'khoj': [
        'https://hn.algolia.com/api/v1/items/36933452',  # Show HN: Khoj – chat offline with your second brain (565)
        'https://hn.algolia.com/api/v1/items/36641542',  # Khoj: AI personal assistant for your digital brain (155)
        'https://hn.algolia.com/api/v1/items/32833310',  # NL search engine for org/markdown notes (4)
    ],
    'lobe-chat': [
        'https://hn.algolia.com/api/v1/items/41070091',  # LobeChat open-source UI/Framework for LLMs (7)
        'https://hn.algolia.com/api/v1/items/45343741',  # Lobe Chat: modern-design AI chat framework (3)
    ],
}
if 'self-hosted-assistants' not in p:
    p['self-hosted-assistants'] = seeds
    print('added self-hosted-assistants seeds:', sum(len(v) for v in seeds.values()), 'items')
with open('pipeline/seeds/community.json', 'w') as f:
    json.dump(p, f, indent=2, ensure_ascii=False)
    f.write('\n')
