import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

export function registerProposalTools(server: McpServer, userId: string): void {
  // Tool 1: create_proposal
  server.registerTool(
    'create_proposal',
    {
      description:
        'Store a new proposal for a project. Use when the freelancer has drafted proposal content and wants to save it.',
      inputSchema: {
        client_id: z.string().uuid().describe('Client UUID this proposal is for'),
        project_id: z.string().uuid().describe('Project UUID this proposal belongs to'),
        title: z.string().min(1).describe('Proposal title'),
        content: z.string().optional().describe('Free-form proposal content or deliverables description'),
        amount: z.number().positive().optional().describe('Proposed project amount'),
        currency: z.string().length(3).default('USD').describe('ISO 4217 currency code'),
        valid_until: z.string().date().optional().describe('Proposal expiry date (YYYY-MM-DD)'),
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

  // Tool 2: get_proposal
  server.registerTool(
    'get_proposal',
    {
      description:
        'Retrieve a single proposal by ID. Use when the freelancer asks to view or reference a specific proposal.',
      inputSchema: {
        proposal_id: z.string().uuid().describe('Proposal UUID'),
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

  // Tool 3: list_proposals
  server.registerTool(
    'list_proposals',
    {
      description:
        'List proposals for a project or client. Use when the freelancer asks for proposal history or wants to check existing proposals.',
      inputSchema: {
        project_id: z.string().uuid().optional().describe('Filter by project UUID'),
        client_id: z.string().uuid().optional().describe('Filter by client UUID'),
        status: z
          .enum(['draft', 'sent', 'accepted', 'declined', 'expired'])
          .optional()
          .describe('Filter by proposal status'),
        sort_by: z
          .enum(['created_at', 'updated_at', 'amount', 'title'])
          .default('created_at')
          .describe('Field to sort by'),
        sort_dir: z.enum(['asc', 'desc']).default('desc').describe('Sort direction'),
        limit: z.number().int().min(1).max(100).default(20).describe('Number of results'),
        offset: z.number().int().min(0).default(0).describe('Pagination offset'),
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

  // Tool 4: update_proposal
  server.registerTool(
    'update_proposal',
    {
      description:
        'Update proposal fields or status. Use when the freelancer wants to change proposal content, status, or details.',
      inputSchema: {
        proposal_id: z.string().uuid().describe('Proposal UUID to update'),
        title: z.string().min(1).optional().describe('Updated proposal title'),
        content: z.string().optional().nullable().describe('Updated proposal content'),
        status: z
          .enum(['draft', 'sent', 'accepted', 'declined', 'expired'])
          .optional()
          .describe('Updated status'),
        amount: z.number().positive().optional().nullable().describe('Updated amount'),
        currency: z.string().length(3).optional().describe('Updated currency code'),
        valid_until: z.string().date().optional().nullable().describe('Updated expiry date'),
        sent_at: z.string().datetime().optional().nullable().describe('Timestamp when proposal was sent'),
        responded_at: z.string().datetime().optional().nullable().describe('Timestamp when client responded'),
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

  // Tool 5: accept_proposal (CRITICAL transactional tool — D-04, PROP-03)
  server.registerTool(
    'accept_proposal',
    {
      description:
        'Mark a proposal as accepted and seed the project scope from its deliverables. Use when the freelancer confirms a proposal was accepted by the client.',
      inputSchema: {
        proposal_id: z.string().uuid().describe('Proposal UUID to accept'),
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
                project_id: (proposal as { project_id: string }).project_id,
                user_id: userId,
                deliverables: (proposal as { content: string | null }).content ?? '',
              },
              { onConflict: 'project_id' }
            )
            .select()
            .single();

          if (scopeError) {
            // Scope upsert failed but proposal was already accepted — return partial success
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      proposal: updatedProposal,
                      scope: null,
                      error: scopeError.message,
                    },
                    null,
                    2
                  ),
                },
              ],
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
