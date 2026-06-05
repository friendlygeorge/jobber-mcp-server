// Pretty-printers for Jobber objects. Produces markdown that reads well
// when an LLM agent shows it back to a human.

import type { JobberClient, JobberInvoice, JobberJob, JobberQuote } from "./types.js";

const fmtMoney = (cents: number): string => `$${(cents / 100).toFixed(2)}`;
const fmtDate = (iso?: string | null): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
};
const fmtDateTime = (iso?: string | null): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  } catch {
    return iso;
  }
};

export function formatClientSummary(c: JobberClient): string {
  const lines: string[] = [];
  lines.push(`**${c.name}** _(${c.isLead ? "lead" : c.isArchived ? "archived" : "active"})_ — id: \`${c.id}\``);
  if (c.emails.length > 0) {
    lines.push(`  - Email: ${c.emails.map((e) => e.value).join(", ")}`);
  }
  if (c.phones.length > 0) {
    lines.push(`  - Phone: ${c.phones.map((p) => p.value).join(", ")}`);
  }
  if (c.billingAddress?.street1) {
    const a = c.billingAddress;
    const cityLine = [a.city, a.province, a.postalCode].filter(Boolean).join(", ");
    lines.push(`  - Address: ${a.street1}${a.street2 ? `, ${a.street2}` : ""}, ${cityLine}`);
  }
  if (c.totalSpent !== undefined && c.totalSpent !== null) {
    lines.push(`  - Lifetime spend: ${fmtMoney(c.totalSpent)}`);
  }
  if (c.balance !== undefined && c.balance !== null && c.balance > 0) {
    lines.push(`  - Outstanding balance: ${fmtMoney(c.balance)}`);
  }
  return lines.join("\n");
}

export function formatJobDetail(j: JobberJob): string {
  const lines: string[] = [];
  lines.push(`## Job ${j.jobNumber ?? j.id} — ${j.title}`);
  lines.push(`- **Status:** ${j.status}`);
  lines.push(`- **Client:** ${j.clientName} _(\`${j.clientId}\`)_`);
  if (j.assignedTo.length > 0) {
    lines.push(`- **Assigned to:** ${j.assignedTo.map((a) => a.name).join(", ")}`);
  }
  if (j.startDate) lines.push(`- **Scheduled:** ${fmtDateTime(j.startDate)}${j.endDate ? ` → ${fmtDateTime(j.endDate)}` : ""}`);
  lines.push(`- **Created:** ${fmtDateTime(j.createdAt)}`);
  lines.push(`- **Updated:** ${fmtDateTime(j.updatedAt)}`);
  if (j.description) {
    lines.push(`\n**Description:**\n> ${j.description}`);
  }
  if (j.lineItems.length > 0) {
    lines.push(`\n**Line items:**`);
    lines.push(`| # | Item | Qty | Unit | Total |`);
    lines.push(`|---|------|-----|------|-------|`);
    j.lineItems.forEach((li, idx) => {
      lines.push(`| ${idx + 1} | ${li.name} | ${li.quantity} | ${fmtMoney(li.unitCost)} | ${fmtMoney(li.totalCost)} |`);
    });
    lines.push(`\n**Total:** ${fmtMoney(j.total)}`);
  } else {
    lines.push(`\n_(no line items yet)_`);
  }
  return lines.join("\n");
}

export function formatInvoiceDetail(i: JobberInvoice): string {
  const lines: string[] = [];
  lines.push(`## Invoice ${i.invoiceNumber} — ${i.subject}`);
  lines.push(`- **Status:** ${i.status}`);
  lines.push(`- **Client:** ${i.clientName} _(\`${i.clientId}\`)_`);
  if (i.jobId) lines.push(`- **Job:** \`${i.jobId}\``);
  lines.push(`- **Issued:** ${fmtDate(i.issuedDate)}`);
  lines.push(`- **Due:** ${fmtDate(i.dueDate)}`);
  if (i.paidDate) lines.push(`- **Paid:** ${fmtDate(i.paidDate)}`);
  lines.push(`- **Subtotal:** ${fmtMoney(i.subtotal)}`);
  lines.push(`- **Total:** ${fmtMoney(i.total)}`);
  lines.push(`- **Amount due:** ${fmtMoney(i.amountDue)}`);
  if (i.lineItems.length > 0) {
    lines.push(`\n**Line items:**`);
    lines.push(`| # | Item | Qty | Unit | Total |`);
    lines.push(`|---|------|-----|------|-------|`);
    i.lineItems.forEach((li, idx) => {
      lines.push(`| ${idx + 1} | ${li.name} | ${li.quantity} | ${fmtMoney(li.unitCost)} | ${fmtMoney(li.totalCost)} |`);
    });
  }
  return lines.join("\n");
}

export function formatQuoteDetail(q: JobberQuote): string {
  const lines: string[] = [];
  lines.push(`## Quote ${q.quoteNumber} — ${q.subject}`);
  lines.push(`- **Status:** ${q.status}`);
  lines.push(`- **Client:** ${q.clientName} _(\`${q.clientId}\`)_`);
  lines.push(`- **Created:** ${fmtDateTime(q.createdAt)}`);
  if (q.expiryDate) lines.push(`- **Expires:** ${fmtDate(q.expiryDate)}`);
  if (q.message) {
    lines.push(`\n**Message to client:**\n> ${q.message}`);
  }
  if (q.lineItems.length > 0) {
    lines.push(`\n**Line items:**`);
    lines.push(`| # | Item | Qty | Unit | Total |`);
    lines.push(`|---|------|-----|------|-------|`);
    q.lineItems.forEach((li, idx) => {
      lines.push(`| ${idx + 1} | ${li.name} | ${li.quantity} | ${fmtMoney(li.unitCost)} | ${fmtMoney(li.totalCost)} |`);
    });
    lines.push(`\n**Subtotal:** ${fmtMoney(q.subtotal)}`);
    lines.push(`**Total:** ${fmtMoney(q.total)}`);
  }
  return lines.join("\n");
}
