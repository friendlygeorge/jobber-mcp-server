# Jobber MCP Server

> An MCP server for [Jobber](https://www.getjobber.com) — connect any MCP-compatible client to your Jobber field-service data.

[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blueviolet)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## What is this?

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that gives AI assistants and agents access to your [Jobber](https://www.getjobber.com) data — clients, jobs, invoices, and quotes — through a clean, typed API.

Use it with **Claude Desktop**, **Cursor**, **Windsurf**, **Cline**, or any MCP-compatible client to ask questions about your business data, create quotes, and manage field-service operations through natural language.

## Tools

| Tool | Description |
|------|-------------|
| `list_clients` | List clients with optional search, lead filter, and limit |
| `get_client` | Get a client by ID with contact info and recent jobs |
| `get_job` | Full job detail: status, assignees, schedule, line items |
| `list_invoices` | List invoices filtered by client and/or status |
| `get_invoice` | Full invoice detail with line items and payment status |
| `create_quote` | Create a new quote for a client with line items |

## Quick Start

### 1. Install

```bash
npm install jobber-mcp-server
```

Or run directly with npx:

```bash
npx jobber-mcp-server
```

### 2. Configure

Create a `.env` file or set environment variables:

```env
# Required: Jobber API credentials
JOBBER_CLIENT_ID=your_client_id
JOBBER_CLIENT_SECRET=your_client_secret
JOBBER_ACCESS_TOKEN=your_access_token

# Optional: use mock data for testing (no Jobber account needed)
JOBBER_MOCK_MODE=true
```

### 3. Add to your MCP client

Add to your MCP client config (e.g. Claude Desktop's `claude_desktop_config.json`):

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

Or with a local install:

```json
{
  "mcpServers": {
    "jobber": {
      "command": "node",
      "args": ["/path/to/jobber-mcp-server/dist/index.js"],
      "env": {
        "JOBBER_MOCK_MODE": "true"
      }
    }
  }
}
```

## Demo

Try it instantly with mock data — no Jobber account required:

```bash
JOBBER_MOCK_MODE=true npx jobber-mcp-server
```

Then ask your MCP client:

- *"List all my clients"*
- *"Show me the details for client-101"*
- *"What jobs are assigned to Alex Reyes?"*
- *"Create a quote for Northwind Roofing: 2 hours of emergency repair at $150/hr"*
- *"Which invoices are overdue?"*

### Example output

**Client list:**
```
Found 3 clients:

**Marlene Okonkwo** _(active)_ — id: client-101
  - Email: marlene@example.com
  - Phone: +1-555-0142
  - Address: 412 Birchwood Ln, Boulder, CO, 80302
  - Lifetime spend: $4,280.00

**Northwind Roofing LLC** _(active)_ — id: client-102
  - Email: ops@northwindroofing.example
  - Phone: +1-555-0177
  - Address: 8800 W Industrial Blvd, Denver, CO, 80221
  - Lifetime spend: $28,400.00
  - Outstanding balance: $1,200.00

**Devon Park** _(lead)_ — id: client-103
  - Email: devon.park@example.com
  - Phone: +1-555-0193
```

**Quote creation:**
```
✅ Created quote **Q-0072** for Northwind Roofing LLC

## Quote Q-0072 — Emergency repair — 2 hours
- **Status:** awaiting_response
- **Client:** Northwind Roofing LLC _(client-102)_
- **Created:** 2026-06-05 12:00 UTC

**Line items:**
| # | Item | Qty | Unit | Total |
|---|------|-----|------|-------|
| 1 | Emergency repair | 2 | $150.00 | $300.00 |

**Subtotal:** $300.00
**Total:** $300.00
```

## Jobber API Setup

To use with your real Jobber account:

1. Go to [Jobber Developer Portal](https://developer.getjobber.com/)
2. Create an app and get your `client_id` and `client_secret`
3. Complete OAuth flow to get an `access_token`
4. Add credentials to `.env` or MCP client config

The server uses Jobber's GraphQL API (`https://api.getjobber.com/api/graphql`).

## Architecture

```
┌──────────────┐     stdio (JSON-RPC)     ┌──────────────────┐
│  MCP Client  │ ◄──────────────────────► │  jobber-mcp-     │
│  (Claude,    │                          │  server          │
│   Cursor,    │                          │                  │
│   etc.)      │                          │  ┌────────────┐  │
└──────────────┘                          │  │ Mock Data  │  │
                                          │  │ (testing)  │  │
                                          │  └────────────┘  │
                                          │        │         │
                                          │  ┌─────▼──────┐  │
                                          │  │ Jobber API │  │
                                          │  │ (GraphQL)  │  │
                                          │  └────────────┘  │
                                          └──────────────────┘
```

## Development

```bash
git clone https://github.com/nova-research/jobber-mcp-server.git
cd jobber-mcp-server
npm install
npm run build
npm run inspect   # opens MCP Inspector for testing
```

## Use Cases

- **Field service operators** — Ask your AI assistant about today's jobs, overdue invoices, or client history
- **Office managers** — Create quotes and check job status without opening Jobber
- **AI agents** — Automate follow-ups, generate reports, or trigger workflows based on Jobber data
- **Accounting integration** — Pull invoice data into AI-powered financial analysis

## License

MIT
