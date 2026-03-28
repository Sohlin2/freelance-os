import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock withUserContext BEFORE importing the module under test
vi.mock('../../src/lib/with-user-context.js', () => ({
  withUserContext: vi.fn(),
}));

import { registerProposalTools } from '../../src/tools/proposals.js';
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
  registerProposalTools(server, userId);
  return handlers;
}

const baseProposal = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  user_id: 'test-user-id',
  client_id: '550e8400-e29b-41d4-a716-446655440010',
  project_id: '550e8400-e29b-41d4-a716-446655440020',
  title: 'Website Redesign Proposal',
  content: 'Redesign 5 pages with responsive layout',
  status: 'draft',
  amount: 5000,
  currency: 'USD',
  valid_until: '2026-04-30',
  sent_at: null,
  responded_at: null,
  archived_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const baseScope = {
  id: '660e8400-e29b-41d4-a716-446655440030',
  user_id: 'test-user-id',
  project_id: '550e8400-e29b-41d4-a716-446655440020',
  deliverables: 'Redesign 5 pages with responsive layout',
  boundaries: null,
  assumptions: null,
  exclusions: null,
  archived_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('create_proposal', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns created proposal as JSON text content', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: baseProposal, error: null }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_proposal']({
      client_id: baseProposal.client_id,
      project_id: baseProposal.project_id,
      title: 'Website Redesign Proposal',
      currency: 'USD',
    }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.title).toBe('Website Redesign Proposal');
    expect(result).not.toHaveProperty('isError');
  });

  it('DB error: returns isError true with failure message', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'FK violation' } }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_proposal']({
      client_id: baseProposal.client_id,
      project_id: baseProposal.project_id,
      title: 'Test',
      currency: 'USD',
    }) as { content: Array<{ type: string; text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to create proposal');
  });

  it('exception: returns isError true', async () => {
    mockWithUserContext.mockImplementation(async () => {
      throw new Error('Network error');
    });

    const result = await handlers['create_proposal']({
      client_id: baseProposal.client_id,
      project_id: baseProposal.project_id,
      title: 'Test',
      currency: 'USD',
    }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to create proposal');
  });
});

describe('get_proposal', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns proposal JSON', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                single: async () => ({ data: baseProposal, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['get_proposal']({ proposal_id: baseProposal.id }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.id).toBe(baseProposal.id);
    expect(result).not.toHaveProperty('isError');
  });

  it('not found: returns isError true with not found message', async () => {
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

    const result = await handlers['get_proposal']({ proposal_id: baseProposal.id }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found');
  });
});

