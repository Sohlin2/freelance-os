import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

export function registerScopeTools(server: McpServer, userId: string): void {
  // Tool 1: create_scope
  server.registerTool(
    'create_scope',
    {
      description:
        'Define the agreed project scope with deliverables and boundaries. Use when starting a project or after a proposal is accepted.',
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID'),
        deliverables: z
          .string()
          .min(1)
          .describe('What will be delivered — free-form description of outputs'),
        boundaries: z
          .string()
          .optional()
          .describe('What is in and out of scope for this project'),
        assumptions: z
          .string()
          .optional()
          .describe('Assumptions made when defining the scope'),
        exclusions: z
          .string()
          .optional()
          .describe('Explicitly excluded work items'),
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

  // Tool 2: get_scope
  server.registerTool(
    'get_scope',
    {
      description:
        'Retrieve the agreed scope for a project. Use when the freelancer wants to review what was agreed.',
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID'),
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

  // Tool 3: update_scope
  server.registerTool(
    'update_scope',
    {
      description:
        'Update the project scope definition. Use when the agreed scope changes and needs to be updated.',
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID'),
        deliverables: z
          .string()
          .min(1)
          .optional()
          .describe('Updated deliverables description'),
        boundaries: z
          .string()
          .optional()
          .nullable()
          .describe('Updated boundaries'),
        assumptions: z
          .string()
          .optional()
          .nullable()
          .describe('Updated assumptions'),
        exclusions: z
          .string()
          .optional()
          .nullable()
          .describe('Updated exclusions'),
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

  // Tool 4: log_scope_change
  server.registerTool(
    'log_scope_change',
    {
      description:
        'Record a scope change request with classification. Use ONLY after the freelancer confirms they want to log the change.',
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID'),
        description: z
          .string()
          .min(1)
          .describe('Description of the requested change'),
        classification: z
          .enum(['in_scope', 'out_of_scope', 'needs_review'])
          .describe(
            'Classification of the change: in_scope (covered by existing agreement), out_of_scope (additional work), needs_review (ambiguous — requires discussion)'
          ),
        impact: z
          .string()
          .optional()
          .describe('Estimated impact — time, cost, or effort'),
        requested_at: z
          .string()
          .optional()
          .describe('ISO 8601 datetime when the change was requested (defaults to now)'),
        resolved_at: z
          .string()
          .optional()
          .describe('ISO 8601 datetime when the change was resolved'),
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

  // Tool 5: list_scope_changes
  server.registerTool(
    'list_scope_changes',
    {
      description:
        'List scope change requests logged against a project. Use when reviewing scope creep history or change log.',
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID'),
        classification: z
          .enum(['in_scope', 'out_of_scope', 'needs_review'])
          .optional()
          .describe('Filter by classification'),
        sort_by: z
          .enum(['requested_at', 'created_at'])
          .default('requested_at')
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

  // Tool 6: check_scope
  server.registerTool(
    'check_scope',
    {
      description:
        'Retrieve agreed scope and change history so Claude can assess whether a new request falls within scope. Use when a client requests something new and the freelancer wants to check if it is in scope.',
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID'),
        request_description: z
          .string()
          .min(1)
          .describe('Description of the new request to assess against the agreed scope'),
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
