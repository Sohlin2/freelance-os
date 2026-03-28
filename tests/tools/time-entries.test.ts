import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock withUserContext BEFORE importing the module under test
vi.mock('../../src/lib/with-user-context.js', () => ({
  withUserContext: vi.fn(),
}));

import { registerTimeEntryTools } from '../../src/tools/time-entries.js';
import { withUserContext } from '../../src/lib/with-user-context.js';

const mockWithUserContext = vi.mocked(withUserContext);

// Capture registered tool handlers by spying on McpServer.registerTool
function captureTools(userId = 'test-user-id'): Record<string, (args: Record<string, unknown>) => Promise<unknown>> {
  const server = new McpServer(
    { name: 'test', version: '0.0.1' },
    { capabilities: {} }
  );
  const handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {};
  vi.spyOn(server, 'registerTool').mockImplementation((name: string, _schema: unknown, handler: unknown) => {
    handlers[name] = handler as (args: Record<string, unknown>) => Promise<unknown>;
    return server;
  });
  registerTimeEntryTools(server, userId);
  return handlers;
}

const baseTimeEntry = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  user_id: 'test-user-id',
  project_id: '550e8400-e29b-41d4-a716-446655440020',
  description: 'Homepage design work',
  duration_minutes: 120,
  entry_date: '2026-03-28',
  billable: true,
  archived_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('create_time_entry', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns created time entry as JSON text content', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: baseTimeEntry, error: null }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_time_entry']({
      project_id: baseTimeEntry.project_id,
      description: 'Homepage design work',
      duration_minutes: 120,
    }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.description).toBe('Homepage design work');
    expect(parsed.duration_minutes).toBe(120);
    expect(result).not.toHaveProperty('isError');
  });

  it('DB error: returns isError true with failure message', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'foreign key violation' } }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_time_entry']({
      project_id: baseTimeEntry.project_id,
      description: 'Test',
      duration_minutes: 60,
    }) as { content: Array<{ type: string; text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to create time entry');
  });
});

describe('get_time_entry', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns time entry as JSON text content', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                single: async () => ({ data: baseTimeEntry, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['get_time_entry']({ time_entry_id: baseTimeEntry.id }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.id).toBe(baseTimeEntry.id);
    expect(parsed.duration_minutes).toBe(120);
    expect(result).not.toHaveProperty('isError');
  });

  it('not found: returns isError true', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                single: async () => ({ data: null, error: { code: 'PGRST116', message: 'No rows found' } }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['get_time_entry']({ time_entry_id: baseTimeEntry.id }) as { content: Array<{ type: string; text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found');
  });
});

