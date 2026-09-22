#!/usr/bin/env python3
# Appends curated HN seeds for the frontier-models roster to pipeline/seeds/community.json.
# Every id verified live via the Algolia search API on 2026-09-22 (points/comments noted):
#   jev:      49717558 "Introducing System One Models and Jev" (1959/511 — the launch),
#             49783999 "Kev: Tiny Jev-like family of decision models built on Qwen3.5" (446/198 —
#                      the replica wave), 49802161 "OpenAI is well positioned to fast-follow Jev"
#                      (136/101 — the competitive skeptic thread), 49778162 "I turned Jev into a
#                      (lousy) chatbot" (173/49 — honest what-it-isn't).
#   claude:   49038433 Claude Opus 5 (1778), 48311647 Opus 4.8 (1774), 46037637 Opus 4.5 (1113).
#   gpt:      48849066 GPT-5.6 (1561), 47879092 GPT-5.5 (1580), 48690101 "U.S. government will
#                      decide who gets to use GPT-5.6" (1184 — access-policy critique).
#   gemini:   49537553 Gemini 3.8 Flash and 3.8 Flash Cyber (1160), 45967211 Gemini 3 (1735),
#             46991240 Gemini 3 Deep Think (1081).
#   llama:    43595585 The Llama 4 herd (1235), 43620452 "Meta got caught gaming AI benchmarks"
#                      (347 — benchmark-integrity critique), 43835424 LlamaCon announcements (214).
#   deepseek: 47884971 DeepSeek v4 (2091), 49639090 DeepSeek v4.1 Flash (1016), 42768072
#                      DeepSeek-R1 (1843 — the open-weights moment).
#   mistral:  46121889 Mistral 3 family (826), 44236997 Magistral reasoning model (941),
#             37675496 Mistral 7B (884 — the original open-weights release).
import json

path = 'pipeline/seeds/community.json'
with open(path) as f:
    seeds = json.load(f)

fm = {
    'jev': [49717558, 49783999, 49802161, 49778162],
    'claude': [49038433, 48311647, 46037637],
    'gpt': [48849066, 47879092, 48690101],
    'gemini': [49537553, 45967211, 46991240],
    'llama': [43595585, 43620452, 43835424],
    'deepseek': [47884971, 49639090, 42768072],
    'mistral': [46121889, 44236997, 37675496],
}

if 'frontier-models' not in seeds:
    seeds['frontier-models'] = {
        pid: [f'https://hn.algolia.com/api/v1/items/{i}' for i in ids] for pid, ids in fm.items()
    }
    print('community.json: added frontier-models seeds')

with open(path, 'w') as f:
    json.dump(seeds, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('done')
