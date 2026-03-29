import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

export function registerTimeEntryTools(server: McpServer, userId: string): void {
  // Tool 1: time.create
  server.registerTool(
    'time.create',
    {
      description:
        'Log a time entry against a project to record hours worked. Use when the freelancer reports time spent on a task, meeting, or deliverable so it can be tracked and later billed to the client.',
      inputSchema: {
        project_id: z.string().uuid().describe('UUID of the project to log this time entry against'),
        description: z.string().min(1).describe('Brief description of the work performed during this time block'),
        duration_minutes: z
          .number()
          .int()
          .positive()
          .describe('Total duration of the work session expressed in whole minutes'),
        entry_date: z
          .string()
          .optional()
          .describe('Calendar date when the work was performed in YYYY-MM-DD format, defaults to today'),
        billable: z
          .boolean()
          .default(true)
          .describe('Whether this time entry should be billed to the client on the next invoice'),
      },
      annotations: {
        title: 'Time: Create',
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

  // Tool 2: time.get
  server.registerTool(
    'time.get',
    {
      description:
        'Retrieve a single time entry record by its unique identifier. Use when the freelancer asks to view the details of a specific logged time entry, such as its description, duration, or billable status.',
      inputSchema: {
        time_entry_id: z.string().uuid().describe('Unique UUID identifier of the time entry record to retrieve'),
      },
      annotations: {
        title: 'Time: Get',
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

  // Tool 3: time.list
  server.registerTool(
    'time.list',
    {
      description:
        'List time entries with optional filtering by project, date range, and billable status. Use when reviewing logged hours for a project, preparing a timesheet, or checking what work has been recorded before generating an invoice.',
      inputSchema: {
        project_id: z.string().uuid().optional().describe('UUID of the project to filter time entries by, omit to list across all projects'),
        start_date: z
          .string()
          .optional()
          .describe('Include only entries on or after this date in YYYY-MM-DD format'),
        end_date: z
          .string()
          .optional()
          .describe('Include only entries on or before this date in YYYY-MM-DD format'),
        billable: z.boolean().optional().describe('Filter results to only billable or only non-billable time entries'),
        sort_by: z
          .enum(['entry_date', 'created_at', 'duration_minutes'])
          .default('entry_date')
          .describe('Database column to use when ordering the returned time entries'),
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
          .describe('Maximum number of time entry records to return in a single page'),
        offset: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe('Number of records to skip for cursor-based pagination through large result sets'),
      },
      annotations: {
        title: 'Time: List',
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

  // Tool 4: time.update
  server.registerTool(
    'time.update',
    {
      description:
        "Update one or more fields on an existing time entry record. Use when the freelancer needs to correct a logged entry's duration, description, date, or billable flag after it was originally saved.",
      inputSchema: {
        time_entry_id: z.string().uuid().describe('Unique UUID identifier of the time entry record to update'),
        description: z.string().min(1).optional().describe('Revised description of the work performed during this time block'),
        duration_minutes: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Corrected duration of the work session expressed in whole minutes'),
        entry_date: z.string().optional().describe('Corrected date when the work was performed in YYYY-MM-DD format'),
        billable: z.boolean().optional().describe('Updated flag indicating whether this time entry should be billed to the client'),
      },
      annotations: {
        title: 'Time: Update',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
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

  // Tool 5: time.archive (soft delete)
  server.registerTool(
    'time.archive',
    {
      description:
        'Soft-delete a time entry by setting its archived_at timestamp, hiding it from all queries. Use when the freelancer wants to permanently remove an incorrectly logged or duplicate time entry from their records without destroying the underlying data.',
      inputSchema: {
        time_entry_id: z.string().uuid().describe('Unique UUID identifier of the time entry record to soft-delete by archiving'),
      },
      annotations: {
        title: 'Time: Archive',
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

  // Tool 6: time.aggregate (JS-side reduce, no migration needed)
  server.registerTool(
    'time.aggregate',
    {
      description:
        'Calculate the total minutes and hours logged against a project over an optional date range. Use when preparing an invoice, verifying billable hours before sending to a client, or generating a summary timesheet report.',
      inputSchema: {
        project_id: z.string().uuid().describe('UUID of the project whose time entries should be summed and aggregated'),
        start_date: z
          .string()
          .optional()
          .describe('Beginning of the aggregation window in YYYY-MM-DD format, inclusive'),
        end_date: z
          .string()
          .optional()
          .describe('End of the aggregation window in YYYY-MM-DD format, inclusive'),
        billable_only: z
          .boolean()
          .default(true)
          .describe('When true, only sum time entries that are marked as billable to the client'),
      },
      annotations: {
        title: 'Time: Aggregate',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
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
