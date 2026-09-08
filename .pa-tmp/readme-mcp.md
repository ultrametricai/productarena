---
updatedAt: 2026-08-21T03:05:09.000Z
---

Fetch the complete documentation index at: https://docs.readme.com/main/llms.txt. Use this file to discover all available pages before exploring further. Append .md to any documentation page URL to get its markdown version.

If a page title in the index already matches your question, fetch that page directly. When no title matches, or finding one means reading a long index, attach a query parameter in the root llms.txt URL like https://docs.readme.com/main/llms.txt?query=<search-query> using 2-4 specific keywords to get only the matching pages, most relevant first.

# MCP

Give your users' AI tools live access to your API spec and docs.

Your MCP server gives AI coding assistants — Cursor, Claude Code, VS Code Copilot — a live connection to your API spec and documentation. Once enabled, AI tools connect to your MCP URL and can list endpoints, inspect schemas, make API calls, and search your docs directly, so they generate accurate code instead of guessing at your endpoints and parameters.

<br />

## Getting Started

1. Open your project in ReadMe.
2. Open **AI** → **MCP** and toggle **MCP Server** on.
3. Share the URL with your users: `https://your-project.readme.io/mcp`

Your hub's AI dropdown gives readers quick options to connect to Cursor, VS Code, or copy the MCP config directly. You can also write a custom guide page with connection instructions if you'd like to tailor the experience.

<br />

## Configure

### Available tools

**OpenAPI tools** — available on all plans:

| Tool                   | What it does                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| `list-endpoints`       | Returns all API paths and HTTP methods with summaries                  |
| `get-endpoint`         | Returns full detail on one endpoint: parameters, security, description |
| `search-specs`         | Case-insensitive search across paths, operations, and schemas          |
| `execute-request`      | Makes a live API call and returns the response                         |
| `list-specs`           | Lists all API specs in the project                                     |
| `get-server-variables` | Returns server variables                                               |

**Documentation tools** — require AI Booster Pack:

| Tool     | What it does                                                             |
| -------- | ------------------------------------------------------------------------ |
| `search` | Full-text search across guide and non-endpoint reference pages           |
| `fetch`  | Returns the full content of a guide or non-endpoint reference page by ID |

### Authentication

**Public projects** — no auth needed. Users connect with just the URL.

**API execution** — the `execute-request` tool forwards headers from the user's MCP config to your API. If your API requires an `Authorization` header:

```json
{
  "mcpServers": {
    "My API": {
      "url": "https://your-project.readme.io/mcp",
      "headers": {
        "Authorization": "Bearer user-api-key-here"
      }
    }
  }
}
```

**Private projects** — users must pass an `x-readme-auth` header:

| Access type            | Header          | Value                              |
| ---------------------- | --------------- | ---------------------------------- |
| Password protected     | `x-readme-auth` | The site password                  |
| Teammates only         | `x-readme-auth` | `Bearer rdme_xxx` (ReadMe API key) |
| Custom login (JWT/SSO) | `x-readme-auth` | `Bearer rdme_xxx` (ReadMe API key) |

For clients that don't support custom headers (like the Claude web UI), pass the same value as a `token` query parameter instead:

```
https://your-project.readme.io/mcp?token=your-site-password
https://your-project.readme.io/mcp?token=rdme_xxxxxxxxxxxx
```

### MCP server URLs

The standard URL is `https://your-project.readme.io/mcp`. Append parameters to customize behavior:

| Parameter          | Example                       | Description                                                                                                                                          |
| ------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `branch`           | `?branch=v2.0`                | Connect to a specific version branch. Doc search tools are not available on branches.                                                                |
| `project`          | `?project=my-api`             | Enterprise only. Limit to a single project.                                                                                                          |
| `token`            | `?token=rdme_xxx`             | Authenticate to a private project without setting a header. Accepts the site password or a ReadMe API key — same value you'd use in `x-readme-auth`. |
| `server`           | `?server=1`                   | Select a server from your API spec by index (zero-based). Only this server is exposed, and requests to others are rejected.                          |
| `server_variables` | `?server_variables=region=eu` | Override a server variable. Format: `KEY=VALUE`. Repeat the parameter for multiple variables.                                                        |

<Accordion title="Enterprise and custom domain URLs" icon="fa-building">

