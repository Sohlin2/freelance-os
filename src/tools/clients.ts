import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

export function registerClientTools(server: McpServer, userId: string): void {
  // Tool 1: create_client
  server.registerTool(
    'create_client',
    {
      description:
        "Create a new client record. Use when a freelancer mentions a new client they're working with or want to track.",
      inputSchema: {
        name: z.string().min(1).describe('Client name or company name'),
        email: z.email().optional().describe('Client email address'),
        phone: z.string().optional().describe('Client phone number'),
        company: z
          .string()
          .optional()
          .describe('Company name if different from client name'),
        billing_rate: z
          .number()
          .positive()
          .optional()
          .describe('Default hourly rate'),
        currency: z
          .string()
          .length(3)
          .default('USD')
          .describe('ISO 4217 currency code'),
        notes: z
          .string()
          .optional()
          .describe('Free-form notes about this client'),
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

  // Tool 2: get_client
  server.registerTool(
    'get_client',
    {
      description:
        "Get a client's full profile including their projects and recent communications. Use when a freelancer asks about a specific client.",
      inputSchema: {
        client_id: z.string().uuid().describe('Client UUID'),
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

  // Tool 3: list_clients
  server.registerTool(
    'list_clients',
    {
      description:
        'List clients with optional search and filters. Use when a freelancer wants to see their clients or find a specific one.',
      inputSchema: {
        search: z
          .string()
          .optional()
          .describe('Search clients by name (partial match)'),
        sort_by: z
          .enum(['name', 'created_at', 'updated_at', 'billing_rate'])
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

  // Tool 4: update_client
  server.registerTool(
    'update_client',
    {
      description:
        "Update an existing client's information. Use when a freelancer wants to change a client's details.",
      inputSchema: {
        client_id: z.string().uuid().describe('Client UUID to update'),
        name: z.string().min(1).optional().describe('Updated client name'),
        email: z.email().optional().nullable().describe('Updated email'),
        phone: z.string().optional().nullable().describe('Updated phone'),
        company: z.string().optional().nullable().describe('Updated company'),
        billing_rate: z
          .number()
          .positive()
          .optional()
          .nullable()
          .describe('Updated hourly rate'),
        currency: z
          .string()
          .length(3)
          .optional()
          .describe('Updated currency code'),
        notes: z.string().optional().nullable().describe('Updated notes'),
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

  // Tool 5: archive_client
  server.registerTool(
    'archive_client',
    {
      description:
        'Archive a client (soft delete). Use when a freelancer is done working with a client but wants to keep records.',
      inputSchema: {
        client_id: z.string().uuid().describe('Client UUID to archive'),
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
