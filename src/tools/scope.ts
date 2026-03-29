import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

export function registerScopeTools(server: McpServer, userId: string): void {
  // Tool 1: scope.create
  server.registerTool(
    'scope.create',
    {
      description:
        'Define and persist the agreed project scope with deliverables, boundaries, and exclusions. Use this tool when starting a new project or immediately after a proposal is accepted by the client to establish a clear, shared understanding of what will be built.',
      inputSchema: {
        project_id: z.string().uuid().describe('UUID of the project this scope definition belongs to'),
        deliverables: z
          .string()
          .min(1)
          .describe('Detailed free-form description of all outputs and artifacts that will be delivered to the client'),
        boundaries: z
          .string()
          .optional()
          .describe('Explicit statement of what work is inside and outside the agreed scope for this project'),
        assumptions: z
          .string()
          .optional()
          .describe('Assumptions made by the freelancer when defining this scope that the client should be aware of'),
        exclusions: z
          .string()
          .optional()
          .describe('Specific work items or deliverables that are explicitly excluded from this project scope'),
      },
      annotations: {
        title: 'Scope: Create',
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
            .from('scope_definitions')
            .insert({ ...args, user_id: userId })
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create scope: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to create scope: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 2: scope.get
  server.registerTool(
    'scope.get',
    {
      description:
        'Retrieve the current active scope definition for a project, including deliverables, boundaries, assumptions, and exclusions. Use when the freelancer wants to review exactly what was agreed with the client before starting work or answering a scope question.',
      inputSchema: {
        project_id: z.string().uuid().describe('UUID of the project whose scope definition should be retrieved'),
      },
      annotations: {
        title: 'Scope: Get',
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
            .from('scope_definitions')
            .select('*')
            .eq('project_id', args.project_id)
            .is('archived_at', null)
            .single();
        });
        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: 'No scope definition found for this project',
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
          content: [{ type: 'text', text: `Failed to get scope: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 3: scope.update
  server.registerTool(
    'scope.update',
    {
      description:
        'Update one or more fields of the active scope definition for a project. Use when the client and freelancer have mutually agreed to change the scope and the persisted record needs to reflect the new agreement.',
      inputSchema: {
        project_id: z.string().uuid().describe('UUID of the project whose scope definition should be updated'),
        deliverables: z
          .string()
          .min(1)
          .optional()
          .describe('Revised description of all outputs and artifacts that will be delivered under the updated scope'),
        boundaries: z
          .string()
          .optional()
          .nullable()
          .describe('Revised statement of what work is inside and outside the agreed scope after the change'),
        assumptions: z
          .string()
          .optional()
          .nullable()
          .describe('Revised assumptions that underpin the updated scope agreement with the client'),
        exclusions: z
          .string()
          .optional()
          .nullable()
          .describe('Revised list of work items or deliverables that are explicitly excluded from the updated scope'),
      },
      annotations: {
        title: 'Scope: Update',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const { project_id, ...updates } = args;
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
            .from('scope_definitions')
            .update(updateFields)
            .eq('project_id', project_id)
            .is('archived_at', null)
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to update scope: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to update scope: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 4: scope.changes.log
  server.registerTool(
    'scope.changes.log',
    {
      description:
        'Record a client scope change request with classification and impact notes to maintain an auditable history of scope creep. Use this tool ONLY after the freelancer confirms they want to log the change — never log speculatively without explicit instruction.',
      inputSchema: {
        project_id: z.string().uuid().describe('UUID of the project this scope change request is associated with'),
        description: z
          .string()
          .min(1)
          .describe('Clear description of the change the client is requesting beyond the original agreed scope'),
        classification: z
          .enum(['in_scope', 'out_of_scope', 'needs_review'])
          .describe(
            'Classification of the change: in_scope (covered by existing agreement), out_of_scope (additional billable work), needs_review (ambiguous — requires discussion with client)'
          ),
        impact: z
          .string()
          .optional()
          .describe('Estimated impact of the change in terms of additional time, cost, or effort required'),
        requested_at: z
          .string()
          .optional()
          .describe('ISO 8601 datetime when the client requested this change — defaults to current timestamp if omitted'),
        resolved_at: z
          .string()
          .optional()
          .describe('ISO 8601 datetime when this scope change request was resolved or formally accepted'),
      },
      annotations: {
        title: 'Scope: Log Change',
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
            .from('scope_changes')
            .insert({ ...args, user_id: userId })
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to log scope change: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to log scope change: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 5: scope.changes.list
  server.registerTool(
    'scope.changes.list',
    {
      description:
        'List all scope change requests logged against a project, with optional filtering by classification and configurable sort order. Use when reviewing scope creep history, preparing a change-order summary, or auditing out-of-scope requests for billing.',
      inputSchema: {
        project_id: z.string().uuid().describe('UUID of the project whose scope change history should be listed'),
        classification: z
          .enum(['in_scope', 'out_of_scope', 'needs_review'])
          .optional()
          .describe('Optional filter to return only changes of a specific classification type'),
        sort_by: z
          .enum(['requested_at', 'created_at'])
          .default('requested_at')
          .describe('Database field used to order the returned scope change records'),
        sort_dir: z
          .enum(['asc', 'desc'])
          .default('desc')
          .describe('Sort direction — desc returns the most recent changes first'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe('Maximum number of scope change records to return in a single page'),
        offset: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe('Number of records to skip for pagination — use with limit to page through results'),
      },
      annotations: {
        title: 'Scope: List Changes',
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
            .from('scope_changes')
            .select('*', { count: 'exact' })
            .eq('project_id', args.project_id)
            .is('archived_at', null);
          if (args.classification) {
            query = query.eq('classification', args.classification);
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
                text: `Failed to list scope changes: ${error.message}`,
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
                  scope_changes: data,
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
          content: [{ type: 'text', text: `Failed to list scope changes: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 6: scope.check
  server.registerTool(
    'scope.check',
    {
      description:
        'Retrieve the agreed scope definition and full change history for a project so Claude can assess whether a new client request falls within the original agreement. Use this tool when a client asks for something new and the freelancer wants an informed opinion on whether it is in scope before responding.',
      inputSchema: {
        project_id: z.string().uuid().describe('UUID of the project against whose scope the new request should be assessed'),
        request_description: z
          .string()
          .min(1)
          .describe('Detailed description of the new client request to be evaluated against the agreed project scope'),
      },
      annotations: {
        title: 'Scope: Check',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        const result = await withUserContext(userId, async (db) => {
          const [scopeResult, changesResult] = await Promise.all([
            db
              .from('scope_definitions')
              .select('*')
              .eq('project_id', args.project_id)
              .is('archived_at', null)
              .maybeSingle(),
            db
              .from('scope_changes')
              .select('*')
              .eq('project_id', args.project_id)
              .is('archived_at', null)
              .order('requested_at', { ascending: false }),
          ]);
          return { scopeResult, changesResult };
        });

        if (result.scopeResult.error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to check scope: ${result.scopeResult.error.message}`,
              },
            ],
            isError: true,
          };
        }

        const scope = result.scopeResult.data;
        const changes = result.changesResult.data ?? [];

        if (!scope) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    scope: null,
                    scope_changes: [],
                    request_description: args.request_description,
                    message: 'No scope has been defined for this project yet.',
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
                  scope,
                  scope_changes: changes,
                  request_description: args.request_description,
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
          content: [{ type: 'text', text: `Failed to check scope: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
