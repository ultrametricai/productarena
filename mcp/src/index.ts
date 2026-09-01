#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './server.js'

async function main() {
  const server = createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('init-dog-mcp: connected over stdio')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
