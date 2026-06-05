// MCP server entry point. Wires the Jobber client into the official MCP
// TypeScript SDK over stdio transport.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { loadConfig } from "./config.js";
import { JobberApi } from "./jobber-client.js";
import { formatClientSummary, formatJobDetail, formatInvoiceDetail, formatQuoteDetail } from "./formatters.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const jobber = new JobberApi(config);

  const server = new McpServer({
    name: "jobber-mcp-server",
    version: "0.1.0",
  });

  // ------------------------------------------------------------------
  // list_clients — list clients, optionally filtered by search/lead flag
  // ------------------------------------------------------------------
  server.tool(
    "list_clients",
    "List Jobber clients. Optional filters: search (matches name or email), isLead (true=leads only, false=active only), limit (default 50).",
    {
      search: z.string().optional().describe("Substring to match against client name or email."),
      isLead: z.boolean().optional().describe("If true, only leads. If false, only non-leads."),
      limit: z.number().int().positive().max(200).optional().describe("Maximum number of clients to return (default 50)."),
    },
    async (args) => {
      const clients = await jobber.listClients({
        search: args.search,
        isLead: args.isLead,
        limit: args.limit ?? 50,
      });
      const text =
        `Found ${clients.length} client${clients.length === 1 ? "" : "s"}` +
        (args.search ? ` matching "${args.search}"` : "") +
        (args.isLead === true ? " (leads only)" : args.isLead === false ? " (active only)" : "") +
        ":\n\n" +
        clients.map(formatClientSummary).join("\n\n");
      return { content: [{ type: "text" as const, text }] };
    },
  );

  // ------------------------------------------------------------------
  // get_client — get a single client by id, with their jobs
  // ------------------------------------------------------------------
  server.tool(
    "get_client",
    "Get a Jobber client by id, including their contact info and recent jobs.",
    {
      id: z.string().describe("The Jobber client id (e.g. 'client-101' in mock mode)."),
    },
    async (args) => {
      const client = await jobber.getClient(args.id);
      if (!client) {
        return { content: [{ type: "text" as const, text: `No client found with id "${args.id}".` }], isError: true };
      }
      const jobs = await jobber.listJobsForClient(client.id);
      const header = formatClientSummary(client);
      const jobsText =
        jobs.length === 0
          ? "_(no jobs on file)_"
          : jobs.map((j) => `- **${j.jobNumber ?? j.id}** — ${j.title} _(${j.status})_`).join("\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `${header}\n\n**Jobs (${jobs.length}):**\n${jobsText}`,
          },
        ],
      };
    },
  );

  // ------------------------------------------------------------------
  // get_job — full detail of a single job, including line items
  // ------------------------------------------------------------------
  server.tool(
    "get_job",
    "Get the full detail of a Jobber job by id, including status, assigned staff, schedule, and line items.",
    {
      id: z.string().describe("The Jobber job id (e.g. 'job-201' in mock mode)."),
    },
    async (args) => {
      const job = await jobber.getJob(args.id);
      if (!job) {
        return { content: [{ type: "text" as const, text: `No job found with id "${args.id}".` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: formatJobDetail(job) }] };
    },
  );

  // ------------------------------------------------------------------
  // list_invoices — list invoices, optionally filtered
  // ------------------------------------------------------------------
  server.tool(
    "list_invoices",
    "List Jobber invoices, optionally filtered by client and/or status.",
    {
      clientId: z.string().optional().describe("Filter to invoices for a specific client id."),
      status: z
        .enum(["draft", "awaiting_payment", "paid", "overdue", "voided"])
        .optional()
        .describe("Filter to invoices with this status."),
    },
    async (args) => {
      const invoices = await jobber.listInvoices({ clientId: args.clientId, status: args.status });
      const header =
        `Found ${invoices.length} invoice${invoices.length === 1 ? "" : "s"}` +
        (args.clientId ? ` for client ${args.clientId}` : "") +
        (args.status ? ` with status ${args.status}` : "") +
        ":\n\n";
      const body = invoices
        .map(
          (i) =>
            `- **${i.invoiceNumber}** — ${i.subject} _(${i.status})_ — ${i.clientName} — $${(i.total / 100).toFixed(2)} (due $${(i.amountDue / 100).toFixed(2)})`,
        )
        .join("\n");
      return { content: [{ type: "text" as const, text: header + body }] };
    },
  );

  // ------------------------------------------------------------------
  // get_invoice — full detail of a single invoice
  // ------------------------------------------------------------------
  server.tool(
    "get_invoice",
    "Get the full detail of a Jobber invoice by id, including line items and payment status.",
    {
      id: z.string().describe("The Jobber invoice id (e.g. 'invoice-301' in mock mode)."),
    },
    async (args) => {
      const invoice = await jobber.getInvoice(args.id);
      if (!invoice) {
        return { content: [{ type: "text" as const, text: `No invoice found with id "${args.id}".` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: formatInvoiceDetail(invoice) }] };
    },
  );

  // ------------------------------------------------------------------
  // create_quote — create a new quote for a client
  // ------------------------------------------------------------------
  server.tool(
    "create_quote",
    "Create a new quote in Jobber for a specific client. Returns the created quote with its line items, subtotal, and total. Amounts in line items are in dollars and are converted to cents internally.",
    {
      clientId: z.string().describe("The Jobber client id to quote."),
      subject: z.string().describe("Short summary of the quote (e.g. 'Re-roof north slope')."),
      message: z.string().optional().describe("Optional cover letter / scope notes shown to the client."),
      expiryDate: z.string().optional().describe("Optional ISO date (YYYY-MM-DD) when this quote expires."),
      lineItems: z
        .array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            quantity: z.number().positive(),
            unitCost: z.number().nonnegative().describe("Unit cost in dollars (e.g. 95.00 for $95.00)."),
          }),
        )
        .min(1)
        .describe("Line items that make up this quote."),
    },
    async (args) => {
      const quote = await jobber.createQuote({
        clientId: args.clientId,
        subject: args.subject,
        message: args.message,
        expiryDate: args.expiryDate,
        lineItems: args.lineItems,
      });
      return {
        content: [
          {
            type: "text" as const,
            text:
              `✅ Created quote **${quote.quoteNumber}** for ${quote.clientName}\n\n` +
              formatQuoteDetail(quote),
          },
        ],
      };
    },
  );

  // ---- Start server over stdio -----------------------------------------

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't pollute the stdio JSON-RPC stream.
  console.error(
    `[jobber-mcp-server] started (mode=${config.mockMode ? "mock" : "live"}, api=${config.apiUrl})`,
  );
}

main().catch((err) => {
  console.error("[jobber-mcp-server] fatal:", err);
  process.exit(1);
});
