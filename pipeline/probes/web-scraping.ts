// Keyless local probes for the web-scraping arena (see ./types.ts for the shape and ./index.ts
// for registration). Every probe is cheap, keyless, and read-only.
import type { LocalProbe } from './types'

export const probes: LocalProbe[] = [
  {
    // Riveter publishes its full current-generation OpenAPI 3.2 spec as a raw machine-readable
    // YAML file at a stable docs URL — the exact artifact an agent needs to drive the API.
    probeId: 'openapi-machine-spec',
    productId: 'riveter',
    storyIds: ['api-machine-spec', 'agentic-public-api'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 https://docs.riveterhq.com/openapi.yaml | head -3'],
    displayCommand: 'curl -s https://docs.riveterhq.com/openapi.yaml | head -3',
    expect: /title: Riveter API/,
    timeoutMs: 30_000,
  },
  {
    // The documented production API (api.riveterhq.com/v1) is live and answers a keyless
    // request with a structured JSON auth challenge — proof the endpoint exists, speaks JSON,
    // and gates access exactly as the spec's ApiKeyAuth (Authorization: Bearer) documents.
    probeId: 'api-keyless-auth-challenge',
    productId: 'riveter',
    storyIds: ['agentic-public-api'],
    bin: 'curl',
    argv: [
      'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://api.riveterhq.com/v1/quick_search',
      '-H', 'Content-Type: application/json',
      '-d', '{"query":"productarena probe"}',
    ],
    displayCommand: `curl -si -X POST https://api.riveterhq.com/v1/quick_search -H 'Content-Type: application/json' -d '{"query":"productarena probe"}'`,
    expect: /"error_type":"unauthorized"/,
    timeoutMs: 30_000,
  },
  {
    // Real pip install of the official Python SDK into a throwaway venv, then an import plus
    // version print — an install AND import roundtrip in one transcript, self-cleaned.
    probeId: 'pip-install-import-roundtrip',
    productId: 'riveter',
    storyIds: ['agentic-sdks'],
    bin: 'uv',
    argv: [
      'sh', '-c',
      `d=$(mktemp -d) && cd "$d" && uv venv -q && uv pip install -q riveter-sdk && ./.venv/bin/python -c "from importlib.metadata import version; import riveter; print('PA_PROBE_OK riveter-sdk', version('riveter-sdk'))" ; cd / && rm -rf "$d"`,
    ],
    displayCommand: `mktemp -d && uv venv && uv pip install riveter-sdk && python -c "import riveter; print('PA_PROBE_OK riveter-sdk', version('riveter-sdk'))"`,
    expect: /PA_PROBE_OK riveter-sdk \d+\.\d+/,
    timeoutMs: 240_000,
  },
]
