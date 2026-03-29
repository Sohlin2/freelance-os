import type { RequestHandler } from 'express';
import Stripe from 'stripe';
import { createAdminClient } from '../lib/supabase.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const handlePortalSession: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const { data, error } = await createAdminClient()
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      res.status(404).json({ error: 'No subscription found.' });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${process.env.APP_URL ?? 'https://freelance-os-production.up.railway.app'}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Portal session failed: ${message}` });
  }
};
