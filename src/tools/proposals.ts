import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

export function registerProposalTools(server: McpServer, userId: string): void {
  // Tool 1: proposals.records.create
  server.registerTool(
    'proposals.records.create',
    {
      description:
        'Store a new proposal for a project, capturing all relevant details such as title, deliverables, pricing, and expiry date. Use when the freelancer has drafted proposal content and wants to persist it to the database for tracking and future reference.',
      inputSchema: {
        client_id: z.string().uuid().describe('UUID of the client this proposal is being created for'),
        project_id: z.string().uuid().describe('UUID of the project this proposal is scoped and billed against'),
        title: z.string().min(1).describe('Short descriptive title that identifies the proposal at a glance'),
        content: z.string().optional().describe('Free-form proposal body describing deliverables, timeline, and terms'),
        amount: z.number().positive().optional().describe('Total monetary value being proposed for the project engagement'),
        currency: z.string().length(3).default('USD').describe('Three-letter ISO 4217 currency code for the proposal amount'),
        valid_until: z.string().date().optional().describe('Expiry date after which the proposal is no longer valid (YYYY-MM-DD)'),
      },
      annotations: {
        title: 'Proposals: Records: Create',
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
            .from('proposals')
            .insert({ ...args, user_id: userId })
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create proposal: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to create proposal: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 2: proposals.records.get
  server.registerTool(
    'proposals.records.get',
    {
      description:
        'Retrieve a single proposal by its unique identifier, returning all stored fields including status, amount, and content. Use when the freelancer asks to view, review, or reference the details of a specific proposal.',
      inputSchema: {
        proposal_id: z.string().uuid().describe('UUID of the proposal record to retrieve from the database'),
      },
      annotations: {
        title: 'Proposals: Records: Get',
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
            .from('proposals')
            .select('*')
            .eq('id', args.proposal_id)
            .is('archived_at', null)
            .single();
        });
        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: 'Proposal not found or has been archived',
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
          content: [{ type: 'text', text: `Failed to get proposal: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 3: proposals.records.list
  server.registerTool(
    'proposals.records.list',
    {
      description:
        'List proposals filtered by project, client, or status with support for sorting and pagination. Use when the freelancer asks for proposal history, wants to audit outstanding proposals, or needs to check the status of proposals sent to a client.',
      inputSchema: {
        project_id: z.string().uuid().optional().describe('Narrow results to proposals belonging to this project UUID'),
        client_id: z.string().uuid().optional().describe('Narrow results to proposals associated with this client UUID'),
        status: z
          .enum(['draft', 'sent', 'accepted', 'declined', 'expired'])
          .optional()
          .describe('Filter proposals to only those matching the given lifecycle status'),
        sort_by: z
          .enum(['created_at', 'updated_at', 'amount', 'title'])
          .default('created_at')
          .describe('Database column to use as the primary sort key for results'),
        sort_dir: z.enum(['asc', 'desc']).default('desc').describe('Direction to sort results — ascending or descending'),
        limit: z.number().int().min(1).max(100).default(20).describe('Maximum number of proposal records to return in this page'),
        offset: z.number().int().min(0).default(0).describe('Number of records to skip for cursor-based pagination'),
      },
      annotations: {
        title: 'Proposals: Records: List',
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
            .from('proposals')
            .select('*', { count: 'exact' })
            .is('archived_at', null);
          if (args.project_id) {
            query = query.eq('project_id', args.project_id);
          }
          if (args.client_id) {
            query = query.eq('client_id', args.client_id);
          }
          if (args.status) {
            query = query.eq('status', args.status);
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
                text: `Failed to list proposals: ${error.message}`,
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
                  proposals: data,
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
          content: [{ type: 'text', text: `Failed to list proposals: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 4: proposals.records.update
  server.registerTool(
    'proposals.records.update',
    {
      description:
        'Update one or more fields on an existing proposal, including content, pricing, status, or key timestamps. Use when the freelancer wants to revise proposal details, mark it as sent, or record a client response without going through the full accept flow.',
      inputSchema: {
        proposal_id: z.string().uuid().describe('UUID of the proposal record that should be updated'),
        title: z.string().min(1).optional().describe('Replacement title to give the proposal a new descriptive name'),
        content: z.string().optional().nullable().describe('Replacement body text describing deliverables, scope, and terms'),
        status: z
          .enum(['draft', 'sent', 'accepted', 'declined', 'expired'])
          .optional()
          .describe('New lifecycle status to assign to the proposal record'),
        amount: z.number().positive().optional().nullable().describe('Revised total monetary value for the project engagement'),
        currency: z.string().length(3).optional().describe('Replacement three-letter ISO 4217 currency code for the amount'),
        valid_until: z.string().date().optional().nullable().describe('New expiry date after which the proposal is no longer valid (YYYY-MM-DD)'),
        sent_at: z.string().datetime().optional().nullable().describe('ISO 8601 timestamp recording when the proposal was delivered to the client'),
        responded_at: z.string().datetime().optional().nullable().describe('ISO 8601 timestamp recording when the client replied or responded'),
      },
      annotations: {
        title: 'Proposals: Records: Update',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const { proposal_id, ...updates } = args;
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
            .from('proposals')
            .update(updateFields)
            .eq('id', proposal_id)
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to update proposal: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to update proposal: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 5: proposals.records.accept (CRITICAL transactional tool — D-04, PROP-03)
  server.registerTool(
    'proposals.records.accept',
    {
      description:
        'Mark a proposal as accepted, record the response timestamp, and automatically seed the linked project\'s scope_definitions from the proposal deliverables in a single atomic operation. Use when the freelancer confirms that a client has accepted the proposal and work is ready to begin.',
      inputSchema: {
        proposal_id: z.string().uuid().describe('UUID of the proposal that the client has agreed to accept'),
      },
      annotations: {
        title: 'Proposals: Records: Accept',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        return await withUserContext(userId, async (db) => {
          // Step 1: Fetch the proposal
          const { data: proposal, error: fetchError } = await db
            .from('proposals')
            .select('*')
            .eq('id', args.proposal_id)
            .is('archived_at', null)
            .single();

          if (fetchError || !proposal) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Proposal not found or has been archived',
                },
              ],
              isError: true,
            };
          }

          // Capture original status before update for rollback if needed
          const originalStatus = proposal.status;

          // Step 2: Update proposal status to accepted
          const { data: updatedProposal, error: updateError } = await db
            .from('proposals')
            .update({ status: 'accepted', responded_at: new Date().toISOString() })
            .eq('id', args.proposal_id)
            .select()
            .single();

          if (updateError || !updatedProposal) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to accept proposal: ${updateError?.message ?? 'Update failed'}`,
                },
              ],
              isError: true,
            };
          }

          // Step 3: Upsert scope_definitions seeded from proposal content
          const { data: scopeData, error: scopeError } = await db
            .from('scope_definitions')
            .upsert(
              {
                project_id: proposal.project_id,
                user_id: userId,
                deliverables: proposal.content ?? '',
              },
              { onConflict: 'project_id' }
            )
            .select()
            .single();

          if (scopeError) {
            // Rollback: restore proposal to original status since scope seeding failed
            await db
              .from('proposals')
              .update({ status: originalStatus, responded_at: null })
              .eq('id', args.proposal_id);

            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to accept proposal: scope seeding failed (${scopeError.message}). Proposal status rolled back to '${originalStatus}'.`,
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
                    proposal: updatedProposal,
                    scope: scopeData,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Failed to accept proposal: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
