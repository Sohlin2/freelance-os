import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

const lineItemSchema = z.object({
  description: z.string().describe('Line item description'),
  quantity: z.number().describe('Quantity'),
  unit: z.string().describe('Unit (e.g. hours, project)'),
  rate: z.number().describe('Rate per unit'),
  amount: z.number().describe('Total amount for this line item'),
});

export function registerInvoiceTools(server: McpServer, userId: string): void {
  // Tool 1: create_invoice
  server.registerTool(
    'create_invoice',
    {
      description:
        'Store a new invoice with line items and totals. Use when the freelancer wants to generate and save an invoice for a project.',
      inputSchema: {
        client_id: z.string().uuid().describe('Client UUID'),
        project_id: z.string().uuid().describe('Project UUID'),
        invoice_number: z.string().min(1).describe('Invoice number (e.g. INV-001)'),
        proposal_id: z
          .string()
          .uuid()
          .optional()
          .nullable()
          .describe('Optional proposal UUID this invoice is based on'),
        line_items: z
          .array(lineItemSchema)
          .default([])
          .describe('Array of line items'),
        subtotal: z.number().default(0).describe('Subtotal before tax'),
        tax_rate: z
          .number()
          .optional()
          .nullable()
          .describe('Tax rate as a decimal (e.g. 0.1 for 10%)'),
        tax_amount: z.number().default(0).describe('Calculated tax amount'),
        total: z.number().default(0).describe('Total including tax'),
        currency: z
          .string()
          .length(3)
          .default('USD')
          .describe('ISO 4217 currency code'),
        due_date: z
          .string()
          .optional()
          .nullable()
          .describe('Due date (YYYY-MM-DD)'),
        issued_at: z
          .string()
          .optional()
          .nullable()
          .describe('Issue date (ISO datetime)'),
        notes: z.string().optional().nullable().describe('Additional notes'),
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

  // Tool 2: get_invoice
  server.registerTool(
    'get_invoice',
    {
      description:
        'Retrieve a single invoice by ID. Use when the freelancer asks to view a specific invoice.',
      inputSchema: {
        invoice_id: z.string().uuid().describe('Invoice UUID'),
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

  // Tool 3: list_invoices
  server.registerTool(
    'list_invoices',
    {
      description:
        'List invoices filtered by status, client, or date range. Use when the freelancer asks about outstanding, paid, or overdue invoices.',
      inputSchema: {
        status: z
          .enum(['draft', 'sent', 'paid', 'overdue', 'void'])
          .optional()
          .describe('Filter by invoice status'),
        client_id: z
          .string()
          .uuid()
          .optional()
          .describe('Filter by client UUID'),
        project_id: z
          .string()
          .uuid()
          .optional()
          .describe('Filter by project UUID'),
        date_from: z
          .string()
          .optional()
          .describe('Filter issued_at >= date (YYYY-MM-DD)'),
        date_to: z
          .string()
          .optional()
          .describe('Filter issued_at <= date (YYYY-MM-DD)'),
        sort_by: z
          .enum(['created_at', 'due_date', 'total', 'invoice_number'])
          .default('created_at')
          .describe('Field to sort by'),
        sort_dir: z
          .enum(['asc', 'desc'])
          .default('desc')
          .describe('Sort direction'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe('Number of results'),
        offset: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe('Pagination offset'),
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

  // Tool 4: update_invoice
  server.registerTool(
    'update_invoice',
    {
      description:
        'Update invoice fields or status. Use when the freelancer marks an invoice as sent, paid, or overdue.',
      inputSchema: {
        invoice_id: z.string().uuid().describe('Invoice UUID to update'),
        status: z
          .enum(['draft', 'sent', 'paid', 'overdue', 'void'])
          .optional()
          .describe('Updated invoice status'),
        line_items: z
          .array(lineItemSchema)
          .optional()
          .describe('Updated line items'),
        subtotal: z.number().optional().describe('Updated subtotal'),
        tax_rate: z
          .number()
          .optional()
          .nullable()
          .describe('Updated tax rate'),
        tax_amount: z.number().optional().describe('Updated tax amount'),
        total: z.number().optional().describe('Updated total'),
        due_date: z
          .string()
          .optional()
          .nullable()
          .describe('Updated due date'),
        issued_at: z
          .string()
          .optional()
          .nullable()
          .describe('Updated issue date'),
        paid_at: z
          .string()
          .optional()
          .nullable()
          .describe('Date invoice was paid'),
        notes: z
          .string()
          .optional()
          .nullable()
          .describe('Updated notes'),
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
