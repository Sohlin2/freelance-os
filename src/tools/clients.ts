import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

export function registerClientTools(server: McpServer, userId: string): void {
  // Tool 1: clients.create
  server.registerTool(
    'clients.create',
    {
      description:
        "Create a new client record in the FreelanceOS database. Use this tool whenever a freelancer mentions a new client they're starting to work with or want to begin tracking — capturing contact details and default billing rate upfront saves time when creating projects and invoices later.",
      inputSchema: {
        name: z.string().min(1).describe('Full name or company name of the client (required)'),
        email: z.email().optional().describe('Primary email address used to contact this client'),
        phone: z.string().optional().describe('Phone number for the client, including country code if international'),
        company: z
          .string()
          .optional()
          .describe('Company or organisation name if different from the individual contact name'),
        billing_rate: z
          .number()
          .positive()
          .optional()
          .describe('Default hourly billing rate for this client, used as the fallback when creating time entries and invoices'),
        currency: z
          .string()
          .length(3)
          .default('USD')
          .describe('ISO 4217 three-letter currency code for all monetary amounts billed to this client (e.g. USD, EUR, GBP)'),
        notes: z
          .string()
          .optional()
          .describe('Free-form notes about this client such as communication preferences, contract terms, or background context'),
      },
      annotations: {
        title: 'Clients: Create',
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
            .from('clients')
            .insert({ ...args, user_id: userId })
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create client: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to create client: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 2: clients.get
  server.registerTool(
    'clients.get',
    {
      description:
        "Retrieve the full profile for a single client, including all associated projects and follow-up communications. Use this tool when a freelancer asks about a specific client by name or ID, or when you need complete client context before drafting a proposal, invoice, or follow-up.",
      inputSchema: {
        client_id: z.string().uuid().describe('The unique identifier (UUID) of the client to retrieve'),
      },
      annotations: {
        title: 'Clients: Get',
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
            .from('clients')
            .select(
              `*, projects(id, name, status, start_date, end_date, budget, currency, created_at, archived_at), follow_ups(id, subject, type, sent_at, created_at)`
            )
            .eq('id', args.client_id)
            .is('archived_at', null)
            .single();
        });
        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: 'Client not found or has been archived',
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
          content: [{ type: 'text', text: `Failed to get client: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 3: clients.list
  server.registerTool(
    'clients.list',
    {
      description:
        'List all active (non-archived) clients with optional name search, sorting, and pagination. Use this tool when a freelancer wants an overview of their client roster, needs to look up a client by name, or when you need to present a list of clients for the user to choose from.',
      inputSchema: {
        search: z
          .string()
          .optional()
          .describe('Partial name string to filter clients by — performs a case-insensitive substring match on the client name field'),
        sort_by: z
          .enum(['name', 'created_at', 'updated_at', 'billing_rate'])
          .default('created_at')
          .describe('The client field to sort results by: name (alphabetical), created_at (when added), updated_at (recently modified), or billing_rate'),
        sort_dir: z
          .enum(['asc', 'desc'])
          .default('desc')
          .describe('Sort direction: asc for ascending (A→Z, oldest first) or desc for descending (Z→A, newest first)'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe('Maximum number of client records to return in a single response (1–100)'),
        offset: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe('Number of records to skip before returning results, used for paginating through large client lists'),
      },
      annotations: {
        title: 'Clients: List',
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
              .from('clients')
              .select('*', { count: 'exact' })
              .is('archived_at', null);
            if (args.search) {
              query = query.ilike('name', `%${args.search}%`);
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
                text: `Failed to list clients: ${error.message}`,
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
                  clients: data,
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
          content: [{ type: 'text', text: `Failed to list clients: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 4: clients.update
  server.registerTool(
    'clients.update',
    {
      description:
        "Update one or more fields on an existing client record. Use this tool when a freelancer wants to correct contact details, change a billing rate, update notes, or make any other modification to a client's stored information — only the fields you provide will be changed, all others remain untouched.",
      inputSchema: {
        client_id: z.string().uuid().describe('The unique identifier (UUID) of the client record to update'),
        name: z.string().min(1).optional().describe('New full name or company name to replace the existing client name'),
        email: z.email().optional().nullable().describe('New primary email address for the client, or null to clear it'),
        phone: z.string().optional().nullable().describe('New phone number for the client, or null to clear it'),
        company: z.string().optional().nullable().describe('New company or organisation name, or null to clear it'),
        billing_rate: z
          .number()
          .positive()
          .optional()
          .nullable()
          .describe('New default hourly billing rate for this client, or null to clear it'),
        currency: z
          .string()
          .length(3)
          .optional()
          .describe('New ISO 4217 three-letter currency code to use for this client\'s billing (e.g. USD, EUR, GBP)'),
        notes: z.string().optional().nullable().describe('New free-form notes to replace the existing notes, or null to clear them'),
      },
      annotations: {
        title: 'Clients: Update',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const { client_id, ...updates } = args;
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
            .from('clients')
            .update(updateFields)
            .eq('id', client_id)
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to update client: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to update client: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 5: clients.archive
  server.registerTool(
    'clients.archive',
    {
      description:
        'Soft-delete a client by setting their archived_at timestamp, hiding them from all active client lists while preserving their full history. Use this tool when a freelancer is done working with a client and wants to retire the record — the client and all linked projects, invoices, and follow-ups remain in the database and can be audited, but will no longer appear in normal queries.',
      inputSchema: {
        client_id: z.string().uuid().describe('The unique identifier (UUID) of the client to archive'),
      },
      annotations: {
        title: 'Clients: Archive',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const { data, error } = await withUserContext(userId, async (db) => {
          return db
            .from('clients')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', args.client_id)
            .is('archived_at', null)
            .select()
            .single();
        });
        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: 'Failed to archive client: client not found or already archived',
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
          content: [
            {
              type: 'text',
              text: `Failed to archive client: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
