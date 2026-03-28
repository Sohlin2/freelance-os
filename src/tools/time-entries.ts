import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

export function registerTimeEntryTools(server: McpServer, userId: string): void {
  // Tool 1: create_time_entry
  server.registerTool(
    'create_time_entry',
    {
      description:
        'Log a time entry against a project. Use when the freelancer reports hours worked on a project.',
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID to log time against'),
        description: z.string().min(1).describe('What was worked on'),
        duration_minutes: z
          .number()
          .int()
          .positive()
          .describe('Duration of work in minutes'),
        entry_date: z
          .string()
          .optional()
          .describe('Date of work (YYYY-MM-DD, defaults to today)'),
        billable: z
          .boolean()
          .default(true)
          .describe('Whether this time is billable to the client'),
      },
    },
    async (args) => {
      try {
        const { data, error } = await withUserContext(userId, async (db) => {
          return db
            .from('time_entries')
            .insert({ ...args, user_id: userId })
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create time entry: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to create time entry: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 2: get_time_entry
  server.registerTool(
    'get_time_entry',
    {
      description:
        'Retrieve a single time entry by ID. Use when the freelancer asks to view a specific logged time entry.',
      inputSchema: {
        time_entry_id: z.string().uuid().describe('Time entry UUID'),
      },
    },
    async (args) => {
      try {
        const { data, error } = await withUserContext(userId, async (db) => {
          return db
            .from('time_entries')
            .select('*')
            .eq('id', args.time_entry_id)
            .is('archived_at', null)
            .single();
        });
        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: 'Time entry not found or has been archived',
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
          content: [{ type: 'text', text: `Failed to get time entry: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 3: list_time_entries
  server.registerTool(
    'list_time_entries',
    {
      description:
        'List time entries for a project, optionally filtered by date range. Use when reviewing logged hours for a project.',
      inputSchema: {
        project_id: z.string().uuid().optional().describe('Filter by project UUID'),
        start_date: z
          .string()
          .optional()
          .describe('Filter entries on or after this date (YYYY-MM-DD)'),
        end_date: z
          .string()
          .optional()
          .describe('Filter entries on or before this date (YYYY-MM-DD)'),
        billable: z.boolean().optional().describe('Filter by billable status'),
        sort_by: z
          .enum(['entry_date', 'created_at', 'duration_minutes'])
          .default('entry_date')
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
            .from('time_entries')
            .select('*', { count: 'exact' })
            .is('archived_at', null);
          if (args.project_id) {
            query = query.eq('project_id', args.project_id);
          }
          if (args.start_date) {
            query = query.gte('entry_date', args.start_date);
          }
          if (args.end_date) {
            query = query.lte('entry_date', args.end_date);
          }
          if (args.billable !== undefined) {
            query = query.eq('billable', args.billable);
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
                text: `Failed to list time entries: ${error.message}`,
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
                  time_entries: data,
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
          content: [{ type: 'text', text: `Failed to list time entries: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 4: update_time_entry
  server.registerTool(
    'update_time_entry',
    {
      description:
        "Update a time entry's duration, date, or description. Use when the freelancer wants to correct a logged entry.",
      inputSchema: {
        time_entry_id: z.string().uuid().describe('Time entry UUID to update'),
        description: z.string().min(1).optional().describe('Updated description'),
        duration_minutes: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Updated duration in minutes'),
        entry_date: z.string().optional().describe('Updated entry date (YYYY-MM-DD)'),
        billable: z.boolean().optional().describe('Updated billable status'),
      },
    },
    async (args) => {
      try {
        const { time_entry_id, ...updates } = args;
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
            .from('time_entries')
            .update(updateFields)
            .eq('id', time_entry_id)
            .select()
            .single();
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to update time entry: ${error.message}`,
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
          content: [{ type: 'text', text: `Failed to update time entry: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 5: archive_time_entry (soft delete)
  server.registerTool(
    'archive_time_entry',
    {
      description:
        'Archive a time entry (soft delete). Use when the freelancer wants to remove an incorrectly logged entry.',
      inputSchema: {
        time_entry_id: z.string().uuid().describe('Time entry UUID to archive'),
      },
    },
    async (args) => {
      try {
        const { data, error } = await withUserContext(userId, async (db) => {
          return db
            .from('time_entries')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', args.time_entry_id)
            .is('archived_at', null)
            .select()
            .single();
        });
        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: 'Failed to archive time entry: entry not found or already archived',
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
              text: `Failed to archive time entry: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool 6: aggregate_time (JS-side reduce, no migration needed)
  server.registerTool(
    'aggregate_time',
    {
      description:
        'Sum total hours and amount for a project over an optional date range. Use when preparing an invoice or checking billable hours.',
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID to aggregate time for'),
        start_date: z
          .string()
          .optional()
          .describe('Start of date range (YYYY-MM-DD, inclusive)'),
        end_date: z
          .string()
          .optional()
          .describe('End of date range (YYYY-MM-DD, inclusive)'),
        billable_only: z
          .boolean()
          .default(true)
          .describe('Only sum billable time entries'),
      },
    },
    async (args) => {
      try {
        const { data, error } = await withUserContext(userId, async (db) => {
          let query = db
            .from('time_entries')
            .select('duration_minutes, entry_date, billable')
            .eq('project_id', args.project_id)
            .is('archived_at', null);
          if (args.billable_only) {
            query = query.eq('billable', true);
          }
          if (args.start_date) {
            query = query.gte('entry_date', args.start_date);
          }
          if (args.end_date) {
            query = query.lte('entry_date', args.end_date);
          }
          return query;
        });
        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to aggregate time: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        const entries = data ?? [];
        const totalMinutes = entries.reduce(
          (sum: number, e: { duration_minutes: number }) => sum + e.duration_minutes,
          0
        );
        const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  project_id: args.project_id,
                  total_minutes: totalMinutes,
                  total_hours: totalHours,
                  entry_count: entries.length,
                  date_range: {
                    start: args.start_date ?? null,
                    end: args.end_date ?? null,
                  },
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
          content: [{ type: 'text', text: `Failed to aggregate time: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
