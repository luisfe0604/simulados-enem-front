import type Stripe from "stripe";
import pool from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Portado de webhook.service.js. Recebe o corpo BRUTO (string) e a assinatura,
// valida via Stripe e aplica os efeitos no banco.
export async function handleStripeWebhook(
  rawBody: string,
  signature: string,
): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET não configurada");

  const stripe = getStripe();

  // constructEventAsync usa WebCrypto e é o recomendado em runtimes serverless.
  const event = await stripe.webhooks.constructEventAsync(
    rawBody,
    signature,
    webhookSecret,
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (!session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );

      const trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null;

      await pool.query(
        `UPDATE public.users
           SET subscription_status = $2,
               plan = 'premium',
               trial_end = $3,
               subscription_started_at = NOW(),
               gateway_customer_id = $4,
               gateway_subscription_id = $5
           WHERE id = $1`,
        [
          userId,
          subscription.status,
          trialEnd,
          session.customer,
          session.subscription,
        ],
      );
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      await pool.query(
        `UPDATE public.users SET subscription_status = 'active'
           WHERE gateway_customer_id = $1`,
        [invoice.customer],
      );
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const canceledAt = subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null;

      await pool.query(
        `UPDATE public.users
           SET subscription_status = $1,
               cancel_at_period_end = $2,
               subscription_cancelled_at = $3
           WHERE gateway_subscription_id = $4`,
        [
          subscription.status,
          subscription.cancel_at_period_end,
          canceledAt,
          subscription.id,
        ],
      );
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await pool.query(
        `UPDATE public.users SET subscription_status = 'past_due'
           WHERE gateway_customer_id = $1`,
        [invoice.customer],
      );
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await pool.query(
        `UPDATE public.users
           SET subscription_status = 'canceled', cancel_at_period_end = false
           WHERE gateway_subscription_id = $1`,
        [subscription.id],
      );
      break;
    }
  }
}
