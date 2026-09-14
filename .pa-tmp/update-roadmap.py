import json
d = json.load(open('data/arena-roadmap.json'))
for e in d:
    if e['id'] == 'browsers':
        e['candidateProducts'] = ["Chrome", "Comet", "Dia", "Brave", "Edge", "Firefox"]
        e['rationale'] = "The browser war reopened for the first time in a decade, driven by agentic browsing — though ChatGPT Atlas already came and went (shut down Aug 2026, folded into the ChatGPT desktop app), so this arena needs evidence, not vibes."
    if e['id'] == 'image-generation':
        e['candidateProducts'] = ["ChatGPT (GPT-Image-2.5)", "Gemini (Nano Banana)", "Grok Imagine", "Midjourney", "Black Forest Labs FLUX", "Ideogram", "Adobe Firefly", "Recraft"]
        e['rationale'] = "Promoted by the 2026 frontier-lab product mapping: every lab now ships productized image generation and editing (GPT-Image-2.5 Sunburst/Flare, Nano Banana, Grok Imagine), and those lines sit page-only on family pages until this arena exists. Stories are ready to write: generate from a brief, edit with reference images, keep a character consistent, respect brand assets, drive it from an API."
        e['aiEraAngle'] = "Editing precision from references, API and agent access, provenance watermarking, and rights posture — capability stories, not benchmark scores."
    if e['id'] == 'video-generation':
        e['candidateProducts'] = ["Runway", "Google Flow (Veo)", "Grok Imagine", "Kling", "Luma", "Pika"]
        e['rationale'] = "The most-watched frontier of generative AI — and already consolidating: OpenAI shut the Sora app in April 2026 and retires its Videos API in Sept 2026, leaving Google Flow and Grok Imagine as the lab-shipped products."
json.dump(d, open('data/arena-roadmap.json', 'w'), indent=2)
for e in d:
    if e['id'] in ('browsers', 'image-generation', 'video-generation'):
        print(e['id'], e['candidateProducts'])
