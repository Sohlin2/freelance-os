import type { RequestHandler } from 'express';
import { createAdminClient } from '../lib/supabase.js';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export const apiKeyAuthMiddleware: RequestHandler = async (req, res, next) => {
  const xApiKey = req.headers['x-api-key'] as string | undefined;
  const authHeader = req.headers.authorization;
  const apiKey = xApiKey || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined);
  if (!apiKey) {
    res.status(401).json({ error: 'Missing API key. Provide X-API-Key or Authorization: Bearer <key>' });
    return;
  }
  try {
    const { data: userId, error } = await createAdminClient().rpc('validate_api_key', { p_key: apiKey });
    if (error || !userId) {
      res.status(401).json({ error: 'Invalid or revoked API key.' });
      return;
    }
    req.userId = userId as string;
    next();
  } catch {
    res.status(500).json({ error: 'Auth service unavailable.' });
  }
};
