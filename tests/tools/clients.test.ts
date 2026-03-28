import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock withUserContext BEFORE importing the module under test
vi.mock('../../src/lib/with-user-context.js', () => ({
  withUserContext: vi.fn(),
}));

import { registerClientTools } from '../../src/tools/clients.js';
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
  registerClientTools(server, userId);
  return handlers;
}

const baseClient = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Acme Corp',
  email: 'acme@example.com',
  phone: null,
  company: 'Acme Inc',
  billing_rate: 150,
  currency: 'USD',
  notes: null,
  user_id: 'test-user-id',
  archived_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('create_client', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns created client as JSON text content', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: baseClient, error: null }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_client']({ name: 'Acme Corp', currency: 'USD' }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.name).toBe('Acme Corp');
    expect(result).not.toHaveProperty('isError');
  });

  it('DB error: returns isError true with failure message', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'unique violation' } }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_client']({ name: 'Test', currency: 'USD' }) as { content: Array<{ type: string; text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to create client');
  });
});

describe('get_client', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success with relations: returns client with projects and follow_ups', async () => {
    const clientWithRelations = {
      ...baseClient,
      projects: [
        { id: 'proj-1', name: 'Website Redesign', status: 'active', start_date: null, end_date: null, budget: 5000, currency: 'USD', created_at: '2026-01-01T00:00:00Z', archived_at: null },
      ],
      follow_ups: [
        { id: 'fu-1', subject: 'Proposal follow-up', type: 'proposal_follow_up', sent_at: null, created_at: '2026-01-01T00:00:00Z' },
      ],
    };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                single: async () => ({ data: clientWithRelations, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['get_client']({ client_id: baseClient.id }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.projects).toHaveLength(1);
    expect(parsed.follow_ups).toHaveLength(1);
    expect(parsed.projects[0].name).toBe('Website Redesign');
    expect(parsed.follow_ups[0].type).toBe('proposal_follow_up');
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

    const result = await handlers['get_client']({ client_id: baseClient.id }) as { content: Array<{ type: string; text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found or has been archived');
  });
});

describe('list_clients', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('basic: returns clients array and total count', async () => {
    const clients = [baseClient, { ...baseClient, id: 'second-id', name: 'Beta LLC' }];

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              order: () => ({
                range: async () => ({ data: clients, error: null, count: 2 }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['list_clients']({ sort_by: 'created_at', sort_dir: 'desc', limit: 20, offset: 0 }) as { content: Array<{ type: string; text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.clients).toHaveLength(2);
    expect(parsed.total).toBe(2);
    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
  });

  it('with search: calls ilike filter on name', async () => {
    let ilikeCalled = false;
    let ilikeArgs: [string, string] | null = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              ilike: (field: string, pattern: string) => {
                ilikeCalled = true;
                ilikeArgs = [field, pattern];
                return {
                  order: () => ({
                    range: async () => ({ data: [baseClient], error: null, count: 1 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_clients']({ search: 'Acme', sort_by: 'created_at', sort_dir: 'desc', limit: 20, offset: 0 });
    expect(ilikeCalled).toBe(true);
    expect(ilikeArgs).toEqual(['name', '%Acme%']);
  });

  it('with pagination: calls range with correct offsets', async () => {
    let rangeCalled = false;
    let rangeArgs: [number, number] | null = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              order: () => ({
                range: async (from: number, to: number) => {
                  rangeCalled = true;
                  rangeArgs = [from, to];
                  return { data: [], error: null, count: 50 };
                },
              }),
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_clients']({ sort_by: 'created_at', sort_dir: 'desc', limit: 20, offset: 20 });
    expect(rangeCalled).toBe(true);
    expect(rangeArgs).toEqual([20, 39]);
  });

  it('DB error: returns isError true', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              order: () => ({
                range: async () => ({ data: null, error: { message: 'Query failed' }, count: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['list_clients']({ sort_by: 'created_at', sort_dir: 'desc', limit: 20, offset: 0 }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to list clients');
  });
});

describe('update_client', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns updated client row', async () => {
    const updatedClient = { ...baseClient, name: 'Updated Corp' };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: updatedClient, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['update_client']({ client_id: baseClient.id, name: 'Updated Corp' }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.name).toBe('Updated Corp');
    expect(result).not.toHaveProperty('isError');
  });

  it('no fields to update: returns isError true', async () => {
    const result = await handlers['update_client']({ client_id: baseClient.id }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('No fields to update');
    // withUserContext should NOT have been called
    expect(mockWithUserContext).not.toHaveBeenCalled();
  });

  it('DB error: returns isError true with message', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: null, error: { message: 'not found' } }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['update_client']({ client_id: baseClient.id, name: 'New' }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to update client');
  });
});

describe('archive_client', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns archived client row with archived_at set', async () => {
    const archivedClient = { ...baseClient, archived_at: '2026-03-28T00:00:00Z' };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              is: () => ({
                select: () => ({
                  single: async () => ({ data: archivedClient, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['archive_client']({ client_id: baseClient.id }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.archived_at).toBeTruthy();
    expect(result).not.toHaveProperty('isError');
  });

  it('already archived or not found: returns isError true', async () => {
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

    const result = await handlers['archive_client']({ client_id: baseClient.id }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to archive client');
  });
});
