# Jobber MCP Server — Demo Walkthrough

This file shows what a real interaction looks like when using the Jobber MCP server with mock data. It demonstrates the 6 tools available.

---

## Setup

```bash
# Start the server in mock mode
JOBBER_MOCK_MODE=true npx jobber-mcp-server

# Or with local install
JOBBER_MOCK_MODE=true node dist/index.js
```

---

## Tool Calls

### 1. List all clients

**User:** "List all my clients"

**Tool call:** `list_clients()`

**Response:**
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

---

### 2. Get client details

**User:** "Tell me about Northwind Roofing"

**Tool call:** `get_client(id: "client-102")`

**Response:**
```
**Northwind Roofing LLC** _(active)_ — id: client-102
  - Email: ops@northwindroofing.example
  - Phone: +1-555-0177
  - Address: 8800 W Industrial Blvd, Denver, CO, 80221
  - Lifetime spend: $28,400.00
  - Outstanding balance: $1,200.00

**Jobs (2):**
- **J-1043** — Re-roof estimate — north slope _(needs_action)_
- **J-1039** — Annual drain cleaning (commercial kitchen) _(complete)_
```

---

### 3. Get job detail

**User:** "What's the status of J-1042?"

**Tool call:** `get_job(id: "job-201")`

**Response:**
```
## Job J-1042 — HVAC tune-up + filter swap
- **Status:** active
- **Client:** Marlene Okonkwo _(client-101)_
- **Assigned to:** Alex Reyes
- **Scheduled:** 2025-06-04 13:00 UTC → 2025-06-04 15:00 UTC
- **Created:** 2025-05-28 18:00 UTC
- **Updated:** 2025-06-04 15:05 UTC

**Description:**
> Spring maintenance on a 3-ton heat pump system. Replace 20x25x1 filter and check refrigerant.

**Line items:**
| # | Item | Qty | Unit | Total |
|---|------|-----|------|-------|
| 1 | HVAC tune-up | 1 | $149.00 | $149.00 |
| 2 | 20x25x1 filter | 2 | $24.00 | $48.00 |

**Total:** $197.00
```

---

### 4. List invoices

**User:** "Show me unpaid invoices"

**Tool call:** `list_invoices(status: "awaiting_payment")`

**Response:**
```
Found 1 invoice with status awaiting_payment:

- **INV-2204** — HVAC tune-up + filter swap _(awaiting_payment)_ — Marlene Okonkwo — $197.00 (due $197.00)
```

---

### 5. Get invoice detail

**User:** "What's on invoice INV-2190?"

**Tool call:** `get_invoice(id: "invoice-303")`

**Response:**
```
## Invoice INV-2190 — Emergency leak repair
- **Status:** overdue
- **Client:** Northwind Roofing LLC _(client-102)_
- **Issued:** 2025-04-12
- **Due:** 2025-04-26
- **Subtotal:** $1,200.00
- **Total:** $1,200.00
- **Amount due:** $1,200.00

**Line items:**
| # | Item | Qty | Unit | Total |
|---|------|-----|------|-------|
| 1 | Emergency leak repair | 1 | $1,200.00 | $1,200.00 |
```

---

### 6. Create a quote

**User:** "Create a quote for Devon Park: website redesign, 20 hours at $125/hr"

**Tool call:** `create_quote(clientId: "client-103", subject: "Website redesign", lineItems: [{name: "Website redesign", description: "Full website redesign including UI/UX and responsive implementation", quantity: 20, unitCost: 125}])`

**Response:**
```
✅ Created quote **Q-0072** for Devon Park

## Quote Q-0072 — Website redesign
- **Status:** awaiting_response
- **Client:** Devon Park _(client-103)_
- **Created:** 2026-06-05 12:00 UTC

**Line items:**
| # | Item | Qty | Unit | Total |
|---|------|-----|------|-------|
| 1 | Website redesign | 20 | $125.00 | $2,500.00 |

**Subtotal:** $2,500.00
**Total:** $2,500.00
```

---

## Natural Language Examples

With the server connected, you can ask your AI assistant things like:

- *"How much does Northwind Roofing owe us?"*
- *"What jobs are scheduled for this week?"*
- *"Which clients are leads?"*
- *"Create a quote for Marlene: furnace inspection, $200 flat rate"*
- *"Summarize all overdue invoices"*
- *"What did Alex Reyes work on last month?"*
- *"List all jobs with status needs_action"*

The server returns Markdown-formatted text that reads naturally in chat.
