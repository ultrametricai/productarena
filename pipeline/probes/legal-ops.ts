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
    {
      // beglaubigt.de's site-root llms.txt is a hand-written agent index: services, legal
      // grounding (BeurkG §40a, eIDAS), and entry points — readable without a browser.
      probeId: 'llms-site-index',
      productId: 'beglaubigt',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://beglaubigt.de/llms.txt | head -4'],
      displayCommand: 'curl -s https://beglaubigt.de/llms.txt | head -4',
      expect: /digital notarization, incorporations of GmbHs/,
      timeoutMs: 30_000,
    },
    {
      // The API docs ship their own llms.txt indexing every endpoint — the Incorporation
      // section documents the machine-callable GmbH/UG formation API.
      probeId: 'llms-docs-index',
      productId: 'beglaubigt',
      storyIds: ['agentic-agent-docs', 'agentic-public-api'],
      bin: 'curl',
      argv: ['sh', '-c', "curl -s --max-time 20 https://docs.beglaubigt.de/llms.txt | grep -A 2 'Initiate Incorporation'"],
      displayCommand: "curl -s https://docs.beglaubigt.de/llms.txt | grep -A 2 'Initiate Incorporation'",
      expect: /creates an incorporation request for a company in Germany/,
      timeoutMs: 30_000,
    },
    {
      // The production REST API answers a keyless request to a documented v1 endpoint with a
      // clean 401 JSON auth challenge — live, Bearer-token-gated, exactly as the docs describe.
      probeId: 'api-auth-gate',
      productId: 'beglaubigt',
      storyIds: ['agentic-public-api'],
      bin: 'curl',
      argv: ['curl', '-s', '-i', '--max-time', '20', 'https://api.beglaubigt.de/v1/notarization/123e4567-e89b-12d3-a456-426614174000'],
      displayCommand: 'curl -si https://api.beglaubigt.de/v1/notarization/<uuid>',
      expect: /401[\s\S]*Unauthorized: Invalid API token/,
      timeoutMs: 30_000,
    },
]
