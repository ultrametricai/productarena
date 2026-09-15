import type { LocalProbe } from './types'

// Processors arena: hardware has almost no keyless probeable surface — no APIs, no CLIs, no MCP
// servers — so the only honest local probes are "the vendor's own spec page is live and names
// the part" checks, plus one developer-surface check (the Ryzen AI SDK docs the NPU story leans
// on). One probe records a spec-transparency FINDING rather than a pass: qualcomm.com is a
// client-rendered app whose spec page serves only a "You need to enable JavaScript to run this
// app" shell to any non-browser fetcher — recorded reality wins. All probes are keyless,
// read-only curls; nothing installs or mutates state.
export const probes: LocalProbe[] = [
  {
    // Apple's M5 announcement (the chip's canonical spec source — Apple publishes no ARK-style
    // spec sheet) is live and describes the per-GPU-core Neural Accelerators.
    probeId: 'spec-page-live',
    productId: 'apple-m5',
    storyIds: ['published-spec-sheet', 'npu-developer-access'],
    bin: 'curl',
    argv: ['sh', '-c', `curl -sL --max-time 20 'https://www.apple.com/newsroom/2025/10/apple-unleashes-m5-the-next-big-leap-in-ai-performance-for-apple-silicon/' | grep -o 'Neural Accelerator' | head -1`],
    displayCommand: `curl -sL 'https://www.apple.com/newsroom/2025/10/apple-unleashes-m5-…-apple-silicon/' | grep -o 'Neural Accelerator' | head -1  # Apple's canonical M5 spec source, live`,
    expect: /Neural Accelerator/,
    timeoutMs: 30_000,
  },
  {
    // Intel ARK spec page for the 285K answers keyless curls (it 403-walled curl at the
    // 2026-09-14 experiments curation; recorded as it answers today) and names the part.
    probeId: 'ark-spec-page-live',
    productId: 'intel-core-ultra-9-285k',
    storyIds: ['published-spec-sheet'],
    bin: 'curl',
    argv: ['sh', '-c', `curl -sL --max-time 20 'https://www.intel.com/content/www/us/en/products/sku/241060/intel-core-ultra-9-processor-285k-36m-cache-up-to-5-70-ghz/specifications.html' | grep -o '285K' | head -1`],
    displayCommand: `curl -sL 'https://www.intel.com/…/sku/241060/…/specifications.html' | grep -o '285K' | head -1  # Intel ARK spec sheet, live and keyless`,
    expect: /285K/,
    timeoutMs: 30_000,
  },
  {
    // The spec-transparency finding, recorded as-is: Qualcomm's X2 Elite spec page is a
    // client-rendered app — a keyless fetch gets a JS shell, not a spec sheet.
    probeId: 'spec-page-js-shell',
    productId: 'qualcomm-snapdragon-x2-elite-extreme',
    storyIds: ['published-spec-sheet'],
    bin: 'curl',
    argv: ['sh', '-c', `curl -sL --max-time 20 'https://www.qualcomm.com/laptops/products/snapdragon-x2-elite' | grep -o 'enable JavaScript to run this app' | head -1`],
    displayCommand: `curl -sL 'https://www.qualcomm.com/laptops/products/snapdragon-x2-elite' | grep -o 'enable JavaScript to run this app' | head -1  # the vendor spec page serves a JS shell to crawlers — the finding IS the transparency gap`,
    expect: /enable JavaScript to run this app/,
    timeoutMs: 30_000,
  },
  {
    // The Ryzen AI SDK docs — the developer surface the Strix Halo NPU story stands on — are
    // live and keyless (ryzenai.docs.amd.com is NOT behind the www.amd.com bot wall).
    probeId: 'ryzen-ai-sdk-docs-live',
    productId: 'amd-ryzen-ai-max-plus-395',
    storyIds: ['npu-developer-access', 'local-llm-runtime-support'],
    bin: 'curl',
    argv: ['sh', '-c', `curl -sL --max-time 20 'https://ryzenai.docs.amd.com/en/latest/' | grep -o 'Ryzen AI' | head -1`],
    displayCommand: `curl -sL 'https://ryzenai.docs.amd.com/en/latest/' | grep -o 'Ryzen AI' | head -1  # the NPU SDK docs the local-AI stories lean on, live`,
    expect: /Ryzen AI/,
    timeoutMs: 30_000,
  },
]
