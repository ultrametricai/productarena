#!/usr/bin/env python3
# Adds the frontier-models roster's OFFICIAL SDK packages to pipeline/popularity-packages.json —
# the established registry-verified popularity sources (npm/PyPI weekly downloads), display-only.
# llama and deepseek get no package entry (no official SDK on either registry — HF downloads are
# not an established source here; their GitHub repos still feed stars via urls.github).
import json

p = 'pipeline/popularity-packages.json'
with open(p) as f:
    d = json.load(f)
add = {
    'jev': {'npm': '@typesafe-ai/sdk', 'pypi': 'typesafe-sdk'},
    'claude': {'npm': '@anthropic-ai/sdk', 'pypi': 'anthropic'},
    'gpt': {'npm': 'openai', 'pypi': 'openai'},
    'gemini': {'npm': '@google/genai', 'pypi': 'google-genai'},
    'mistral': {'npm': '@mistralai/mistralai', 'pypi': 'mistralai'},
}
for k, v in add.items():
    assert k not in d, k
    d[k] = v
with open(p, 'w') as f:
    json.dump(d, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('popularity-packages: added', list(add))
