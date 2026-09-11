import type { LocalProbe } from './types'

export const probes: LocalProbe[] = [
    {
      // docs.stripe.com serves the markdown source of every docs page at URL + .md — the
      // Atlas guide included, so an agent can read the incorporation docs without a browser.
      probeId: 'docs-md-endpoint',
      productId: 'stripe-atlas',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://docs.stripe.com/atlas.md | head -8'],
      displayCommand: 'curl -s https://docs.stripe.com/atlas.md | head -8',
      expect: /# Stripe Atlas/,
      timeoutMs: 30_000,
    },
    {
      // Stripe's docs-wide llms.txt index carries a dedicated Atlas section linking every
      // Atlas guide as agent-readable markdown.
      probeId: 'llms-docs-index',
      productId: 'stripe-atlas',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', "curl -s --max-time 20 https://docs.stripe.com/llms.txt | grep -A 4 '## Atlas'"],
      displayCommand: "curl -s https://docs.stripe.com/llms.txt | grep -A 4 '## Atlas'",
      expect: /Stripe Atlas to incorporate/,
      timeoutMs: 30_000,
    },
]
