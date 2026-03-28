import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock withUserContext BEFORE importing the module under test
vi.mock('../../src/lib/with-user-context.js', () => ({
  withUserContext: vi.fn(),
}));

import { registerFollowUpTools } from '../../src/tools/follow-ups.js';
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
  registerFollowUpTools(server, userId);
  return handlers;
}

const baseFollowUp = {
  id: '550e8400-e29b-41d4-a716-446655440006',
  user_id: 'test-user-id',
  client_id: '550e8400-e29b-41d4-a716-446655440010',
  project_id: '550e8400-e29b-41d4-a716-446655440020',
  type: 'invoice_overdue',
  subject: 'Invoice #INV-001 payment reminder',
  content: 'Hi, just a friendly reminder that invoice #INV-001 for $6,600 is 15 days overdue.',
  sent_at: null,
  archived_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('create_followup', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: stores follow-up with type, subject, content', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: baseFollowUp, error: null }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_followup']({
      client_id: baseFollowUp.client_id,
      type: 'invoice_overdue',
      subject: baseFollowUp.subject,
      content: baseFollowUp.content,
    }) as { content: Array<{ type: string; text: string }> };

    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.type).toBe('invoice_overdue');
    expect(parsed.subject).toBe(baseFollowUp.subject);
    expect(parsed.content).toBe(baseFollowUp.content);
    expect(result).not.toHaveProperty('isError');
  });

  it('DB error: returns isError true with failure message', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'insert violation' } }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['create_followup']({
      client_id: baseFollowUp.client_id,
      subject: 'Test',
      content: 'Test content',
    }) as { content: Array<{ type: string; text: string }>; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to create follow-up');
  });
});

describe('get_followup', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns follow-up JSON', async () => {
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            eq: () => ({
              is: () => ({
                single: async () => ({ data: baseFollowUp, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['get_followup']({ followup_id: baseFollowUp.id }) as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.id).toBe(baseFollowUp.id);
    expect(parsed.type).toBe('invoice_overdue');
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

    const result = await handlers['get_followup']({ followup_id: baseFollowUp.id }) as { content: Array<{ type: string; text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found or has been archived');
  });
});

describe('list_followups', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('with client_id filter: returns follow-ups for that client', async () => {
    const followUps = [baseFollowUp, { ...baseFollowUp, id: 'second-id', type: 'check_in' }];

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              eq: () => ({
                order: () => ({
                  range: async () => ({ data: followUps, error: null, count: 2 }),
                }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['list_followups']({
      client_id: baseFollowUp.client_id,
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    }) as { content: Array<{ type: string; text: string }> };

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.follow_ups).toHaveLength(2);
    expect(parsed.total).toBe(2);
  });

  it('with project_id filter: applies eq on project_id', async () => {
    let projectIdFilterCalled = false;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              eq: (field: string) => {
                if (field === 'project_id') projectIdFilterCalled = true;
                return {
                  eq: () => ({
                    order: () => ({
                      range: async () => ({ data: [baseFollowUp], error: null, count: 1 }),
                    }),
                  }),
                  order: () => ({
                    range: async () => ({ data: [baseFollowUp], error: null, count: 1 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_followups']({
      project_id: baseFollowUp.project_id,
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });

    expect(projectIdFilterCalled).toBe(true);
  });

  it('with sent=false filter: uses is(sent_at, null) for drafts', async () => {
    let sentAtNullCalled = false;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: (field: string, value: unknown) => {
              if (field === 'sent_at' && value === null) sentAtNullCalled = true;
              return {
                order: () => ({
                  range: async () => ({ data: [baseFollowUp], error: null, count: 1 }),
                }),
              };
            },
          }),
        }),
      } as never);
    });

    await handlers['list_followups']({
      sent: false,
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });

    expect(sentAtNullCalled).toBe(true);
  });

  it('with sent=true filter: uses not(sent_at, is, null) for sent items', async () => {
    let notSentAtNullCalled = false;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          select: () => ({
            is: () => ({
              not: (field: string, op: string, value: unknown) => {
                if (field === 'sent_at' && op === 'is' && value === null) notSentAtNullCalled = true;
                return {
                  order: () => ({
                    range: async () => ({ data: [{ ...baseFollowUp, sent_at: '2026-01-02T00:00:00Z' }], error: null, count: 1 }),
                  }),
                };
              },
            }),
          }),
        }),
      } as never);
    });

    await handlers['list_followups']({
      sent: true,
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 20,
      offset: 0,
    });

    expect(notSentAtNullCalled).toBe(true);
  });
});

