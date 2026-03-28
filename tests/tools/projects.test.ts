import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock withUserContext BEFORE importing the module under test
vi.mock('../../src/lib/with-user-context.js', () => ({
  withUserContext: vi.fn(),
}));

import { registerProjectTools } from '../../src/tools/projects.js';
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
  registerProjectTools(server, userId);
  return handlers;
}

const CLIENT_ID = '550e8400-e29b-41d4-a716-446655440001';
const PROJECT_ID = '550e8400-e29b-41d4-a716-446655440002';

const baseProject = {
  id: PROJECT_ID,
  name: 'Website Redesign',
  description: 'Full redesign of the corporate website',
  client_id: CLIENT_ID,
  status: 'active' as const,
  budget: 5000,
  currency: 'USD',
  start_date: '2026-01-01',
  end_date: '2026-06-01',
  user_id: 'test-user-id',
  archived_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('create_project', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns created project with status active', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: baseProject, error: null }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_project']({
      client_id: CLIENT_ID,
      name: 'Website Redesign',
      currency: 'USD',
    }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.name).toBe('Website Redesign');
    expect(parsed.status).toBe('active');
    expect(result).not.toHaveProperty('isError');
  });

  it('FK error: returns isError true with failure message', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: null,
                error: { message: 'violates foreign key constraint' },
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_project']({
      client_id: CLIENT_ID,
      name: 'Bad Project',
      currency: 'USD',
    }) as { content: Array<{ type: string; text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to create project');
  });
});

describe('get_project', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success with client: returns project with clients object', async () => {
    const projectWithClient = {
      ...baseProject,
      clients: {
        id: CLIENT_ID,
        name: 'Acme Corp',
        email: 'acme@example.com',
        company: 'Acme Inc',
      },
    };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                single: async () => ({ data: projectWithClient, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['get_project']({ project_id: PROJECT_ID }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.name).toBe('Website Redesign');
    expect(parsed.clients).toBeDefined();
    expect(parsed.clients.name).toBe('Acme Corp');
    expect(parsed.clients.email).toBe('acme@example.com');
    expect(result).not.toHaveProperty('isError');
  });

  it('not found: returns isError true', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                single: async () => ({
                  data: null,
                  error: { code: 'PGRST116', message: 'No rows found' },
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['get_project']({ project_id: PROJECT_ID }) as { content: Array<{ type: string; text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found or has been archived');
  });
});

describe('list_projects', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('basic: returns projects array and total count', async () => {
    const projects = [
      baseProject,
      { ...baseProject, id: 'second-id', name: 'Mobile App' },
      { ...baseProject, id: 'third-id', name: 'API Integration' },
    ];

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              order: () => ({
                range: async () => ({ data: projects, error: null, count: 3 }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['list_projects']({
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    }) as { content: Array<{ type: string; text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.projects).toHaveLength(3);
    expect(parsed.total).toBe(3);
    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
  });

  it('filter by status: calls eq with status value (CRM-04)', async () => {
    let eqStatusCalled = false;
    let eqStatusArgs: [string, string] | null = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              eq: (field: string, value: string) => {
                eqStatusCalled = true;
                eqStatusArgs = [field, value];
                return {
                  order: () => ({
                    range: async () => ({ data: [baseProject], error: null, count: 1 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_projects']({
      status: 'active',
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });
    expect(eqStatusCalled).toBe(true);
    expect(eqStatusArgs).toEqual(['status', 'active']);
  });

  it('filter by client_id: calls eq with client_id value', async () => {
    let eqClientCalled = false;
    let eqClientArgs: [string, string] | null = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              eq: (field: string, value: string) => {
                eqClientCalled = true;
                eqClientArgs = [field, value];
                return {
                  order: () => ({
                    range: async () => ({ data: [baseProject], error: null, count: 1 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_projects']({
      client_id: CLIENT_ID,
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });
    expect(eqClientCalled).toBe(true);
    expect(eqClientArgs).toEqual(['client_id', CLIENT_ID]);
  });

  it('with name search: calls ilike on name field (CRM-04)', async () => {
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
                    range: async () => ({ data: [baseProject], error: null, count: 1 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_projects']({
      search: 'Website',
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });
    expect(ilikeCalled).toBe(true);
    expect(ilikeArgs).toEqual(['name', '%Website%']);
  });

  it('DB error: returns isError true', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              order: () => ({
                range: async () => ({
                  data: null,
                  error: { message: 'Query failed' },
                  count: null,
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['list_projects']({
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to list projects');
  });
});

describe('update_project', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('status change: returns updated project with new status', async () => {
    const completedProject = { ...baseProject, status: 'completed' as const };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: completedProject, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['update_project']({
      project_id: PROJECT_ID,
      status: 'completed',
    }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe('completed');
    expect(result).not.toHaveProperty('isError');
  });

  it('no fields to update: returns isError true', async () => {
    const result = await handlers['update_project']({
      project_id: PROJECT_ID,
    }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('No fields to update');
    expect(mockWithUserContext).not.toHaveBeenCalled();
  });

  it('DB error: returns isError true with message', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: null,
                  error: { message: 'not found' },
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['update_project']({
      project_id: PROJECT_ID,
      name: 'Updated Name',
    }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to update project');
  });
});

describe('archive_project', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns archived project with archived_at set', async () => {
    const archivedProject = {
      ...baseProject,
      archived_at: '2026-03-28T00:00:00Z',
    };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              is: () => ({
                select: () => ({
                  single: async () => ({ data: archivedProject, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['archive_project']({ project_id: PROJECT_ID }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.archived_at).toBeTruthy();
    expect(parsed.archived_at).toBe('2026-03-28T00:00:00Z');
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
                  single: async () => ({
                    data: null,
                    error: { message: 'No rows found' },
                  }),
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['archive_project']({ project_id: PROJECT_ID }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to archive project');
  });
});
