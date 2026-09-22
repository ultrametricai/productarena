#!/usr/bin/env python3
# Registry packages for self-hosted-assistants popularity (verified live 2026-09-21:
# npm openclaw 2026.9.5, pypi open-webui 0.11.4, pypi khoj 1.42.10). The other three
# (librechat, anythingllm, lobe-chat) distribute via Docker/desktop — GitHub-only popularity.
import json
p = json.load(open('pipeline/popularity-packages.json'))
add = {
    'openclaw': {'npm': 'openclaw'},
    'open-webui': {'pypi': 'open-webui'},
    'khoj': {'pypi': 'khoj'},
}
for k, v in add.items():
    if k not in p:
        p[k] = v
        print('added', k, v)
with open('pipeline/popularity-packages.json', 'w') as f:
    json.dump(p, f, indent=2, ensure_ascii=False)
    f.write('\n')
