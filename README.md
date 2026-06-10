# Jobber MCP Server

> An MCP server for [Jobber](https://www.getjobber.com) — connect any MCP-compatible client to your Jobber field-service data.

[![npm version](https://img.shields.io/npm/v/@supernova123/jobber-mcp-server)](https://www.npmjs.com/package/@supernova123/jobber-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@supernova123/jobber-mcp-server)](https://www.npmjs.com/package/@supernova123/jobber-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blueviolet)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Claude Desktop](https://img.shields.io/badge/Claude%20Desktop-ready-orange)](https://claude.ai/download)
[![Cursor](https://img.shields.io/badge/Cursor-compatible-blue)](https://cursor.sh)

## What is this?

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that gives AI assistants and agents access to your [Jobber](https://www.getjobber.com) data — clients, jobs, invoices, and quotes — through a clean, typed API.

Use it with **Claude Desktop**, **Cursor**, **Windsurf**, **Cline**, or any MCP-compatible client to ask questions about your business data, create quotes, and manage field-service operations through natural language.

## Why use this?

- **6 built-in tools** — clients, jobs, invoices, and quotes in one server
- **Mock mode** — try it instantly with fake data, no Jobber account needed
- **Natural language queries** — "show me overdue invoices" just works
- **Quote creation** — create and send quotes without opening Jobber
- **Client lookup** — find client details, contact info, and job history
- **Works with every MCP client** — Claude Desktop, Cursor, Windsurf, Cline, and more

## Quick Start

Add to your MCP client config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "jobber": {
      "command": "npx",
      "args": ["-y", "jobber-mcp-server"],
      "env": {
        "JOBBER_ACCESS_TOKEN": "your_token",
        "JOBBER_CLIENT_ID": "your_client_id",
        "JOBBER_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

Or try with mock data first (no Jobber account needed):

```bash
JOBBER_MOCK_MODE=true npx jobber-mcp-server
```

Get API credentials at [Jobber Developer Portal](https://developer.getjobber.com/).

### Use it

Ask your AI assistant things like:

- "List all my clients"
- "Show me the details for client-101"
- "What jobs are assigned to Alex Reyes?"
- "Create a quote for Northwind Roofing: 2 hours of emergency repair at $150/hr"
- "Which invoices are overdue?"

## Tools

| Tool | Description |
|------|-------------|
| `list_clients` | List clients with optional search, lead filter, and limit |
| `get_client` | Get a client by ID with contact info and recent jobs |
| `get_job` | Full job detail: status, assignees, schedule, line items |
| `list_invoices` | List invoices filtered by client and/or status |
| `get_invoice` | Full invoice detail with line items and payment status |
| `create_quote` | Create a new quote for a client with line items |

## Use Cases

### Daily Operations Check
"Show me today's jobs and any overdue invoices" — start your morning with a full picture of what needs attention. No more logging into Jobber's dashboard first thing.

### Client Research
"What's the history with Northwind Roofing?" — pull up client details, recent jobs, and outstanding invoices before a site visit or sales call.

### Quote Generation
"Create a quote for Mrs. Chen: gutter cleaning, 1 hour, $120" — draft and send quotes from the field without switching apps.

### Invoicing Audit
"Show me all unpaid invoices over $500" — find overdue payments and follow up without manually filtering through Jobber's invoice list.

### Field Service Reporting
"Summarize Alex Reyes' jobs this week" — generate performance summaries for team meetings or payroll without pulling reports manually.

## Security

- **OAuth credentials required** — Jobber API uses OAuth2. Credentials are passed via environment variables, never logged.
- **No local file access** — does not read or write any files on your machine (unless you enable mock mode).
- **No shell access** — does not execute commands or spawn processes.
- **Mock mode safe** — `JOBBER_MOCK_MODE=true` uses fake data with no API calls to Jobber.
- **Open source** — MIT licensed. Inspect the code at [GitHub](https://github.com/friendlygeorge/jobber-mcp-server).

## Troubleshooting

### "Authentication failed" errors
Verify your `JOBBER_CLIENT_ID`, `JOBBER_CLIENT_SECRET`, and `JOBBER_ACCESS_TOKEN` are correct. Tokens expire — check the Jobber Developer Portal for fresh credentials.

### "No data found" in mock mode
Make sure `JOBBER_MOCK_MODE=true` is set in your environment or MCP config. Mock mode creates sample clients, jobs, and invoices automatically.

### Server won't start
Make sure Node.js 18+ is installed: `node --version`. If using npx, ensure npm is up to date: `npm install -g npm@latest`.

### MCP client can't connect
Verify the config path is correct. Claude Desktop uses `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS and `%APPDATA%\Claude\claude_desktop_config.json` on Windows. Restart the client after config changes.

### Slow responses
Jobber's GraphQL API has ~200-500ms latency. Complex queries (e.g., listing clients with full job history) may take longer. Use `list_clients` with a `limit` parameter to speed up initial queries.

## Jobber API Setup

To use with your real Jobber account:

1. Go to [Jobber Developer Portal](https://developer.getjobber.com/)
2. Create an app and get your `client_id` and `client_secret`
3. Complete OAuth flow to get an `access_token`
4. Add credentials to `.env` or MCP client config

## Requirements

- Node.js 18+
- A [Jobber](https://www.getjobber.com) account with API access, or use `JOBBER_MOCK_MODE=true` for testing

## Development

```bash
git clone https://github.com/friendlygeorge/jobber-mcp-server.git
cd jobber-mcp-server
npm install
npm run build
npm run inspect   # opens MCP Inspector for testing
```

## License

MIT
