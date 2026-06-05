// Thin wrapper around the Jobber GraphQL API. Uses graphql-request for the
// HTTP plumbing and centralizes auth + error handling.
//
// In mock mode, all methods short-circuit to the in-memory mock store so the
// server is fully runnable without a Jobber account (handy for demos and CI).

import { GraphQLClient, gql } from "graphql-request";
import type { AppConfig } from "./config.js";
import { mockStore } from "./mock-data.js";
import type {
  CreateQuoteInput,
  JobberClient,
  JobberInvoice,
  JobberJob,
  JobberQuote,
} from "./types.js";

export class JobberApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly graphqlErrors?: unknown,
  ) {
    super(message);
    this.name = "JobberApiError";
  }
}

export class JobberApi {
  private readonly config: AppConfig;
  private readonly http: GraphQLClient;

  constructor(config: AppConfig) {
    this.config = config;
    this.http = new GraphQLClient(this.config.apiUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: this.config.accessToken
          ? `Bearer ${this.config.accessToken}`
          : "",
        "X-JOBBER-GRAPHQL-VERSION": "2025-01-01",
      },
    });
  }

  // ---- Clients -----------------------------------------------------------

  async listClients(filter: { search?: string; isLead?: boolean; limit?: number } = {}): Promise<JobberClient[]> {
    if (this.config.mockMode) return mockStore.listClients(filter);
    if (!this.config.accessToken) {
      throw new JobberApiError("Missing JOBBER_ACCESS_TOKEN (or enable JOBBER_MOCK_MODE=true).");
    }
    const query = gql`
      query ListClients($search: String, $isLead: Boolean, $first: Int) {
        clients(searchTerm: $search, first: $first) {
          nodes {
            id
            firstName
            lastName
            companyName
            isLead
            isArchived
            createdAt
            updatedAt
            emails { value primary }
            phones { value primary }
            billingAddress { street1 street2 city province postalCode country }
          }
        }
      }
    `;
    try {
      const data = await this.http.request<{ clients: { nodes: any[] } }>(query, {
        search: filter.search ?? null,
        isLead: filter.isLead ?? null,
        first: filter.limit ?? 50,
      });
      return data.clients.nodes.map(this.normalizeClient).filter((c) =>
        filter.isLead === undefined ? true : c.isLead === filter.isLead,
      );
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async getClient(id: string): Promise<JobberClient | null> {
    if (this.config.mockMode) return mockStore.getClient(id) ?? null;
    const query = gql`
      query GetClient($id: EncryptedId!) {
        client(id: $id) {
          id
          firstName
          lastName
          companyName
          isLead
          isArchived
          createdAt
          updatedAt
          emails { value primary }
          phones { value primary }
          billingAddress { street1 street2 city province postalCode country }
        }
      }
    `;
    try {
      const data = await this.http.request<{ client: any }>(query, { id });
      return data.client ? this.normalizeClient(data.client) : null;
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  // ---- Jobs --------------------------------------------------------------

  async getJob(id: string): Promise<JobberJob | null> {
    if (this.config.mockMode) return mockStore.getJob(id) ?? null;
    const query = gql`
      query GetJob($id: EncryptedId!) {
        job(id: $id) {
          id
          jobNumber
          title
          description
          status
          startDate
          endDate
          createdAt
          updatedAt
          client { id name }
          assignedTo { id name }
          lineItems {
            id
            name
            description
            quantity
            unitCost
            totalCost
          }
        }
      }
    `;
    try {
      const data = await this.http.request<{ job: any }>(query, { id });
      return data.job ? this.normalizeJob(data.job) : null;
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async listJobsForClient(clientId: string): Promise<JobberJob[]> {
    if (this.config.mockMode) return mockStore.listJobsForClient(clientId);
    const query = gql`
      query ListJobsForClient($clientId: EncryptedId!) {
        jobs(filter: { clientId: $clientId }) {
          nodes {
            id
            jobNumber
            title
            status
            startDate
            endDate
            client { id name }
          }
        }
      }
    `;
    try {
      const data = await this.http.request<{ jobs: { nodes: any[] } }>(query, { clientId });
      return data.jobs.nodes.map(this.normalizeJob);
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  // ---- Invoices ----------------------------------------------------------

  async getInvoice(id: string): Promise<JobberInvoice | null> {
    if (this.config.mockMode) return mockStore.getInvoice(id) ?? null;
    const query = gql`
      query GetInvoice($id: EncryptedId!) {
        invoice(id: $id) {
          id
          invoiceNumber
          subject
          status
          issuedDate
          dueDate
          paidDate
          subtotal
          total
          amountDue
          client { id name }
          job { id }
          lineItems {
            id
            name
            description
            quantity
            unitCost
            totalCost
          }
        }
      }
    `;
    try {
      const data = await this.http.request<{ invoice: any }>(query, { id });
      return data.invoice ? this.normalizeInvoice(data.invoice) : null;
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async listInvoices(filter: { clientId?: string; status?: JobberInvoice["status"] } = {}): Promise<JobberInvoice[]> {
    if (this.config.mockMode) return mockStore.listInvoices(filter);
    const query = gql`
      query ListInvoices($clientId: EncryptedId, $status: InvoiceStatus) {
        invoices(filter: { clientId: $clientId, status: $status }) {
          nodes {
            id
            invoiceNumber
            subject
            status
            issuedDate
            dueDate
            paidDate
            subtotal
            total
            amountDue
            client { id name }
            job { id }
          }
        }
      }
    `;
    try {
      const data = await this.http.request<{ invoices: { nodes: any[] } }>(query, {
        clientId: filter.clientId ?? null,
        status: filter.status ?? null,
      });
      return data.invoices.nodes.map(this.normalizeInvoice);
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  // ---- Quotes ------------------------------------------------------------

  async createQuote(input: CreateQuoteInput): Promise<JobberQuote> {
    if (this.config.mockMode) return mockStore.createQuote(input);
    const mutation = gql`
      mutation CreateQuote($input: QuoteCreateInput!) {
        quoteCreate(input: $input) {
          quote {
            id
            quoteNumber
            subject
            status
            createdAt
            expiryDate
            message
            subtotal
            total
            client { id name }
            lineItems {
              id
              name
              description
              quantity
              unitCost
              totalCost
            }
          }
          userErrors { message path }
        }
      }
    `;
    const variables = {
      input: {
        clientId: input.clientId,
        subject: input.subject,
        message: input.message ?? null,
        expiryDate: input.expiryDate ?? null,
        lineItems: input.lineItems.map((li) => ({
          name: li.name,
          description: li.description ?? null,
          quantity: li.quantity,
          unitCost: Math.round(li.unitCost * 100), // dollars -> cents
        })),
      },
    };
    try {
      const data = await this.http.request<{ quoteCreate: { quote: any; userErrors: any[] } }>(
        mutation,
        variables,
      );
      const userErrors = data.quoteCreate.userErrors ?? [];
      if (userErrors.length > 0) {
        throw new JobberApiError(
          `Jobber rejected the quote: ${userErrors.map((e: any) => e.message).join("; ")}`,
          200,
          userErrors,
        );
      }
      return this.normalizeQuote(data.quoteCreate.quote);
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  // ---- Helpers -----------------------------------------------------------

  private wrapError(err: unknown): JobberApiError {
    if (err instanceof JobberApiError) return err;
    const anyErr = err as any;
    const status = anyErr?.response?.status;
    const payload = anyErr?.response?.errors ?? anyErr?.message ?? String(err);
    return new JobberApiError(
      `Jobber API request failed: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`,
      status,
      payload,
    );
  }

  private normalizeClient = (c: any): JobberClient => {
    const name =
      c.companyName?.trim() ||
      [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
      "Unnamed Client";
    return {
      id: c.id,
      firstName: c.firstName ?? null,
      lastName: c.lastName ?? null,
      companyName: c.companyName ?? null,
      name,
      emails: c.emails ?? [],
      phones: c.phones ?? [],
      billingAddress: c.billingAddress ?? null,
      isLead: !!c.isLead,
      isArchived: !!c.isArchived,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  };

  private normalizeJob = (j: any): JobberJob => {
    const lineItems = (j.lineItems ?? []).map((li: any) => ({
      id: li.id,
      name: li.name,
      description: li.description ?? null,
      quantity: li.quantity,
      unitCost: li.unitCost,
      totalCost: li.totalCost ?? li.quantity * li.unitCost,
    }));
    const total =
      j.total ??
      lineItems.reduce((acc: number, li: any) => acc + li.totalCost, 0);
    return {
      id: j.id,
      jobNumber: j.jobNumber ?? null,
      title: j.title ?? "Untitled job",
      description: j.description ?? null,
      status: j.status ?? "unscheduled",
      clientId: j.client?.id ?? "",
      clientName: j.client?.name ?? "",
      assignedTo: j.assignedTo ?? [],
      startDate: j.startDate ?? null,
      endDate: j.endDate ?? null,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
      lineItems,
      total,
    };
  };

  private normalizeInvoice = (i: any): JobberInvoice => ({
    id: i.id,
    invoiceNumber: i.invoiceNumber ?? "",
    subject: i.subject ?? "",
    status: i.status,
    clientId: i.client?.id ?? "",
    clientName: i.client?.name ?? "",
    jobId: i.job?.id ?? null,
    issuedDate: i.issuedDate,
    dueDate: i.dueDate,
    paidDate: i.paidDate ?? null,
    subtotal: i.subtotal,
    total: i.total,
    amountDue: i.amountDue,
    lineItems: (i.lineItems ?? []).map((li: any) => ({
      id: li.id,
      name: li.name,
      description: li.description ?? null,
      quantity: li.quantity,
      unitCost: li.unitCost,
      totalCost: li.totalCost ?? li.quantity * li.unitCost,
    })),
  });

  private normalizeQuote = (q: any): JobberQuote => {
    const lineItems = (q.lineItems ?? []).map((li: any) => ({
      id: li.id,
      name: li.name,
      description: li.description ?? null,
      quantity: li.quantity,
      unitCost: li.unitCost,
      totalCost: li.totalCost ?? li.quantity * li.unitCost,
    }));
    return {
      id: q.id,
      quoteNumber: q.quoteNumber ?? "",
      subject: q.subject ?? "",
      status: q.status,
      clientId: q.client?.id ?? "",
      clientName: q.client?.name ?? "",
      createdAt: q.createdAt,
      expiryDate: q.expiryDate ?? null,
      message: q.message ?? null,
      lineItems,
      subtotal: q.subtotal ?? lineItems.reduce((acc: number, li: any) => acc + li.totalCost, 0),
      total: q.total ?? lineItems.reduce((acc: number, li: any) => acc + li.totalCost, 0),
    };
  };
}
