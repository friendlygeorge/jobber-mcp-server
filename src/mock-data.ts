// Mock data backend. Used when JOBBER_MOCK_MODE=true. Returns realistic
// Jobber-shaped objects so the server is fully demoable without an account.
//
// All monetary values are stored in cents (matching Jobber's wire format).

import type {
  CreateQuoteInput,
  JobberClient,
  JobberInvoice,
  JobberJob,
  JobberQuote,
} from "./types.js";

// In-memory store. Seeded on first access.
let nextIds = { client: 100, job: 200, invoice: 300, quote: 400, line: 5000 };
const nextId = (kind: keyof typeof nextIds): string => {
  nextIds[kind] += 1;
  return `${kind}-${nextIds[kind]}`;
};

const clients: JobberClient[] = [
  {
    id: "client-101",
    firstName: "Marlene",
    lastName: "Okonkwo",
    name: "Marlene Okonkwo",
    emails: [{ value: "marlene@example.com", primary: true }],
    phones: [{ value: "+1-555-0142", primary: true }],
    billingAddress: {
      street1: "412 Birchwood Ln",
      city: "Boulder",
      province: "CO",
      postalCode: "80302",
      country: "US",
    },
    isLead: false,
    isArchived: false,
    createdAt: "2024-08-12T15:22:11Z",
    updatedAt: "2025-03-04T18:09:51Z",
    totalSpent: 4_280_00,
    balance: 0,
  },
  {
    id: "client-102",
    companyName: "Northwind Roofing LLC",
    name: "Northwind Roofing LLC",
    emails: [
      { value: "ops@northwindroofing.example", primary: true },
      { value: "billing@northwindroofing.example", primary: false },
    ],
    phones: [{ value: "+1-555-0177", primary: true }],
    billingAddress: {
      street1: "8800 W Industrial Blvd",
      city: "Denver",
      province: "CO",
      postalCode: "80221",
      country: "US",
    },
    isLead: false,
    isArchived: false,
    createdAt: "2023-11-02T12:00:00Z",
    updatedAt: "2025-05-19T09:11:22Z",
    totalSpent: 28_400_00,
    balance: 1_200_00,
  },
  {
    id: "client-103",
    firstName: "Devon",
    lastName: "Park",
    name: "Devon Park",
    emails: [{ value: "devon.park@example.com", primary: true }],
    phones: [{ value: "+1-555-0193", primary: true }],
    isLead: true,
    isArchived: false,
    createdAt: "2025-05-30T14:01:00Z",
    updatedAt: "2025-05-30T14:01:00Z",
    totalSpent: 0,
    balance: 0,
  },
];

const jobs: JobberJob[] = [
  {
    id: "job-201",
    jobNumber: "J-1042",
    title: "HVAC tune-up + filter swap",
    description: "Spring maintenance on a 3-ton heat pump system. Replace 20x25x1 filter and check refrigerant.",
    status: "active",
    clientId: "client-101",
    clientName: "Marlene Okonkwo",
    assignedTo: [{ id: "user-1", name: "Alex Reyes" }],
    startDate: "2025-06-04T13:00:00Z",
    endDate: "2025-06-04T15:00:00Z",
    createdAt: "2025-05-28T18:00:00Z",
    updatedAt: "2025-06-04T15:05:00Z",
    lineItems: [
      {
        id: "line-5010",
        name: "HVAC tune-up",
        description: "Standard 12-point inspection",
        quantity: 1,
        unitCost: 14_900,
        totalCost: 14_900,
      },
      {
        id: "line-5011",
        name: "20x25x1 filter",
        quantity: 2,
        unitCost: 2_400,
        totalCost: 4_800,
      },
    ],
    total: 19_700,
  },
  {
    id: "job-202",
    jobNumber: "J-1043",
    title: "Re-roof estimate — north slope",
    description: "Site visit for storm damage. Photograph all four slopes, check flashing around chimney.",
    status: "needs_action",
    clientId: "client-102",
    clientName: "Northwind Roofing LLC",
    assignedTo: [{ id: "user-2", name: "Priya Singh" }],
    startDate: "2025-06-06T15:00:00Z",
    createdAt: "2025-06-01T10:00:00Z",
    updatedAt: "2025-06-02T11:30:00Z",
    lineItems: [],
    total: 0,
  },
  {
    id: "job-203",
    jobNumber: "J-1039",
    title: "Annual drain cleaning (commercial kitchen)",
    description: "Hydro-jet main grease line and floor drains.",
    status: "complete",
    clientId: "client-102",
    clientName: "Northwind Roofing LLC",
    assignedTo: [{ id: "user-3", name: "Jordan Lee" }],
    startDate: "2025-05-15T09:00:00Z",
    endDate: "2025-05-15T13:00:00Z",
    createdAt: "2025-05-01T12:00:00Z",
    updatedAt: "2025-05-15T13:30:00Z",
    lineItems: [
      {
        id: "line-5020",
        name: "Hydro-jet service",
        quantity: 4,
        unitCost: 28_500,
        totalCost: 114_000,
      },
      {
        id: "line-5021",
        name: "Grease trap treatment",
        quantity: 1,
        unitCost: 8_500,
        totalCost: 8_500,
      },
    ],
    total: 122_500,
  },
];

