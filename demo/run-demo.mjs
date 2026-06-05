// Standalone demo driver. Spawns the MCP server over stdio, runs through
// the morning-briefing scenario, and prints each tool's response to the
// terminal in a readable form.
//
// Run with: node demo/run-demo.mjs

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(__dirname, "..", "dist", "index.js");

const transport = new StdioClientTransport({
  command: "node",
  args: [serverPath],
  env: { ...process.env, JOBBER_MOCK_MODE: "true" },
});

const client = new Client({ name: "demo-driver", version: "0.1.0" }, { capabilities: {} });

function banner(title) {
  const line = "─".repeat(72);
  console.log(`\n${line}\n▶ ${title}\n${line}`);
}

async function call(name, args) {
  banner(`TOOL CALL: ${name}(${JSON.stringify(args)})`);
  const result = await client.callTool({ name, arguments: args });
  for (const block of result.content) {
    if (block.type === "text") {
      console.log(block.text);
    } else {
      console.log(JSON.stringify(block, null, 2));
    }
  }
  if (result.isError) {
    console.log("⚠ tool returned isError=true");
  }
}

try {
  await client.connect(transport);

  banner("INITIALIZE");
  const { tools } = await client.listTools();
  console.log(`Server exposes ${tools.length} tools:`);
  for (const t of tools) {
    console.log(`  - ${t.name}`);
  }

  await call("list_invoices", { status: "overdue" });
  await call("get_invoice", { id: "invoice-303" });
  await call("get_client", { id: "client-102" });
  await call("create_quote", {
    clientId: "client-102",
    subject: "Chimney crown rebuild — add-on to Q-0071",
    message: "Found during 6/6 site visit. Recommended in addition to the north slope re-roof. Crown is spalling and will leak within 2 seasons if not addressed.",
    expiryDate: "2025-07-15",
    lineItems: [
      { name: "Chimney crown demo + rebuild", quantity: 1, unitCost: 850.0 },
      { name: "Stainless steel rain cap", quantity: 1, unitCost: 185.0 },
      { name: "Tuckpointing (above roofline)", quantity: 1, unitCost: 420.0 },
    ],
  });

  banner("DONE");
} catch (err) {
  console.error("Demo failed:", err);
  process.exitCode = 1;
} finally {
  await client.close();
}
