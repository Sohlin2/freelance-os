import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

const FOLLOW_UP_TYPE_ENUM = [
  'proposal_follow_up',
  'invoice_overdue',
  'check_in',
  'awaiting_response',
  'other',
] as const;

export function registerFollowUpTools(server: McpServer, userId: string): void {
  // Tool 1: followups.messages.create
  server.registerTool(
    'followups.messages.create',
    {
      description:
        'Store a drafted follow-up message in the FreelanceOS database. Use when the freelancer has composed a follow-up and wants to save it for tracking purposes before or after sending it to the client.',
      inputSchema: {
        client_id: z
          .string()
          .uuid()
          .describe('UUID of the client this follow-up message is addressed to'),
        project_id: z
          .string()
          .uuid()
          .optional()
          .describe('UUID of the specific project this follow-up is related to, if applicable'),
        type: z
          .enum(FOLLOW_UP_TYPE_ENUM)
          .default('check_in')
          .describe(
            'Category of follow-up: proposal_follow_up, invoice_overdue, check_in, awaiting_response, or other'
          ),
        subject: z
          .string()
          .min(1)
          .describe('Subject line or brief title summarizing the purpose of this follow-up message'),
        content: z
          .string()
          .min(1)
          .describe('Full body text of the follow-up message to be saved and potentially sent'),
      },
      annotations: {
        title: 'Follow-ups: Messages: Create',
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
            .from('follow_ups')
            .insert({ ...args, user_id: userId })
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create follow-up: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to create follow-up: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 2: followups.messages.get
  server.registerTool(
    'followups.messages.get',
    {
      description:
        'Retrieve a single follow-up record by its unique ID. Use when the freelancer asks to view the full details of a specific saved follow-up, including its content, type, and sent status.',
      inputSchema: {
        followup_id: z
          .string()
          .uuid()
          .describe('Unique UUID identifier of the follow-up record to retrieve'),
      },
      annotations: {
        title: 'Follow-ups: Messages: Get',
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
            .from('follow_ups')
            .select('*')
            .eq('id', args.followup_id)
            .is('archived_at', null)
            .single();
        });
        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: 'Follow-up not found or has been archived',
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
          content: [{ type: 'text', text: `Failed to get follow-up: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 3: followups.messages.list
  server.registerTool(
    'followups.messages.list',
    {
      description:
        'List and filter follow-up records for a client or project with pagination support. Use when the freelancer asks to review follow-up history, check outstanding drafts, or audit all sent communications for a given client.',
      inputSchema: {
        client_id: z
          .string()
          .uuid()
          .optional()
          .describe('UUID of the client whose follow-ups should be returned'),
        project_id: z
          .string()
          .uuid()
          .optional()
          .describe('UUID of the project to narrow results to follow-ups for that project'),
        type: z
          .enum(FOLLOW_UP_TYPE_ENUM)
          .optional()
          .describe(
            'Filter results to a specific follow-up category such as invoice_overdue or check_in'
          ),
        sent: z
          .boolean()
          .optional()
          .describe(
            'Pass true to return only sent follow-ups, false to return only unsent drafts'
          ),
        sort_by: z
          .enum(['created_at', 'sent_at'])
          .default('created_at')
          .describe('Database column to use when ordering the returned follow-up records'),
        sort_dir: z
          .enum(['asc', 'desc'])
          .default('desc')
          .describe('Direction to sort results — asc for oldest first, desc for newest first'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe('Maximum number of follow-up records to return in a single response'),
        offset: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe('Number of records to skip for cursor-based pagination through large result sets'),
      },
      annotations: {
        title: 'Follow-ups: Messages: List',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const { data, error, count } = await withUserContext(userId, async (db) => {
          let query = db
            .from('follow_ups')
            .select('*', { count: 'exact' })
            .is('archived_at', null);

          if (args.client_id) {
            query = query.eq('client_id', args.client_id);
          }
          if (args.project_id) {
            query = query.eq('project_id', args.project_id);
          }
          if (args.type) {
            query = query.eq('type', args.type);
          }
          if (args.sent === true) {
            query = query.not('sent_at', 'is', null);
          } else if (args.sent === false) {
            query = query.is('sent_at', null);
          }

          return query
            .order(args.sort_by, { ascending: args.sort_dir === 'asc' })
            .range(args.offset, args.offset + args.limit - 1);
        });

        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to list follow-ups: ${error.message}`,
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
                  follow_ups: data,
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
          content: [{ type: 'text', text: `Failed to list follow-ups: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 4: followups.messages.update
  server.registerTool(
    'followups.messages.update',
    {
      description:
        "Update the content or metadata of an existing follow-up record. Use when the freelancer wants to revise a drafted follow-up's subject, body, type, or project association before sending it to the client.",
      inputSchema: {
        followup_id: z
          .string()
          .uuid()
          .describe('Unique UUID of the follow-up record that should be updated'),
        subject: z
          .string()
          .min(1)
          .optional()
          .describe('Replacement subject line to overwrite the existing follow-up subject'),
        content: z
          .string()
          .min(1)
          .optional()
          .describe('Replacement message body text to overwrite the existing follow-up content'),
        type: z
          .enum(FOLLOW_UP_TYPE_ENUM)
          .optional()
          .describe(
            'New category to assign this follow-up, such as changing check_in to invoice_overdue'
          ),
        project_id: z
          .string()
          .uuid()
          .optional()
          .nullable()
          .describe(
            'UUID of a project to associate with this follow-up, or null to remove the project link'
          ),
      },
      annotations: {
        title: 'Follow-ups: Messages: Update',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const { followup_id, ...updates } = args;
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
            .from('follow_ups')
            .update(updateFields)
            .eq('id', followup_id)
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to update follow-up: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to update follow-up: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 5: mark_followup_sent
  server.registerTool(
    'followups.sent.mark',
    {
      description:
        'Record the current timestamp as the sent date on a follow-up, transitioning it from draft to sent status. Use when the freelancer confirms they have actually sent the follow-up message to the client outside of FreelanceOS.',
      inputSchema: {
        followup_id: z
          .string()
          .uuid()
          .describe(
            'Unique UUID of the follow-up record that the freelancer has just sent to the client'
          ),
      },
      annotations: {
        title: 'Follow-ups: Sent: Mark',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const { data, error } = await withUserContext(userId, async (db) => {
          return db
            .from('follow_ups')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', args.followup_id)
            .is('sent_at', null)
            .select()
            .single();
        });
        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: 'Follow-up not found or already marked as sent',
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
              text: `Failed to mark follow-up as sent: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool 6: get_followup_context
  server.registerTool(
    'followups.context.get',
    {
      description:
        'Fetch all relevant context needed to draft an effective follow-up for a client, including outstanding invoices, recent follow-up history, and client contact details. Always call this tool before followups.create so the drafted message is informed by the client\'s current account status.',
      inputSchema: {
        client_id: z
          .string()
          .uuid()
          .describe(
            'UUID of the client for whom follow-up context — invoices, prior messages, contact info — should be assembled'
          ),
        project_id: z
          .string()
          .uuid()
          .optional()
          .describe(
            'UUID of a specific project to restrict invoice context to that project only, rather than all client invoices'
          ),
      },
      annotations: {
        title: 'Follow-ups: Context: Get',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const result = await withUserContext(userId, async (db) => {
          // Three parallel queries for client context
          const clientQuery = db
            .from('clients')
            .select('id, name, email, company')
            .eq('id', args.client_id)
            .single();

          let invoiceQuery = db
            .from('invoices')
            .select('id, invoice_number, status, total, currency, due_date, issued_at')
            .eq('client_id', args.client_id)
            .is('archived_at', null)
            .in('status', ['sent', 'overdue']);

          if (args.project_id) {
            invoiceQuery = invoiceQuery.eq('project_id', args.project_id);
          }

          const followUpQuery = db
            .from('follow_ups')
            .select('id, type, subject, sent_at, created_at')
            .eq('client_id', args.client_id)
            .is('archived_at', null)
            .order('created_at', { ascending: false })
            .limit(5);

          const [clientResult, invoicesResult, followUpsResult] = await Promise.all([
            clientQuery,
            invoiceQuery,
            followUpQuery,
          ]);

          return { clientResult, invoicesResult, followUpsResult };
        });

        const { clientResult, invoicesResult, followUpsResult } = result as {
          clientResult: { data: unknown; error: unknown };
          invoicesResult: { data: unknown; error: unknown };
          followUpsResult: { data: unknown; error: unknown };
        };

        if (clientResult.error || !clientResult.data) {
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
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  client: clientResult.data,
                  outstanding_invoices: invoicesResult.data ?? [],
                  recent_follow_ups: followUpsResult.data ?? [],
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
          content: [
            {
              type: 'text',
              text: `Failed to get follow-up context: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
