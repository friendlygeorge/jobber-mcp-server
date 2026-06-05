// Shared types for the Jobber MCP server.
//
// These mirror the public shape of the Jobber GraphQL objects we expose
// through tools. They are intentionally a narrow subset of the full Jobber
// schema — just enough to be useful to an LLM agent.

export interface JobberAddress {
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface JobberClient {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  name: string; // Resolved display name (company or "First Last")
  emails: { value: string; primary: boolean }[];
  phones: { value: string; primary: boolean }[];
  billingAddress?: JobberAddress | null;
  isLead: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  totalSpent?: number | null; // Cents, populated by mock for display
  balance?: number | null; // Cents, outstanding balance
}

export interface JobberLineItem {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitCost: number; // Cents
  totalCost: number; // Cents
}

export interface JobberJob {
  id: string;
  jobNumber?: string | null;
  title: string;
  description?: string | null;
  status: "active" | "needs_action" | "complete" | "archived" | "unscheduled";
  clientId: string;
  clientName: string;
  propertyId?: string | null;
  assignedTo: { id: string; name: string }[];
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: JobberLineItem[];
  total: number; // Cents
}

export interface JobberInvoice {
  id: string;
  invoiceNumber: string;
  subject: string;
  status: "draft" | "awaiting_payment" | "paid" | "overdue" | "voided";
  clientId: string;
  clientName: string;
  jobId?: string | null;
  issuedDate: string;
  dueDate: string;
  paidDate?: string | null;
  subtotal: number; // Cents
  total: number; // Cents
  amountDue: number; // Cents
  lineItems: JobberLineItem[];
}

export interface JobberQuote {
  id: string;
  quoteNumber: string;
  subject: string;
  status: "draft" | "awaiting_response" | "approved" | "converted" | "rejected" | "expired";
  clientId: string;
  clientName: string;
  createdAt: string;
  expiryDate?: string | null;
  message?: string | null;
  lineItems: JobberLineItem[];
  subtotal: number; // Cents
  total: number; // Cents
}

export interface CreateQuoteInput {
  clientId: string;
  subject: string;
  message?: string;
  expiryDate?: string; // ISO date
  lineItems: {
    name: string;
    description?: string;
    quantity: number;
    unitCost: number; // Dollars in input, converted to cents internally
  }[];
}