describe('list_time_entries', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('with project_id filter: returns time entries array and total count', async () => {
    const entries = [baseTimeEntry, { ...baseTimeEntry, id: 'second-id', duration_minutes: 60 }];

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              eq: () => ({
                order: () => ({
                  range: async () => ({ data: entries, error: null, count: 2 }),
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['list_time_entries']({
      project_id: baseTimeEntry.project_id,
      sort_by: 'entry_date',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    }) as { content: Array<{ type: string; text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.time_entries).toHaveLength(2);
    expect(parsed.total).toBe(2);
    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
  });

  it('with date range: calls gte and lte filters on entry_date', async () => {
    let gteCalled = false;
    let lteCalled = false;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              gte: (field: string, _value: string) => {
                if (field === 'entry_date') gteCalled = true;
                return {
                  lte: (field2: string, _value2: string) => {
                    if (field2 === 'entry_date') lteCalled = true;
                    return {
                      order: () => ({
                        range: async () => ({ data: [baseTimeEntry], error: null, count: 1 }),
                      }),
                    };
                  },
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_time_entries']({
      start_date: '2026-03-01',
      end_date: '2026-03-31',
      sort_by: 'entry_date',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });
    expect(gteCalled).toBe(true);
    expect(lteCalled).toBe(true);
  });
});

describe('update_time_entry', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns updated time entry with changed duration', async () => {
    const updatedEntry = { ...baseTimeEntry, duration_minutes: 90 };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: updatedEntry, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['update_time_entry']({
      time_entry_id: baseTimeEntry.id,
      duration_minutes: 90,
    }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.duration_minutes).toBe(90);
    expect(result).not.toHaveProperty('isError');
  });

  it('no fields to update: returns isError true without calling DB', async () => {
    const result = await handlers['update_time_entry']({ time_entry_id: baseTimeEntry.id }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('No fields to update');
    expect(mockWithUserContext).not.toHaveBeenCalled();
  });
});

describe('archive_time_entry', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns archived entry with archived_at set', async () => {
    const archivedEntry = { ...baseTimeEntry, archived_at: '2026-03-28T00:00:00Z' };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              is: () => ({
                select: () => ({
                  single: async () => ({ data: archivedEntry, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['archive_time_entry']({ time_entry_id: baseTimeEntry.id }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.archived_at).toBeTruthy();
    expect(result).not.toHaveProperty('isError');
  });

  it('not found or already archived: returns isError true', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              is: () => ({
                select: () => ({
                  single: async () => ({ data: null, error: { message: 'No rows found' } }),
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['archive_time_entry']({ time_entry_id: baseTimeEntry.id }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to archive time entry');
  });
});

describe('aggregate_time', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('returns correct total_minutes, total_hours, entry_count from multiple entries', async () => {
    const entries = [
      { duration_minutes: 120, entry_date: '2026-03-27', billable: true },
      { duration_minutes: 60, entry_date: '2026-03-28', billable: true },
    ];

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                eq: async () => ({ data: entries, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['aggregate_time']({
      project_id: baseTimeEntry.project_id,
      billable_only: true,
    }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.total_minutes).toBe(180);
    expect(parsed.total_hours).toBe(3.0);
    expect(parsed.entry_count).toBe(2);
    expect(parsed.project_id).toBe(baseTimeEntry.project_id);
    expect(result).not.toHaveProperty('isError');
  });

  it('with billable_only=true: calls .eq("billable", true) filter', async () => {
    let billableEqCalled = false;
    let billableEqArgs: [string, boolean] | null = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                eq: async (field: string, value: boolean) => {
                  billableEqCalled = true;
                  billableEqArgs = [field, value];
                  return { data: [], error: null };
                },
              }),
            }),
          }),
        }),
      } as never);
    });

    await handlers['aggregate_time']({
      project_id: baseTimeEntry.project_id,
      billable_only: true,
    });
    expect(billableEqCalled).toBe(true);
    expect(billableEqArgs).toEqual(['billable', true]);
  });

  it('with date range: applies start_date and end_date filters', async () => {
    let gteCalled = false;
    let lteCalled = false;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                eq: () => ({
                  gte: (field: string, _value: string) => {
                    if (field === 'entry_date') gteCalled = true;
                    return {
                      lte: (field2: string, _value2: string) => {
                        if (field2 === 'entry_date') lteCalled = true;
                        return { data: [], error: null };
                      },
                    };
                  },
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['aggregate_time']({
      project_id: baseTimeEntry.project_id,
      billable_only: true,
      start_date: '2026-03-01',
      end_date: '2026-03-31',
    }) as { content: Array<{ type: string; text: string }> };
    expect(gteCalled).toBe(true);
    expect(lteCalled).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.date_range.start).toBe('2026-03-01');
    expect(parsed.date_range.end).toBe('2026-03-31');
  });

  it('with no entries: returns zeros', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                eq: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['aggregate_time']({
      project_id: baseTimeEntry.project_id,
      billable_only: true,
    }) as { content: Array<{ type: string; text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.total_minutes).toBe(0);
    expect(parsed.total_hours).toBe(0);
    expect(parsed.entry_count).toBe(0);
  });
});