describe('list_proposals', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('no filters: returns proposals array with total/limit/offset', async () => {
    const proposals = [baseProposal, { ...baseProposal, id: 'second-id', title: 'Another Proposal' }];

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              order: () => ({
                range: async () => ({ data: proposals, error: null, count: 2 }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['list_proposals']({
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    }) as { content: Array<{ type: string; text: string }> };
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.proposals).toHaveLength(2);
    expect(parsed.total).toBe(2);
    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
  });

  it('with project_id filter: calls .eq("project_id", id)', async () => {
    let eqField: string | null = null;
    let eqValue: unknown = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              eq: (field: string, value: unknown) => {
                eqField = field;
                eqValue = value;
                return {
                  order: () => ({
                    range: async () => ({ data: [baseProposal], error: null, count: 1 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_proposals']({
      project_id: baseProposal.project_id,
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });
    expect(eqField).toBe('project_id');
    expect(eqValue).toBe(baseProposal.project_id);
  });

  it('with client_id filter: calls .eq("client_id", id)', async () => {
    let eqField: string | null = null;
    let eqValue: unknown = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              eq: (field: string, value: unknown) => {
                eqField = field;
                eqValue = value;
                return {
                  order: () => ({
                    range: async () => ({ data: [baseProposal], error: null, count: 1 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_proposals']({
      client_id: baseProposal.client_id,
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });
    expect(eqField).toBe('client_id');
    expect(eqValue).toBe(baseProposal.client_id);
  });

  it('with status filter: calls .eq("status", status)', async () => {
    let eqField: string | null = null;
    let eqValue: unknown = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              eq: (field: string, value: unknown) => {
                eqField = field;
                eqValue = value;
                return {
                  order: () => ({
                    range: async () => ({ data: [baseProposal], error: null, count: 1 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_proposals']({
      status: 'draft',
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });
    expect(eqField).toBe('status');
    expect(eqValue).toBe('draft');
  });
});

describe('update_proposal', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns updated proposal', async () => {
    const updatedProposal = { ...baseProposal, title: 'Updated Title', status: 'sent' };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: updatedProposal, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['update_proposal']({
      proposal_id: baseProposal.id,
      title: 'Updated Title',
      status: 'sent',
    }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.title).toBe('Updated Title');
    expect(result).not.toHaveProperty('isError');
  });

  it('no fields to update: returns isError true with "No fields to update"', async () => {
    const result = await handlers['update_proposal']({
      proposal_id: baseProposal.id,
    }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('No fields to update');
    expect(mockWithUserContext).not.toHaveBeenCalled();
  });
});

describe('accept_proposal', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns updated proposal and created scope', async () => {
    const acceptedProposal = { ...baseProposal, status: 'accepted', responded_at: '2026-01-02T00:00:00Z' };
    let callCount = 0;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: (table: string) => {
          if (table === 'proposals' && callCount === 0) {
            // Step 1: fetch proposal
            callCount++;
            return {
              select: () => ({
                eq: () => ({
                  is: () => ({
                    single: async () => ({ data: baseProposal, error: null }),
                  }),
                }),
              }),
            };
          } else if (table === 'proposals' && callCount === 1) {
            // Step 2: update status
            callCount++;
            return {
              update: () => ({
                eq: () => ({
                  select: () => ({
                    single: async () => ({ data: acceptedProposal, error: null }),
                  }),
                }),
              }),
            };
          } else {
            // Step 3: upsert scope_definitions
            return {
              upsert: () => ({
                select: () => ({
                  single: async () => ({ data: baseScope, error: null }),
                }),
              }),
            };
          }
        },
      } as never);
    });

    const result = await handlers['accept_proposal']({ proposal_id: baseProposal.id }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.proposal.status).toBe('accepted');
    expect(parsed.scope).not.toBeNull();
    expect(result).not.toHaveProperty('isError');
  });

  it('proposal not found: returns isError true', async () => {
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

    const result = await handlers['accept_proposal']({ proposal_id: baseProposal.id }) as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Proposal not found');
  });

  it('scope upsert uses onConflict "project_id"', async () => {
    const acceptedProposal = { ...baseProposal, status: 'accepted', responded_at: '2026-01-02T00:00:00Z' };
    let upsertOptions: Record<string, unknown> | null = null;
    let callCount = 0;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: (table: string) => {
          if (table === 'proposals' && callCount === 0) {
            callCount++;
            return {
              select: () => ({
                eq: () => ({
                  is: () => ({
                    single: async () => ({ data: baseProposal, error: null }),
                  }),
                }),
              }),
            };
          } else if (table === 'proposals' && callCount === 1) {
            callCount++;
            return {
              update: () => ({
                eq: () => ({
                  select: () => ({
                    single: async () => ({ data: acceptedProposal, error: null }),
                  }),
                }),
              }),
            };
          } else {
            // scope_definitions upsert
            return {
              upsert: (_data: unknown, options: Record<string, unknown>) => {
                upsertOptions = options;
                return {
                  select: () => ({
                    single: async () => ({ data: baseScope, error: null }),
                  }),
                };
              },
            };
          }
        },
      } as never);
    });

    await handlers['accept_proposal']({ proposal_id: baseProposal.id });
    expect(upsertOptions).not.toBeNull();
    expect(upsertOptions!['onConflict']).toBe('project_id');
  });
});
