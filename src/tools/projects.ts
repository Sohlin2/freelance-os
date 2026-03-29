import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

export function registerProjectTools(server: McpServer, userId: string): void {
  // Tool 1: create_project
  server.registerTool(
    'create_project',
    {
      description:
        'Create a new project linked to an existing client and persist it to the FreelanceOS database. Use this tool when a freelancer is starting new work for a client and needs to track budget, timeline, and status across the project lifecycle.',
      inputSchema: {
        client_id: z.string().uuid().describe('UUID of the client this project belongs to — must reference an existing client record'),
        name: z.string().min(1).describe('Short, descriptive project name used throughout the FreelanceOS interface'),
        description: z.string().optional().describe('Optional longer description summarising the scope and goals of this project'),
        budget: z.number().positive().optional().describe('Total agreed budget for this project expressed as a positive number'),
        currency: z.string().length(3).default('USD').describe('Three-letter ISO 4217 currency code for the budget amount, e.g. USD, EUR, GBP'),
        start_date: z.string().date().optional().describe('Planned project start date in YYYY-MM-DD format, used for timeline reporting'),
        end_date: z.string().date().optional().describe('Expected project end or delivery date in YYYY-MM-DD format'),
      },
      annotations: {
        title: 'Create Project',
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
            .from('projects')
            .insert({ ...args, user_id: userId, status: 'active' })
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create project: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to create project: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 2: get_project
  server.registerTool(
    'get_project',
    {
      description:
        "Retrieve full details for a single project, including the associated client name and contact information. Use this tool when a freelancer asks about a specific project's status, budget, or timeline.",
      inputSchema: {
        project_id: z.string().uuid().describe('Unique UUID identifier of the project record to retrieve'),
      },
      annotations: {
        title: 'Get Project',
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
            .from('projects')
            .select('*, clients(id, name, email, company)')
            .eq('id', args.project_id)
            .is('archived_at', null)
            .single();
        });
        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: 'Project not found or has been archived',
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
          content: [{ type: 'text', text: `Failed to get project: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 3: list_projects
  server.registerTool(
    'list_projects',
    {
      description:
        'List all non-archived projects with optional full-text search, status and client filters, sorting, and pagination. Use this tool when a freelancer wants an overview of their work portfolio or needs to locate a specific project by name or client.',
      inputSchema: {
        search: z.string().optional().describe('Case-insensitive partial match applied to the project name field'),
        status: z
          .enum(['active', 'paused', 'completed'])
          .optional()
          .describe('Filter results to only projects with this lifecycle status value'),
        client_id: z.string().uuid().optional().describe('Restrict results to projects belonging to this specific client UUID'),
        sort_by: z
          .enum(['name', 'created_at', 'updated_at', 'start_date', 'budget'])
          .default('created_at')
          .describe('Database column used to order the returned project rows'),
        sort_dir: z.enum(['asc', 'desc']).default('desc').describe('Sort direction: asc for oldest-first or lowest-first, desc for newest-first or highest-first'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe('Maximum number of project records to return in a single response, between 1 and 100'),
        offset: z.number().int().min(0).default(0).describe('Zero-based index offset into the full result set used for paginating through large lists'),
      },
      annotations: {
        title: 'List Projects',
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
            .from('projects')
            .select('*, clients(id, name)', { count: 'exact' })
            .is('archived_at', null);
          if (args.search) {
            query = query.ilike('name', `%${args.search}%`);
          }
          if (args.status) {
            query = query.eq('status', args.status);
          }
          if (args.client_id) {
            query = query.eq('client_id', args.client_id);
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
                text: `Failed to list projects: ${error.message}`,
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
                  projects: data,
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
          content: [{ type: 'text', text: `Failed to list projects: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 4: update_project
  server.registerTool(
    'update_project',
    {
      description:
        "Update one or more fields on an existing project record, including name, description, budget, dates, or lifecycle status. Use this tool when a freelancer wants to edit project details, revise the budget, adjust the timeline, or mark a project as paused or completed.",
      inputSchema: {
        project_id: z.string().uuid().describe('Unique UUID identifier of the project record to update'),
        name: z.string().min(1).optional().describe('Replacement name for the project, must be at least one character long'),
        description: z.string().optional().nullable().describe('Replacement description for the project scope and goals, or null to clear it'),
        status: z
          .enum(['active', 'paused', 'completed'])
          .optional()
          .describe('New lifecycle status to assign: active, paused, or completed'),
        budget: z.number().positive().optional().nullable().describe('Revised total budget amount expressed as a positive number, or null to clear it'),
        currency: z.string().length(3).optional().describe('Replacement three-letter ISO 4217 currency code for the budget field'),
        start_date: z.string().date().optional().nullable().describe('Revised project start date in YYYY-MM-DD format, or null to clear it'),
        end_date: z.string().date().optional().nullable().describe('Revised expected end date in YYYY-MM-DD format, or null to clear it'),
      },
      annotations: {
        title: 'Update Project',
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
            .from('projects')
            .update(updateFields)
            .eq('id', project_id)
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to update project: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to update project: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 5: archive_project
  server.registerTool(
    'archive_project',
    {
      description:
        'Soft-delete a project by setting its archived_at timestamp, hiding it from all active project lists while preserving all historical data. Use this tool when a freelancer wants to close out a completed or cancelled project without permanently destroying its records.',
      inputSchema: {
        project_id: z.string().uuid().describe('Unique UUID identifier of the active project record to archive'),
      },
      annotations: {
        title: 'Archive Project',
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
            .from('projects')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', args.project_id)
            .is('archived_at', null)
            .select()
            .single();
        });
        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: 'Failed to archive project: project not found or already archived',
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
              text: `Failed to archive project: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
