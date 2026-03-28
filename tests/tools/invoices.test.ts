import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock withUserContext BEFORE importing the module under test
vi.mock('../../src/lib/with-user-context.js', () => ({
  withUserContext: vi.fn(),
}));

import { registerInvoiceTools } from '../../src/tools/invoices.js';
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
  registerInvoiceTools(server, userId);
  return handlers;
}

const baseInvoice = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  user_id: 'test-user-id',
  client_id: '550e8400-e29b-41d4-a716-446655440010',
  project_id: '550e8400-e29b-41d4-a716-446655440020',
  proposal_id: null,
  invoice_number: 'INV-001',
  status: 'draft',
  line_items: [
    { description: 'Website design', quantity: 1, unit: 'project', rate: 5000, amount: 5000 },
    { description: 'Content writing', quantity: 10, unit: 'hours', rate: 100, amount: 1000 },
  ],
  subtotal: 6000,
  tax_rate: 0.1,
  tax_amount: 600,
  total: 6600,
  currency: 'USD',
  issued_at: null,
  due_date: '2026-05-01',
  paid_at: null,
  notes: null,
  archived_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('create_invoice', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns created invoice with line_items as JSON text content', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: baseInvoice, error: null }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_invoice']({
      client_id: baseInvoice.client_id,
      project_id: baseInvoice.project_id,
      invoice_number: 'INV-001',
      line_items: baseInvoice.line_items,
      subtotal: 6000,
      tax_amount: 600,
      total: 6600,
      currency: 'USD',
    }) as { content: Array<{ type: string; text: string }> };

    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.invoice_number).toBe('INV-001');
    expect(parsed.line_items).toHaveLength(2);
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

    const result = await handlers['create_invoice']({
      client_id: baseInvoice.client_id,
      project_id: baseInvoice.project_id,
      invoice_number: 'INV-001',
    }) as { content: Array<{ type: string; text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to create invoice');
  });

  it('with proposal_id: includes proposal_id in insert', async () => {
    let insertArgs: Record<string, unknown> | null = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: (args: Record<string, unknown>) => {
            insertArgs = args;
            return {
              select: () => ({
                single: async () => ({
                  data: { ...baseInvoice, proposal_id: '550e8400-e29b-41d4-a716-446655440030' },
                  error: null,
                }),
              }),
            };
          },
        }),
      } as never);
    });

    await handlers['create_invoice']({
      client_id: baseInvoice.client_id,
      project_id: baseInvoice.project_id,
      invoice_number: 'INV-001',
      proposal_id: '550e8400-e29b-41d4-a716-446655440030',
    });

    expect(insertArgs).not.toBeNull();
    expect((insertArgs as Record<string, unknown>).proposal_id).toBe('550e8400-e29b-41d4-a716-446655440030');
  });
});

describe('get_invoice', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns invoice JSON', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                single: async () => ({ data: baseInvoice, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['get_invoice']({ invoice_id: baseInvoice.id }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.id).toBe(baseInvoice.id);
    expect(parsed.status).toBe('draft');
    expect(result).not.toHaveProperty('isError');
  });

  it('not found: returns isError true with archived message', async () => {
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

    const result = await handlers['get_invoice']({ invoice_id: baseInvoice.id }) as { content: Array<{ type: string; text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found or has been archived');
  });
});

describe('list_invoices', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('no filters: returns invoices array with total, limit, offset', async () => {
    const invoices = [baseInvoice, { ...baseInvoice, id: 'second-id', invoice_number: 'INV-002' }];

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              order: () => ({
                range: async () => ({ data: invoices, error: null, count: 2 }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['list_invoices']({
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    }) as { content: Array<{ type: string; text: string }> };

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.invoices).toHaveLength(2);
    expect(parsed.total).toBe(2);
    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
  });

  it('with status filter: calls .eq("status", status)', async () => {
    let eqCalled = false;
    let eqArgs: [string, unknown] | null = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              eq: (field: string, value: unknown) => {
                eqCalled = true;
                eqArgs = [field, value];
                return {
                  order: () => ({
                    range: async () => ({ data: [baseInvoice], error: null, count: 1 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_invoices']({
      status: 'paid',
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });
    expect(eqCalled).toBe(true);
    expect(eqArgs).toEqual(['status', 'paid']);
  });

  it('with client_id filter: calls .eq("client_id", id)', async () => {
    let eqCalled = false;
    let eqArgs: [string, unknown] | null = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              eq: (field: string, value: unknown) => {
                eqCalled = true;
                eqArgs = [field, value];
                return {
                  order: () => ({
                    range: async () => ({ data: [baseInvoice], error: null, count: 1 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_invoices']({
      client_id: baseInvoice.client_id,
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });
    expect(eqCalled).toBe(true);
    expect(eqArgs).toEqual(['client_id', baseInvoice.client_id]);
  });

  it('with date_from filter: calls .gte("issued_at", date_from)', async () => {
    let gteCalled = false;
    let gteArgs: [string, unknown] | null = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              gte: (field: string, value: unknown) => {
                gteCalled = true;
                gteArgs = [field, value];
                return {
                  order: () => ({
                    range: async () => ({ data: [], error: null, count: 0 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_invoices']({
      date_from: '2026-01-01',
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });
    expect(gteCalled).toBe(true);
    expect(gteArgs).toEqual(['issued_at', '2026-01-01']);
  });

  it('with date_to filter: calls .lte("issued_at", date_to)', async () => {
    let lteCalled = false;
    let lteArgs: [string, unknown] | null = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              lte: (field: string, value: unknown) => {
                lteCalled = true;
                lteArgs = [field, value];
                return {
                  order: () => ({
                    range: async () => ({ data: [], error: null, count: 0 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_invoices']({
      date_to: '2026-12-31',
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });
    expect(lteCalled).toBe(true);
    expect(lteArgs).toEqual(['issued_at', '2026-12-31']);
  });
});

describe('update_invoice', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: changes status and returns updated invoice', async () => {
    const updatedInvoice = { ...baseInvoice, status: 'sent' };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: updatedInvoice, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['update_invoice']({
      invoice_id: baseInvoice.id,
      status: 'sent',
    }) as { content: Array<{ type: string; text: string }> };

    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe('sent');
    expect(result).not.toHaveProperty('isError');
  });

  it('no fields to update: returns isError true without calling DB', async () => {
    const result = await handlers['update_invoice']({
      invoice_id: baseInvoice.id,
    }) as { isError: boolean; content: Array<{ text: string }> };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('No fields to update');
    expect(mockWithUserContext).not.toHaveBeenCalled();
  });

  it('DB error: returns isError true with failure message', async () => {
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

    const result = await handlers['update_invoice']({
      invoice_id: baseInvoice.id,
      status: 'void',
    }) as { isError: boolean; content: Array<{ text: string }> };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to update invoice');
  });
});
