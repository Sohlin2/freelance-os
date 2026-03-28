import type { RequestHandler } from 'express';
import { createAdminClient } from '../lib/supabase.js';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export const apiKeyAuthMiddleware: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing API key. Provide Authorization: Bearer <key>' });
    return;
  }
  const apiKey = authHeader.slice(7);
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
