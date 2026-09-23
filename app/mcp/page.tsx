import { redirect } from 'next/navigation'

// Retired (founder 2026-09-23): ProductArena is not offered via its own MCP server or CLI —
// a real Ultrametric MCP + API is coming instead. Old links land on the data-access docs-free
// homepage rather than 404ing. Vendor MCP probing in the microterminal is unrelated and stays.
export default function McpRetired() {
  redirect('/')
}
