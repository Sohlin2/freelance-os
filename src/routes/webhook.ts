import type { RequestHandler } from 'express';
import Stripe from 'stripe';
import { randomBytes, createHash } from 'node:crypto';
import { createAdminClient } from '../lib/supabase.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `fos_live_${randomBytes(24).toString('hex')}`;
  const prefix = raw.slice(0, 12);
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, prefix, hash };
}

export const handleStripeWebhook: RequestHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: `Webhook verification failed: ${message}` });
    return;
  }

  const db = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_email ?? session.customer_details?.email;
        const plan = session.metadata?.plan ?? 'monthly';
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;

        if (!email) {
          res.status(400).json({ error: 'No email in checkout session' });
          return;
        }

        // Create or find Supabase auth user (create-first is idempotent)
        let userId: string;
        const { data: newUser, error: createError } = await db.auth.admin.createUser({
          email,
          email_confirm: true,
        });

        if (newUser?.user) {
          userId = newUser.user.id;
        } else if (createError?.message?.includes('already been registered')) {
          // User exists — look up by email via auth schema
          const { data: found } = await db.rpc('get_user_id_by_email', { p_email: email });
          if (!found) {
            res.status(500).json({ error: 'User exists but could not be resolved' });
            return;
          }
          userId = found as string;
        } else {
          res.status(500).json({ error: `Failed to create user: ${createError?.message}` });
          return;
        }

        // Resolve current_period_end — lifetime gets far-future, monthly fetches from Stripe
        let periodEnd: string;
        if (plan === 'lifetime') {
          periodEnd = new Date('2099-12-31').toISOString();
        } else if (subscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
        } else {
          // Fallback: 30 days from now (subscription.updated will correct it)
          periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }

        await db.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan,
            status: 'active',
            current_period_end: periodEnd,
          },
          { onConflict: 'stripe_customer_id' }
        );

        // Generate API key
        const key = generateApiKey();
        await db.from('api_keys').insert({
          user_id: userId,
          key_prefix: key.prefix,
          key_hash: key.hash,
          name: `Auto-generated (${plan})`,
        });

        // Store raw key for one-time retrieval via success page edge function
        // Use the checkout session ID as the retrieval token (unique, already in the success URL)
        await db.from('api_key_deliveries').insert({
          retrieval_token: session.id,
          api_key_raw: key.raw,
          email,
          plan,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await db
          .from('subscriptions')
          .update({
            status: sub.status === 'active' ? 'active' : sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await db
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await db
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription as string);
        }
        break;
      }
    }

    // Structured webhook log
    console.log(JSON.stringify({
      level: 'info',
      source: 'stripe_webhook',
      event_type: event.type,
      event_id: event.id,
      timestamp: new Date().toISOString(),
    }));

    // Auto-cleanup expired API key deliveries (piggyback on webhook traffic)
    await db.from('api_key_deliveries')
      .delete()
      .lt('expires_at', new Date().toISOString());

    res.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({
      level: 'error',
      source: 'stripe_webhook',
      event_type: event.type,
      event_id: event.id,
      error: message,
      timestamp: new Date().toISOString(),
    }));
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