describe('update_followup', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns updated follow-up with new content', async () => {
    const updatedFollowUp = { ...baseFollowUp, content: 'Updated content for follow-up.' };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: updatedFollowUp, error: null }),
              }),
            }),
          }),
        }),
      } as never);
    });

    const result = await handlers['update_followup']({
      followup_id: baseFollowUp.id,
      content: 'Updated content for follow-up.',
    }) as { content: Array<{ type: string; text: string }> };

    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.content).toBe('Updated content for follow-up.');
    expect(result).not.toHaveProperty('isError');
  });

  it('no fields to update: returns isError without calling DB', async () => {
    const result = await handlers['update_followup']({
      followup_id: baseFollowUp.id,
    }) as { isError: boolean; content: Array<{ text: string }> };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('No fields to update');
    expect(mockWithUserContext).not.toHaveBeenCalled();
  });
});

describe('mark_followup_sent', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: sets sent_at to ISO timestamp and guards with .is(sent_at, null)', async () => {
    let isGuardCalled = false;
    let sentAtValue: string | null = null;

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: () => ({
          update: (data: Record<string, unknown>) => {
            sentAtValue = data['sent_at'] as string;
            return {
              eq: () => ({
                is: (field: string, value: unknown) => {
                  if (field === 'sent_at' && value === null) isGuardCalled = true;
                  return {
                    select: () => ({
                      single: async () => ({
                        data: { ...baseFollowUp, sent_at: sentAtValue },
                        error: null,
                      }),
                    }),
                  };
                },
              }),
            };
          },
        }),
      } as never);
    });

    const result = await handlers['mark_followup_sent']({
      followup_id: baseFollowUp.id,
    }) as { content: Array<{ type: string; text: string }> };

    expect(result.content[0].type).toBe('text');
    expect(isGuardCalled).toBe(true);
    expect(sentAtValue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.sent_at).toBeTruthy();
    expect(result).not.toHaveProperty('isError');
  });

  it('already sent: returns isError when no rows match .is(sent_at, null) guard', async () => {
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

    const result = await handlers['mark_followup_sent']({
      followup_id: baseFollowUp.id,
    }) as { isError: boolean; content: Array<{ text: string }> };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Follow-up not found or already marked as sent');
  });
});

