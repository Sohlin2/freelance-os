import type { RequestHandler } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const handleCheckout: RequestHandler = async (req, res) => {
  const { email, plan = 'monthly' } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const priceId =
    plan === 'lifetime'
      ? process.env.STRIPE_PRICE_ID_LIFETIME!
      : process.env.STRIPE_PRICE_ID_MONTHLY!;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: plan === 'lifetime' ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      ...(plan === 'monthly' ? { subscription_data: { trial_period_days: 7 } } : {}),
      success_url: `${process.env.SUPABASE_URL}/functions/v1/get-api-key?token={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL ?? 'https://freelance-os-production.up.railway.app'}/cancel`,
      metadata: { plan },
    });

    res.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Checkout failed: ${message}` });
  }
};
