import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock withUserContext BEFORE importing the module under test
vi.mock('../../src/lib/with-user-context.js', () => ({
  withUserContext: vi.fn(),
}));

import { registerScopeTools } from '../../src/tools/scope.js';
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
  registerScopeTools(server, userId);
  return handlers;
}

const baseScopeDefinition = {
  id: '550e8400-e29b-41d4-a716-446655440004',
  user_id: 'test-user-id',
  project_id: '550e8400-e29b-41d4-a716-446655440020',
  deliverables: 'Redesign 5 pages with responsive layout and SEO optimization',
  boundaries: 'Desktop and mobile only, no tablet-specific layouts',
  assumptions: 'Client provides all copy and images',
  exclusions: 'Backend development, hosting setup',
  archived_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const baseScopeChange = {
  id: '550e8400-e29b-41d4-a716-446655440005',
  user_id: 'test-user-id',
  project_id: '550e8400-e29b-41d4-a716-446655440020',
  description: 'Client wants a new contact form page',
  classification: 'out_of_scope',
  impact: 'Additional 8 hours of work, $800',
  requested_at: '2026-03-28T00:00:00Z',
  resolved_at: null,
  archived_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('create_scope', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: inserts scope_definitions and returns created scope', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: baseScopeDefinition, error: null }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_scope']({
      project_id: baseScopeDefinition.project_id,
      deliverables: baseScopeDefinition.deliverables,
      boundaries: baseScopeDefinition.boundaries,
    }) as { content: Array<{ type: string; text: string }> };

    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.deliverables).toBe(baseScopeDefinition.deliverables);
    expect(result).not.toHaveProperty('isError');
  });

  it('DB error (unique violation): returns isError true with failure message', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'duplicate key value violates unique constraint' } }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_scope']({
      project_id: baseScopeDefinition.project_id,
      deliverables: 'Some deliverables',
    }) as { content: Array<{ type: string; text: string }>; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to create scope');
  });
});

describe('get_scope', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns scope definition', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                single: async () => ({ data: baseScopeDefinition, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['get_scope']({
      project_id: baseScopeDefinition.project_id,
    }) as { content: Array<{ type: string; text: string }> };

    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.id).toBe(baseScopeDefinition.id);
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

    const result = await handlers['get_scope']({
      project_id: baseScopeDefinition.project_id,
    }) as { content: Array<{ type: string; text: string }>; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No scope definition found');
  });
});

describe('update_scope', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: modifies deliverables and returns updated scope', async () => {
    const updatedScope = { ...baseScopeDefinition, deliverables: 'Redesign 10 pages' };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              is: () => ({
                select: () => ({
                  single: async () => ({ data: updatedScope, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['update_scope']({
      project_id: baseScopeDefinition.project_id,
      deliverables: 'Redesign 10 pages',
    }) as { content: Array<{ type: string; text: string }> };

    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.deliverables).toBe('Redesign 10 pages');
    expect(result).not.toHaveProperty('isError');
  });

  it('no fields to update: returns isError true without calling DB', async () => {
    const result = await handlers['update_scope']({
      project_id: baseScopeDefinition.project_id,
    }) as { isError: boolean; content: Array<{ text: string }> };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('No fields to update');
    expect(mockWithUserContext).not.toHaveBeenCalled();
  });
});

describe('log_scope_change', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: inserts scope_changes with out_of_scope classification', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: baseScopeChange, error: null }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['log_scope_change']({
      project_id: baseScopeChange.project_id,
      description: baseScopeChange.description,
      classification: 'out_of_scope',
    }) as { content: Array<{ type: string; text: string }> };

    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.classification).toBe('out_of_scope');
    expect(result).not.toHaveProperty('isError');
  });

  it('success: with needs_review classification', async () => {
    const needsReviewChange = { ...baseScopeChange, classification: 'needs_review' };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: needsReviewChange, error: null }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['log_scope_change']({
      project_id: baseScopeChange.project_id,
      description: 'Something that needs review',
      classification: 'needs_review',
    }) as { content: Array<{ type: string; text: string }> };

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.classification).toBe('needs_review');
    expect(result).not.toHaveProperty('isError');
  });

  it('DB error: returns isError true', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'insert failed' } }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['log_scope_change']({
      project_id: baseScopeChange.project_id,
      description: 'Some change',
      classification: 'in_scope',
    }) as { isError: boolean; content: Array<{ text: string }> };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to log scope change');
  });
});