describe('get_followup_context', () => {
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = captureTools();
  });

  it('success: returns client, outstanding_invoices, recent_follow_ups', async () => {
    const mockClient = {
      id: baseFollowUp.client_id,
      name: 'Acme Corp',
      email: 'acme@example.com',
      company: 'Acme Inc',
    };
    const mockInvoices = [
      {
        id: 'inv-1',
        invoice_number: 'INV-001',
        status: 'overdue',
        total: 6600,
        currency: 'USD',
        due_date: '2026-01-15',
        issued_at: '2026-01-01',
      },
    ];
    const mockFollowUps = [
      {
        id: baseFollowUp.id,
        type: 'invoice_overdue',
        subject: baseFollowUp.subject,
        sent_at: null,
        created_at: baseFollowUp.created_at,
      },
    ];

    // get_followup_context uses Promise.all for three parallel queries
    // We need to mock withUserContext to handle the Promise.all pattern
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      let callCount = 0;
      const makeChain = (returnData: unknown) => {
        callCount++;
        const currentCall = callCount;
        const chainObj: Record<string, unknown> = {};

        const terminal = {
          single: async () => {
            if (currentCall === 1) return { data: mockClient, error: null };
            return { data: returnData, error: null };
          },
        };

        const withIn = {
          ...terminal,
          in: () => withIn,
          eq: () => withIn,
          is: () => withIn,
          order: () => ({ ...withIn, limit: async () => ({ data: mockFollowUps, error: null }) }),
          limit: async () => ({ data: mockFollowUps, error: null }),
          then: (resolve: (v: unknown) => unknown) => {
            if (currentCall === 2) return Promise.resolve({ data: mockInvoices, error: null }).then(resolve);
            if (currentCall === 3) return Promise.resolve({ data: mockFollowUps, error: null }).then(resolve);
            return Promise.resolve({ data: mockClient, error: null }).then(resolve);
          },
        };

        chainObj['select'] = () => ({
          eq: () => ({
            single: async () => ({ data: mockClient, error: null }),
            is: () => ({
              in: () => ({
                then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: mockInvoices, error: null }).then(resolve),
              }),
              order: () => ({
                limit: () => ({
                  then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: mockFollowUps, error: null }).then(resolve),
                }),
              }),
            }),
          }),
        });

        return chainObj;
      };

      return fn({
        from: () => makeChain(null),
      } as never);
    });

    // Simpler mock that handles each individual query chain
    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      const fromCalls: string[] = [];
      return fn({
        from: (table: string) => {
          fromCalls.push(table);
          if (table === 'clients') {
            return {
              select: () => ({
                eq: () => ({
                  single: async () => ({ data: mockClient, error: null }),
                }),
              }),
            };
          }
          if (table === 'invoices') {
            return {
              select: () => ({
                eq: () => ({
                  is: () => ({
                    in: () => Promise.resolve({ data: mockInvoices, error: null }),
                  }),
                }),
              }),
            };
          }
          if (table === 'follow_ups') {
            return {
              select: () => ({
                eq: () => ({
                  is: () => ({
                    order: () => ({
                      limit: () => Promise.resolve({ data: mockFollowUps, error: null }),
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        },
      } as never);
    });

    const result = await handlers['get_followup_context']({
      client_id: baseFollowUp.client_id,
    }) as { content: Array<{ type: string; text: string }> };

    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveProperty('client');
    expect(parsed).toHaveProperty('outstanding_invoices');
    expect(parsed).toHaveProperty('recent_follow_ups');
    expect(parsed.client.name).toBe('Acme Corp');
    expect(result).not.toHaveProperty('isError');
  });

  it('no overdue invoices: returns empty outstanding_invoices array', async () => {
    const mockClient = {
      id: baseFollowUp.client_id,
      name: 'Acme Corp',
      email: 'acme@example.com',
      company: 'Acme Inc',
    };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: (table: string) => {
          if (table === 'clients') {
            return {
              select: () => ({
                eq: () => ({
                  single: async () => ({ data: mockClient, error: null }),
                }),
              }),
            };
          }
          if (table === 'invoices') {
            return {
              select: () => ({
                eq: () => ({
                  is: () => ({
                    in: () => Promise.resolve({ data: [], error: null }),
                  }),
                }),
              }),
            };
          }
          if (table === 'follow_ups') {
            return {
              select: () => ({
                eq: () => ({
                  is: () => ({
                    order: () => ({
                      limit: () => Promise.resolve({ data: [], error: null }),
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        },
      } as never);
    });

    const result = await handlers['get_followup_context']({
      client_id: baseFollowUp.client_id,
    }) as { content: Array<{ type: string; text: string }> };

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.outstanding_invoices).toEqual([]);
    expect(parsed.recent_follow_ups).toEqual([]);
    expect(parsed.client).toBeDefined();
  });

  it('with project_id: narrows invoice query to that project', async () => {
    let invoiceEqCalledWithProjectId = false;

    const mockClient = {
      id: baseFollowUp.client_id,
      name: 'Acme Corp',
      email: 'acme@example.com',
      company: null,
    };

    mockWithUserContext.mockImplementation(async (_userId, fn) => {
      return fn({
        from: (table: string) => {
          if (table === 'clients') {
            return {
              select: () => ({
                eq: () => ({
                  single: async () => ({ data: mockClient, error: null }),
                }),
              }),
            };
          }
          if (table === 'invoices') {
            return {
              select: () => ({
                eq: (field: string) => {
                  return {
                    is: () => ({
                      in: () => ({
                        eq: (f: string) => {
                          if (f === 'project_id') invoiceEqCalledWithProjectId = true;
                          return Promise.resolve({ data: [], error: null });
                        },
                      }),
                    }),
                    eq: (f: string) => {
                      if (f === 'project_id') invoiceEqCalledWithProjectId = true;
                      return {
                        is: () => ({
                          in: () => Promise.resolve({ data: [], error: null }),
                        }),
                      };
                    },
                  };
                },
              }),
            };
          }
          if (table === 'follow_ups') {
            return {
              select: () => ({
                eq: () => ({
                  is: () => ({
                    order: () => ({
                      limit: () => Promise.resolve({ data: [], error: null }),
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        },
      } as never);
    });

    await handlers['get_followup_context']({
      client_id: baseFollowUp.client_id,
      project_id: baseFollowUp.project_id,
    });

    // The test verifies that when project_id is provided, the implementation
    // adds an additional eq filter on project_id for invoices
    // We verify this by checking the result still returns the correct shape
    // (detailed query chain verification is in the implementation's acceptance criteria)
    expect(invoiceEqCalledWithProjectId).toBe(true);
  });
});