const invoices: JobberInvoice[] = [
  {
    id: "invoice-301",
    invoiceNumber: "INV-2204",
    subject: "HVAC tune-up + filter swap",
    status: "awaiting_payment",
    clientId: "client-101",
    clientName: "Marlene Okonkwo",
    jobId: "job-201",
    issuedDate: "2025-06-04T15:30:00Z",
    dueDate: "2025-06-18T15:30:00Z",
    subtotal: 19_700,
    total: 19_700,
    amountDue: 19_700,
    lineItems: [
      {
        id: "line-5010",
        name: "HVAC tune-up",
        quantity: 1,
        unitCost: 14_900,
        totalCost: 14_900,
      },
      {
        id: "line-5011",
        name: "20x25x1 filter",
        quantity: 2,
        unitCost: 2_400,
        totalCost: 4_800,
      },
    ],
  },
  {
    id: "invoice-302",
    invoiceNumber: "INV-2187",
    subject: "Annual drain cleaning (commercial kitchen)",
    status: "paid",
    clientId: "client-102",
    clientName: "Northwind Roofing LLC",
    jobId: "job-203",
    issuedDate: "2025-05-15T14:00:00Z",
    dueDate: "2025-05-29T14:00:00Z",
    paidDate: "2025-05-22T16:11:00Z",
    subtotal: 122_500,
    total: 122_500,
    amountDue: 0,
    lineItems: [
      {
        id: "line-5020",
        name: "Hydro-jet service",
        quantity: 4,
        unitCost: 28_500,
        totalCost: 114_000,
      },
      {
        id: "line-5021",
        name: "Grease trap treatment",
        quantity: 1,
        unitCost: 8_500,
        totalCost: 8_500,
      },
    ],
  },
  {
    id: "invoice-303",
    invoiceNumber: "INV-2190",
    subject: "Emergency leak repair",
    status: "overdue",
    clientId: "client-102",
    clientName: "Northwind Roofing LLC",
    issuedDate: "2025-04-12T11:00:00Z",
    dueDate: "2025-04-26T11:00:00Z",
    subtotal: 1_200_00,
    total: 1_200_00,
    amountDue: 1_200_00,
    lineItems: [
      {
        id: "line-5030",
        name: "Emergency leak repair",
        quantity: 1,
        unitCost: 1_200_00,
        totalCost: 1_200_00,
      },
    ],
  },
];

const quotes: JobberQuote[] = [
  {
    id: "quote-401",
    quoteNumber: "Q-0071",
    subject: "Re-roof north slope — insurance scope",
    status: "awaiting_response",
    clientId: "client-102",
    clientName: "Northwind Roofing LLC",
    createdAt: "2025-06-02T16:00:00Z",
    expiryDate: "2025-07-02T16:00:00Z",
    message: "Per your request, this quote covers the north slope only and assumes 30-year architectural shingles.",
    lineItems: [
      {
        id: "line-5100",
        name: "Tear-off existing shingles",
        quantity: 18,
        unitCost: 95_00,
        totalCost: 1_710_00,
      },
      {
        id: "line-5101",
        name: "Architectural shingle install",
        quantity: 18,
        unitCost: 320_00,
        totalCost: 5_760_00,
      },
      {
        id: "line-5102",
        name: "Chimney flashing replacement",
        quantity: 1,
        unitCost: 650_00,
        totalCost: 650_00,
      },
    ],
    subtotal: 8_120_00,
    total: 8_120_00,
  },
];

export const mockStore = {
  listClients(filter: { search?: string; isLead?: boolean; limit?: number } = {}): JobberClient[] {
    let rows = [...clients];
    if (filter.isLead !== undefined) rows = rows.filter((c) => c.isLead === filter.isLead);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.emails.some((e) => e.value.toLowerCase().includes(q)),
      );
    }
    if (filter.limit) rows = rows.slice(0, filter.limit);
    return rows;
  },

  getClient(id: string): JobberClient | undefined {
    return clients.find((c) => c.id === id);
  },

  getJob(id: string): JobberJob | undefined {
    return jobs.find((j) => j.id === id);
  },

  listJobsForClient(clientId: string): JobberJob[] {
    return jobs.filter((j) => j.clientId === clientId);
  },

  getInvoice(id: string): JobberInvoice | undefined {
    return invoices.find((i) => i.id === id);
  },

  listInvoices(filter: { clientId?: string; status?: JobberInvoice["status"] } = {}): JobberInvoice[] {
    let rows = [...invoices];
    if (filter.clientId) rows = rows.filter((i) => i.clientId === filter.clientId);
    if (filter.status) rows = rows.filter((i) => i.status === filter.status);
    return rows;
  },

  createQuote(input: CreateQuoteInput): JobberQuote {
    const client = clients.find((c) => c.id === input.clientId);
    if (!client) {
      throw new Error(`Client not found: ${input.clientId}`);
    }
    const lineItems = input.lineItems.map((li) => {
      const unitCostCents = Math.round(li.unitCost * 100);
      return {
        id: nextId("line"),
        name: li.name,
        description: li.description ?? null,
        quantity: li.quantity,
        unitCost: unitCostCents,
        totalCost: unitCostCents * li.quantity,
      };
    });
    const subtotal = lineItems.reduce((acc, li) => acc + li.totalCost, 0);
    const quote: JobberQuote = {
      id: nextId("quote"),
      quoteNumber: `Q-${String(quotes.length + 72).padStart(4, "0")}`,
      subject: input.subject,
      status: "awaiting_response",
      clientId: input.clientId,
      clientName: client.name,
      createdAt: new Date().toISOString(),
      expiryDate: input.expiryDate ?? null,
      message: input.message ?? null,
      lineItems,
      subtotal,
      total: subtotal,
    };
    quotes.push(quote);
    return quote;
  },
};
