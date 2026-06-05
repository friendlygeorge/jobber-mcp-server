# Demo scenario: "Morning at the office"

This is a realistic end-to-end walkthrough of an agent — let's call her
**Mara** — using the Jobber MCP server to triage her morning inbox
without ever opening the Jobber web app.

The whole script runs in roughly 20 seconds and produces structured
output you can read in any MCP host (Claude Desktop, Cursor, the
inspector, or the `run-demo.sh` script in this directory).

---

## The setup

Mara runs a small HVAC + roofing company. She has 3 active clients, a
handful of jobs in flight, a stack of unpaid invoices, and a prospect
who came in over the weekend.

She has 4 minutes before her first site visit. She asks her agent:

> **"Give me my morning briefing and draft a follow-up quote for the
> Northwind roof job."**

Behind the scenes, the agent calls the Jobber MCP server.

---

## Step-by-step trace

### 1. List overdue invoices

The agent first wants to know what's overdue, so it can decide whether
to flag them to the human before the visit.

**Tool call:**

```json
{
  "name": "list_invoices",
  "arguments": { "status": "overdue" }
}
```

**Tool result (abridged):**

```
Found 1 invoice with status overdue:

- INV-2190 — Emergency leak repair (overdue) — Northwind Roofing LLC —
  $1200.00 (due $1200.00)
```

Mara glances at it. She knows Northwind well — they're the ones with
the re-roof quote still out for review. Two issues with the same
client. Probably worth mentioning in person.

### 2. Pull the invoice that generated the overdues

She needs context for the conversation.

**Tool call:**

```json
{
  "name": "get_invoice",
  "arguments": { "id": "invoice-303" }
}
```

**Tool result:**

```
## Invoice INV-2190 — Emergency leak repair
- Status: overdue
- Client: Northwind Roofing LLC (client-102)
- Job: job-203
- Issued: 2025-04-12
- Due: 2025-04-26
- Subtotal: $1200.00
- Total: $1200.00
- Amount due: $1200.00

Line items:
| # | Item           | Qty | Unit      | Total     |
|---|----------------|-----|-----------|-----------|
| 1 | Emergency leak | 1   | $1200.00  | $1200.00  |
```

### 3. Find the related open quote

The agent also wants to know what other work is pending with this
client, so the human has full context for the visit.

**Tool call:**

```json
{
  "name": "list_clients",
  "arguments": { "search": "Northwind" }
}
```

Then it follows up with the client's jobs and quotes — but the agent
already knows the quote id from context, so it just reads it.

**Tool call:**

```json
{
  "name": "get_client",
  "arguments": { "id": "client-102" }
}
```

The agent sees the open quote `Q-0071` in the listing and is ready to
follow up.

### 4. Create a follow-up quote for additional work

The site visit from `job-202` turned up that the chimney flashing is in
worse shape than the original scope. Mara wants a small add-on quote
ready to send the moment she gets a green light from Northwind.

**Tool call:**

```json
{
  "name": "create_quote",
  "arguments": {
    "clientId": "client-102",
    "subject": "Chimney crown rebuild — add-on to Q-0071",
    "message": "Found during 6/6 site visit. Recommended in addition to the north slope re-roof. Crown is spalling and will leak within 2 seasons if not addressed.",
    "expiryDate": "2025-07-15",
    "lineItems": [
      { "name": "Chimney crown demo + rebuild",  "quantity": 1, "unitCost": 850.00 },
      { "name": "Stainless steel rain cap",      "quantity": 1, "unitCost": 185.00 },
      { "name": "Tuckpointing (above roofline)", "quantity": 1, "unitCost": 420.00 }
    ]
  }
}
```

**Tool result:**

```
✅ Created quote Q-0073 for Northwind Roofing LLC

## Quote Q-0073 — Chimney crown rebuild — add-on to Q-0071
- Status: awaiting_response
- Client: Northwind Roofing LLC (client-102)
- Created: 2025-06-05 14:00:00 UTC
- Expires: 2025-07-15
- Message to client: Found during 6/6 site visit. Recommended in addition
  to the north slope re-roof. Crown is spalling and will leak within 2
  seasons if not addressed.

Line items:
| # | Item                              | Qty | Unit     | Total    |
|---|-----------------------------------|-----|----------|----------|
| 1 | Chimney crown demo + rebuild      | 1   | $850.00  | $850.00  |
| 2 | Stainless steel rain cap          | 1   | $185.00  | $185.00  |
| 3 | Tuckpointing (above roofline)     | 1   | $420.00  | $420.00  |

Subtotal: $1455.00
Total:    $1455.00
```

---

## What the agent says back to Mara

> ☕ **Morning briefing**
>
> - You have **1 overdue invoice**: `INV-2190` for $1,200 from
>   Northwind Roofing (issued 4/12, due 4/26). Mention it at the
>   site visit today.
> - You also still have quote `Q-0071` out to Northwind for the
>   north-slope re-roof ($8,120).
> - I drafted a follow-up quote `Q-0073` for $1,455 covering the
>   chimney crown + cap + tuckpointing you spotted yesterday. **I
>   did not send it** — want me to fire it off after your visit?

Mara says "yes", the agent calls the Jobber "send quote" workflow, and
she's out the door with a full picture in 90 seconds.

---

## Running the demo yourself

```bash
# 1. Build
npm install
npm run build

# 2. Run the scripted scenario
JOBBER_MOCK_MODE=true ./demo/run-demo.sh
```

Or, interactively:

```bash
JOBBER_MOCK_MODE=true npm run inspect
# then click through: list_invoices → get_invoice → get_client → create_quote
```

Or in Claude Desktop — just register the server and ask:

> "Give me my morning briefing and draft a follow-up quote for the
> Northwind roof job."
