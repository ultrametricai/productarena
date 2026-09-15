#!/usr/bin/env python3
"""Sync the MCP_ENDPOINTS block in infra/cloudflare-proxy/worker.js from the generated
lib/mcpEndpoints.ts (the worker is dependency-free by design and can't import the TS module;
infra/cloudflare-proxy/__tests__/mcp-probe.test.ts asserts the two never drift)."""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lib = open(os.path.join(ROOT, 'lib', 'mcpEndpoints.ts')).read()
m = re.search(r'export const MCP_ENDPOINTS: Record<string, string> = \{\n(.*?)\n\}', lib, re.S)
body = m.group(1)

wpath = os.path.join(ROOT, 'infra', 'cloudflare-proxy', 'worker.js')
w = open(wpath).read()
new_w, n = re.subn(r'(export const MCP_ENDPOINTS = \{\n).*?(\n\};?\n)', r'\g<1>' + body.replace('\\', '\\\\') + r'\g<2>', w, count=1, flags=re.S)
assert n == 1, 'worker MCP_ENDPOINTS block not found'
open(wpath, 'w').write(new_w)
print('worker.js MCP_ENDPOINTS synced:', body.count("':"), 'entries')
