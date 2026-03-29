import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

const lineItemSchema = z.object({
  description: z.string().describe('Human-readable label for this billable line item, e.g. "Website design – homepage"'),
  quantity: z.number().describe('Number of units delivered for this line item, e.g. 8 for 8 hours'),
  unit: z.string().describe('Unit of measure for the quantity field, e.g. "hours", "days", or "project"'),
  rate: z.number().describe('Price charged per single unit in the invoice currency, e.g. 150.00 for $150/hr'),
  amount: z.number().describe('Pre-calculated total for this line item (quantity × rate), used for display and subtotal roll-up'),
});

export function registerInvoiceTools(server: McpServer, userId: string): void {
  // Tool 1: invoices.records.create
  server.registerTool(
    'invoices.records.create',
    {
      description:
        'Create and persist a new invoice with line items, tax, and totals in the FreelanceOS database. Use when the freelancer wants to generate and save a billable invoice for a completed or ongoing project.',
      inputSchema: {
        client_id: z.string().uuid().describe('UUID of the client being billed; must match an existing client record'),
        project_id: z.string().uuid().describe('UUID of the project this invoice covers; used to group invoices by engagement'),
        invoice_number: z.string().min(1).describe('Unique human-readable invoice identifier shown on the document, e.g. INV-001'),
        proposal_id: z
          .string()
          .uuid()
          .optional()
          .nullable()
          .describe('UUID of the originating proposal if this invoice was generated from an approved proposal'),
        line_items: z
          .array(lineItemSchema)
          .default([])
          .describe('Ordered list of billable line items that make up the body of the invoice'),
        subtotal: z.number().default(0).describe('Sum of all line item amounts before tax is applied, in the invoice currency'),
        tax_rate: z
          .number()
          .optional()
          .nullable()
          .describe('Applicable tax rate expressed as a decimal fraction, e.g. 0.1 for 10% GST or sales tax'),
        tax_amount: z.number().default(0).describe('Calculated tax value derived from subtotal × tax_rate, in the invoice currency'),
        total: z.number().default(0).describe('Final amount due including subtotal and tax, in the invoice currency'),
        currency: z
          .string()
          .length(3)
          .default('USD')
          .describe('Three-letter ISO 4217 currency code for all monetary values on this invoice, e.g. USD, EUR, GBP'),
        due_date: z
          .string()
          .optional()
          .nullable()
          .describe('Payment deadline for the invoice formatted as YYYY-MM-DD, e.g. 2026-04-30'),
        issued_at: z
          .string()
          .optional()
          .nullable()
          .describe('ISO 8601 datetime when the invoice was formally issued to the client, defaults to now if omitted'),
        notes: z.string().optional().nullable().describe('Optional freeform notes or payment instructions to include on the invoice'),
      },
      annotations: {
        title: 'Invoices: Records: Create',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const { data, error } = await withUserContext(userId, async (db) => {
          return db
            .from('invoices')
            .insert({ ...args, user_id: userId })
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create invoice: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Failed to create invoice: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 2: invoices.records.get
  server.registerTool(
    'invoices.records.get',
    {
      description:
        'Retrieve the full details of a single invoice by its UUID. Use when the freelancer asks to view, review, or share the details of a specific invoice.',
      inputSchema: {
        invoice_id: z.string().uuid().describe('UUID of the invoice to retrieve; must reference a non-archived invoice owned by this user'),
      },
      annotations: {
        title: 'Invoices: Records: Get',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const { data, error } = await withUserContext(userId, async (db) => {
          return db
            .from('invoices')
            .select('*')
            .eq('id', args.invoice_id)
            .is('archived_at', null)
            .single();
        });
        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: 'Invoice not found or has been archived',
              },
            ],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Failed to get invoice: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 3: invoices.records.list
  server.registerTool(
    'invoices.records.list',
    {
      description:
        'Return a paginated, filtered list of invoices for the authenticated freelancer. Use when the freelancer asks about outstanding, paid, overdue, or draft invoices, or wants a revenue summary for a date range.',
      inputSchema: {
        status: z
          .enum(['draft', 'sent', 'paid', 'overdue', 'void'])
          .optional()
          .describe('Restrict results to invoices with this specific lifecycle status, e.g. "overdue" to surface unpaid past-due invoices'),
        client_id: z
          .string()
          .uuid()
          .optional()
          .describe('Restrict results to invoices belonging to this specific client UUID'),
        project_id: z
          .string()
          .uuid()
          .optional()
          .describe('Restrict results to invoices associated with this specific project UUID'),
        date_from: z
          .string()
          .optional()
          .describe('Return only invoices issued on or after this date, formatted as YYYY-MM-DD'),
        date_to: z
          .string()
          .optional()
          .describe('Return only invoices issued on or before this date, formatted as YYYY-MM-DD'),
        sort_by: z
          .enum(['created_at', 'due_date', 'total', 'invoice_number'])
          .default('created_at')
          .describe('Database column used to order the result set before pagination is applied'),
        sort_dir: z
          .enum(['asc', 'desc'])
          .default('desc')
          .describe('Direction of the sort: "asc" for oldest/lowest first, "desc" for newest/highest first'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe('Maximum number of invoice records to return in a single page, between 1 and 100'),
        offset: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe('Zero-based index of the first record to return, used for paginating through large result sets'),
      },
      annotations: {
        title: 'Invoices: Records: List',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const { data, error, count } = await withUserContext(
          userId,
          async (db) => {
            let query = db
              .from('invoices')
              .select('*', { count: 'exact' })
              .is('archived_at', null);

            if (args.status) {
              query = query.eq('status', args.status);
            }
            if (args.client_id) {
              query = query.eq('client_id', args.client_id);
            }
            if (args.project_id) {
              query = query.eq('project_id', args.project_id);
            }
            if (args.date_from) {
              query = query.gte('issued_at', args.date_from);
            }
            if (args.date_to) {
              query = query.lte('issued_at', args.date_to);
            }

            return query
              .order(args.sort_by, { ascending: args.sort_dir === 'asc' })
              .range(args.offset, args.offset + args.limit - 1);
          }
        );
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to list invoices: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  invoices: data,
                  total: count,
                  limit: args.limit,
                  offset: args.offset,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Failed to list invoices: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 4: invoices.records.update
  server.registerTool(
    'invoices.records.update',
    {
      description:
        'Update one or more fields on an existing invoice, including its status or financial totals. Use when the freelancer marks an invoice as sent, records a payment, corrects line items, or changes the due date.',
      inputSchema: {
        invoice_id: z.string().uuid().describe('UUID of the invoice to update; must reference an existing invoice owned by this user'),
        status: z
          .enum(['draft', 'sent', 'paid', 'overdue', 'void'])
          .optional()
          .describe('New lifecycle status for the invoice, e.g. "paid" when the client has settled the balance'),
        line_items: z
          .array(lineItemSchema)
          .optional()
          .describe('Replacement array of billable line items that fully overwrites the existing line items on the invoice'),
        subtotal: z.number().optional().describe('Revised sum of all line item amounts before tax, in the invoice currency'),
        tax_rate: z
          .number()
          .optional()
          .nullable()
          .describe('Revised tax rate as a decimal fraction, e.g. 0.15 for 15%; set to null to remove tax'),
        tax_amount: z.number().optional().describe('Revised calculated tax value derived from the updated subtotal and tax rate'),
        total: z.number().optional().describe('Revised final amount due including subtotal and tax, in the invoice currency'),
        due_date: z
          .string()
          .optional()
          .nullable()
          .describe('Revised payment deadline formatted as YYYY-MM-DD; set to null to remove the due date'),
        issued_at: z
          .string()
          .optional()
          .nullable()
          .describe('Revised ISO 8601 datetime when the invoice was formally issued to the client'),
        paid_at: z
          .string()
          .optional()
          .nullable()
          .describe('ISO 8601 datetime when payment was received; set when marking an invoice as paid'),
        notes: z
          .string()
          .optional()
          .nullable()
          .describe('Revised freeform notes or payment instructions to display on the invoice; set to null to clear'),
      },
      annotations: {
        title: 'Invoices: Records: Update',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const { invoice_id, ...updates } = args;
        const updateFields = Object.fromEntries(
          Object.entries(updates).filter(([, v]) => v !== undefined)
        );
        if (Object.keys(updateFields).length === 0) {
          return {
            content: [{ type: 'text', text: 'No fields to update' }],
            isError: true,
          };
        }
        const { data, error } = await withUserContext(userId, async (db) => {
          return db
            .from('invoices')
            .update(updateFields)
            .eq('id', invoice_id)
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to update invoice: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Failed to update invoice: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
