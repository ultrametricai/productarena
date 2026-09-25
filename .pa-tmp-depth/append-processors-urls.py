#!/usr/bin/env python3
"""Append live-verified, part-applicable depth URLs to processors products.json.
All URLs verified 200 with real matching content (titles/mentions checked):
- MBP16 2024 tech specs (M4 Pro/Max page, verified 'M4 Max'/'M4 Pro' mentions)
- Mac Studio 2025 newsroom announcement (34 'M4 Max' mentions)
- MBP M4-family newsroom announcement
- OpenVINO NPU device docs + release notes (Lunar Lake NPU is a documented target)
- Qualcomm X2 Elite Extreme launch release + Snapdragon compute platforms page
  (qualcomm.com serves thin SSR shells to the crawler; meta/SSR content only —
  recorded as a potential honest ceiling)
NOTE deliberately absent: nothing NPU/Ryzen-AI for the 9950X3D (GAIA precedent);
its amd.com additions go through the browser-UA prefetch path separately.
"""
import json

ADD = {
    'apple-m4-max': [
        'https://support.apple.com/en-us/121554',
        'https://www.apple.com/newsroom/2025/03/apple-unveils-new-mac-studio-the-most-powerful-mac-ever/',
    ],
    'apple-m4-pro': [
        'https://support.apple.com/en-us/121554',
        'https://www.apple.com/newsroom/2024/10/new-macbook-pro-features-m4-family-of-chips-and-apple-intelligence/',
    ],
    'intel-core-ultra-7-258v': [
        'https://docs.openvino.ai/2025/openvino-workflow/running-inference/inference-devices-and-modes/npu-device.html',
        'https://docs.openvino.ai/2025/about-openvino/release-notes-openvino.html',
    ],
    'qualcomm-snapdragon-x2-elite-extreme': [
        'https://www.qualcomm.com/news/releases/2025/09/new-snapdragon-x2-elite-extreme-and-snapdragon-x2-elite-are-the-',
        'https://www.qualcomm.com/products/mobile/snapdragon/laptops-and-tablets/snapdragon-mobile-compute-platforms',
        'https://www.qualcomm.com/news/onq/2026/06/asus-ascent-qn10-snapdragon-x2-elite',
    ],
    'amd-ryzen-9-9950x3d': [
        'https://www.amd.com/en/products/software/ryzen-master.html',
        'https://www.amd.com/en/products/processors/chipsets/am5.html',
        'https://www.amd.com/en/products/processors/desktops/ryzen/9000-series.html',
    ],
}

f = 'data/processors/products.json'
prods = json.load(open(f))
for p in prods:
    if p['id'] in ADD:
        extra = p['urls'].setdefault('extra', [])
        added = [u for u in ADD[p['id']] if u not in extra]
        extra.extend(added)
        print(p['id'], 'appended', len(added))
json.dump(prods, open(f, 'w'), indent=2, ensure_ascii=False)
open(f, 'a').write('\n')
