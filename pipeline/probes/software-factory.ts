import type { LocalProbe } from './types'

export const probes: LocalProbe[] = [
    {
      // Omnara's docs publish a full llms.txt index (the docs domain 301s the bare path, so
      // follow redirects) — the agent-docs surface in one keyless fetch.
      probeId: 'llms-docs-index',
      productId: 'omnara',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -sL --max-time 20 https://docs.omnara.com/llms.txt | head -6'],
      displayCommand: 'curl -sL https://docs.omnara.com/llms.txt | head -6',
      expect: /# Omnara/,
      timeoutMs: 30_000,
    },
    {
      // Mintlify-style docs serve clean markdown at any page URL + .md — machine-readable docs
      // without scraping HTML.
      probeId: 'docs-md-endpoint',
      productId: 'omnara',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://docs.omnara.com/introduction.md | head -6'],
      displayCommand: 'curl -s https://docs.omnara.com/introduction.md | head -6',
      expect: /Documentation Index/,
      timeoutMs: 30_000,
    },
]
