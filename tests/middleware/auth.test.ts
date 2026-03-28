import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Mock the supabase module BEFORE importing auth middleware
vi.mock('../../src/lib/supabase.js', () => {
  const mockRpc = vi.fn();
  return {
    createAdminClient: vi.fn(() => ({
      rpc: mockRpc,
    })),
    __mockRpc: mockRpc,
  };
});

import { apiKeyAuthMiddleware } from '../../src/middleware/auth.js';
import { createAdminClient } from '../../src/lib/supabase.js';

function createMockReq(headers: Record<string, string> = {}): Partial<Request> {
  return { headers };
}

function createMockRes(): Partial<Response> & { statusCode: number; body: unknown } {
  const res: any = { statusCode: 0, body: null };
  res.status = vi.fn((code: number) => { res.statusCode = code; return res; });
  res.json = vi.fn((data: unknown) => { res.body = data; return res; });
  return res;
}

describe('apiKeyAuthMiddleware', () => {
  let mockRpc: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc = (createAdminClient() as any).rpc;
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = createMockReq({});
    const res = createMockRes();
    const next = vi.fn();
    await apiKeyAuthMiddleware(req as Request, res as Response, next as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: expect.stringContaining('Missing API key') });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const req = createMockReq({ authorization: 'Basic abc123' });
    const res = createMockRes();
    const next = vi.fn();
    await apiKeyAuthMiddleware(req as Request, res as Response, next as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when validate_api_key returns null (invalid key)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const req = createMockReq({ authorization: 'Bearer fos_live_invalid' });
    const res = createMockRes();
    const next = vi.fn();
    await apiKeyAuthMiddleware(req as Request, res as Response, next as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: expect.stringContaining('Invalid or revoked') });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when validate_api_key returns an error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const req = createMockReq({ authorization: 'Bearer fos_live_broken' });
    const res = createMockRes();
    const next = vi.fn();
    await apiKeyAuthMiddleware(req as Request, res as Response, next as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.userId and calls next() for valid API key', async () => {
    const fakeUserId = '550e8400-e29b-41d4-a716-446655440000';
    mockRpc.mockResolvedValue({ data: fakeUserId, error: null });
    const req = createMockReq({ authorization: 'Bearer fos_live_validkey123' });
    const res = createMockRes();
    const next = vi.fn();
    await apiKeyAuthMiddleware(req as Request, res as Response, next as NextFunction);
    expect((req as any).userId).toBe(fakeUserId);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls validate_api_key with the key after "Bearer "', async () => {
    mockRpc.mockResolvedValue({ data: 'some-id', error: null });
    const req = createMockReq({ authorization: 'Bearer fos_live_mykey' });
    const res = createMockRes();
    const next = vi.fn();
    await apiKeyAuthMiddleware(req as Request, res as Response, next as NextFunction);
    expect(mockRpc).toHaveBeenCalledWith('validate_api_key', { p_key: 'fos_live_mykey' });
  });
});