describe('list_scope_changes', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('basic: returns scope_changes array for project_id', async () => {
    const changes = [baseScopeChange, { ...baseScopeChange, id: 'another-id', description: 'Another change' }];

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                order: () => ({
                  range: async () => ({ data: changes, error: null, count: 2 }),
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['list_scope_changes']({
      project_id: baseScopeChange.project_id,
      sort_by: 'requested_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    }) as { content: Array<{ type: string; text: string }> };

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.scope_changes).toHaveLength(2);
    expect(parsed.total).toBe(2);
    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
  });

  it('with classification filter: calls eq for classification', async () => {
    const eqCalls: Array<[string, unknown]> = [];

    // Build a chainable mock that records all eq() calls
    const makeChain = (): Record<string, unknown> => ({
      eq: (field: string, val: unknown) => {
        eqCalls.push([field, val]);
        return makeChain();
      },
      is: () => makeChain(),
      order: () => makeChain(),
      range: async () => ({ data: [baseScopeChange], error: null, count: 1 }),
    });

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => makeChain(),
        }),
      } as never);
    });

    await handlers['list_scope_changes']({
      project_id: baseScopeChange.project_id,
      classification: 'out_of_scope',
      sort_by: 'requested_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });

    const classificationCall = eqCalls.find(([field]) => field === 'classification');
    expect(classificationCall).toBeDefined();
    expect(classificationCall?.[1]).toBe('out_of_scope');
  });
});

describe('check_scope', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('scope exists: returns scope object and scope_changes array with request_description', async () => {
    const changes = [baseScopeChange];

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      // The handler uses Promise.all with two parallel queries inside one withUserContext
      // We need to mock the db object to handle two separate from() chains
      let callCount = 0;
      return fn({
        from: (table: string) => {
          callCount++;
          if (table === 'scope_definitions') {
            return {
              select: () => ({
                eq: () => ({
                  is: () => ({
                    maybeSingle: async () => ({ data: baseScopeDefinition, error: null }),
                  }),
                }),
              }),
            };
          }
          // scope_changes
          return {
            select: () => ({
              eq: () => ({
                is: () => ({
                  order: async () => ({ data: changes, error: null }),
                }),
              }),
            }),
          };
        },
      } as never);
    });

    const result = await handlers['check_scope']({
      project_id: baseScopeDefinition.project_id,
      request_description: 'Client wants a new landing page',
    }) as { content: Array<{ type: string; text: string }> };

    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.scope).toBeDefined();
    expect(parsed.scope.id).toBe(baseScopeDefinition.id);
    expect(parsed.scope_changes).toHaveLength(1);
    expect(parsed.request_description).toBe('Client wants a new landing page');
    expect(result).not.toHaveProperty('isError');
  });

  it('no scope defined: returns scope null with explicit message', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: (table: string) => {
          if (table === 'scope_definitions') {
            return {
              select: () => ({
                eq: () => ({
                  is: () => ({
                    maybeSingle: async () => ({ data: null, error: null }),
                  }),
                }),
              }),
            };
          }
          // scope_changes — return empty array
          return {
            select: () => ({
              eq: () => ({
                is: () => ({
                  order: async () => ({ data: [], error: null }),
                }),
              }),
            }),
          };
        },
      } as never);
    });

    const result = await handlers['check_scope']({
      project_id: baseScopeDefinition.project_id,
      request_description: 'Client wants a new landing page',
    }) as { content: Array<{ type: string; text: string }> };

    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.scope).toBeNull();
    expect(parsed.scope_changes).toHaveLength(0);
    expect(parsed.request_description).toBe('Client wants a new landing page');
    expect(parsed.message).toContain('No scope has been defined');
    expect(result).not.toHaveProperty('isError');
  });
});
