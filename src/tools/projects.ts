import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

export function registerProjectTools(server: McpServer, userId: string): void {
  // Tool 1: create_project
  server.registerTool(
    'create_project',
    {
      description:
        'Create a new project linked to a client. Use when a freelancer starts new work for an existing client.',
      inputSchema: {
        client_id: z.string().uuid().describe('Client UUID this project belongs to'),
        name: z.string().min(1).describe('Project name'),
        description: z.string().optional().describe('Project description'),
        budget: z.number().positive().optional().describe('Project budget amount'),
        currency: z.string().length(3).default('USD').describe('ISO 4217 currency code'),
        start_date: z.string().date().optional().describe('Project start date (YYYY-MM-DD)'),
        end_date: z.string().date().optional().describe('Expected end date (YYYY-MM-DD)'),
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
        "Get a project's details. Use when a freelancer asks about a specific project.",
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID'),
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
        'List projects with optional search and filters. Use when a freelancer wants to see their projects or find specific ones.',
      inputSchema: {
        search: z.string().optional().describe('Search projects by name (partial match)'),
        status: z
          .enum(['active', 'paused', 'completed'])
          .optional()
          .describe('Filter by project status'),
        client_id: z.string().uuid().optional().describe('Filter by client UUID'),
        sort_by: z
          .enum(['name', 'created_at', 'updated_at', 'start_date', 'budget'])
          .default('created_at')
          .describe('Field to sort by'),
        sort_dir: z.enum(['asc', 'desc']).default('desc').describe('Sort direction'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe('Number of results'),
        offset: z.number().int().min(0).default(0).describe('Pagination offset'),
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
        "Update a project's details or change its status. Use when a freelancer wants to modify project info or mark it as paused/completed.",
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID to update'),
        name: z.string().min(1).optional().describe('Updated project name'),
        description: z.string().optional().nullable().describe('Updated description'),
        status: z
          .enum(['active', 'paused', 'completed'])
          .optional()
          .describe('Updated status'),
        budget: z.number().positive().optional().nullable().describe('Updated budget'),
        currency: z.string().length(3).optional().describe('Updated currency'),
        start_date: z.string().date().optional().nullable().describe('Updated start date'),
        end_date: z.string().date().optional().nullable().describe('Updated end date'),
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
        'Archive a project (soft delete). Use when a freelancer wants to close out a project but keep its records.',
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID to archive'),
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