| Scenario              | URL                                                  |
| --------------------- | ---------------------------------------------------- |
| Custom domain         | `https://your-custom-domain.com/mcp`                 |
| All projects merged   | `https://your-enterprise.readme.io/mcp`              |
| Filter to one project | `https://your-enterprise.readme.io/mcp?project=slug` |
| Set server vars       | `https://your-enterprise.readme.io/mcp?server_variables=region=eu&server_variables=host=stage.com` |
</Accordion>

### Custom tools

Define your own tools that users' AI assistants can call. Go to **AI** → **MCP** → **Custom Tools** and click **New Tool**.

Each tool requires a title, a description (when should the AI use it), and a body (instructions to follow). Tool titles cannot match built-in tool names.

### Controlling which endpoints are exposed

All endpoints in your OpenAPI spec are available by default. Toggle individual endpoints on or off in **AI** → **MCP** → **Enabled MCP Routes**.

<br />

## Use Cases

These examples use the Petstore API to show what users can do with your MCP server.

### Build an API client

A developer connects their coding assistant to your MCP server and prompts:

```text
Write a Python script that lists all pets with status "available"
and lets me add a new pet by name.
```

The AI calls `list-endpoints` to discover the relevant paths, `get-endpoint` to read the schemas, and generates working code with correct fields and auth.

```python
import requests

BASE_URL = "https://petstore.swagger.io/v2"
API_KEY  = "your-api-key"

def list_available_pets():
    resp = requests.get(
        f"{BASE_URL}/pet/findByStatus",
        params={"status": "available"},
        headers={"api_key": API_KEY},
    )
    resp.raise_for_status()
    return resp.json()

def add_pet(name: str, status: str = "available") -> dict:
    payload = {"name": name, "status": status, "photoUrls": []}
    resp = requests.post(
        f"{BASE_URL}/pet",
        json=payload,
        headers={"api_key": API_KEY, "Content-Type": "application/json"},
    )
    resp.raise_for_status()
    return resp.json()
```

### Explore an unfamiliar API

```text
I've never used this API before. Use MCP tools to give me a quick-start
guide: what endpoints exist, what auth I need, and a curl example.
```

The AI calls `list-endpoints` and assembles an overview without you writing any additional documentation.

### Generate tests from your spec

```text
Look at the POST /pet endpoint and generate a Jest test suite covering:
a successful create, missing required fields, and an invalid status value.
```

The AI reads the request body schema, finds enum values for `status`, and writes tests against the actual contract.

### Automated API monitoring

```text
Check that the API is behaving correctly:
1. Call GET /pet/1 and verify the response matches the schema
2. Try POST /pet with an invalid status and confirm it returns a 400
3. Report any discrepancies
```

The agent uses `get-endpoint` to know what a valid response looks like, then `execute-request` to make the calls and compare.

## FAQ

<Accordion title="Can I show different information to different users?" icon="fa-users">
  Not currently. The MCP server exposes the same content to all users. Your API's own authentication handles data-level scoping — users supply their own API key and your backend controls access. URL-based filtering is on the roadmap.
</Accordion>

<Accordion title="What plan do I need?" icon="fa-credit-card">
  OpenAPI tools are available on all plans. Documentation tools (search, fetch) require the [AI Booster Pack](https://readme.com/pricing) add-on. Upgrade from **Settings** → **Manage Plan**.
</Accordion>

<Accordion title="Can I disable specific endpoints?" icon="fa-toggle-off">
  Yes. Go to **AI** (sparkle icon) → **MCP** → **Enabled MCP Routes** to toggle individual endpoints on or off.
</Accordion>

<br />

# Sub pages

* [MCP Metrics](https://docs.readme.com/main/docs/mcp-metrics.md)

# Sibling pages

* [Agent](https://docs.readme.com/main/docs/aiagent.md)
* [Linter](https://docs.readme.com/main/docs/linter.md)
* [Docs Audit](https://docs.readme.com/main/docs/docs-audit.md)
* [GitHub AI Writer](https://docs.readme.com/main/docs/github-ai-writer.md)
* [Ask AI](https://docs.readme.com/main/docs/ask-ai.md)
* [Discoverability](https://docs.readme.com/main/docs/ai-discoverability.md)
* [AI Dropdown](https://docs.readme.com/main/docs/askai.md)