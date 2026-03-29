import type { RequestHandler } from 'express';
import { createAdminClient } from '../lib/supabase.js';

export const billingMiddleware: RequestHandler = async (req, res, next) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const { data, error } = await createAdminClient()
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      res.status(403).json({
        error: 'No active subscription. Visit https://freelance-os-production.up.railway.app to subscribe.',
        code: 'SUBSCRIPTION_REQUIRED',
      });
      return;
    }

    if (data.current_period_end && new Date(data.current_period_end) < new Date()) {
      res.status(403).json({
        error: 'Subscription expired. Visit https://freelance-os-production.up.railway.app to renew.',
        code: 'SUBSCRIPTION_EXPIRED',
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({ error: 'Billing service unavailable' });
  }
};
