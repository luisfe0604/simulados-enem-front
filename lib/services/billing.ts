import pool from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Portado de billing.service.js. Uma URL de frontend só (o app do ENEM);
// no backend antigo isso variava entre FRONTEND_URL e FRONTEND_ENEM_URL.
function getAppUrl(origin: string): string {
  return process.env.APP_URL || origin;
}

export async function createCheckoutSession(
  user: { id: number; email: string },
  origin: string,
): Promise<{ url: string | null }> {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_PRICE_ID não configurada");

  const appUrl = getAppUrl(origin);

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    metadata: { userId: String(user.id) },
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 7 },
    success_url: `${appUrl}/`,
    cancel_url: `${appUrl}/conta`,
  });

  return { url: session.url };
}

export async function cancelSubscription(userId: number): Promise<{ message: string }> {
  const result = await pool.query<{ gateway_subscription_id: string | null }>(
    "SELECT gateway_subscription_id FROM public.users WHERE id = $1",
    [userId],
  );
  const user = result.rows[0];

  if (!user || !user.gateway_subscription_id) {
    throw new Error("SUBSCRIPTION_NOT_FOUND");
  }

  await getStripe().subscriptions.update(user.gateway_subscription_id, {
    cancel_at_period_end: true,
  });

  return { message: "Assinatura será cancelada ao final do período" };
}

export async function reactivateSubscription(userId: number): Promise<{ message: string }> {
  const result = await pool.query<{ gateway_subscription_id: string | null }>(
    "SELECT gateway_subscription_id FROM public.users WHERE id = $1",
    [userId],
  );
  const user = result.rows[0];

  if (!user || !user.gateway_subscription_id) {
    throw new Error("SUBSCRIPTION_NOT_FOUND");
  }

  await getStripe().subscriptions.update(user.gateway_subscription_id, {
    cancel_at_period_end: false,
  });

  return { message: "Assinatura reativada com sucesso" };
}

export async function getSubscriptionStatus(userId: number) {
  const result = await pool.query(
    `SELECT subscription_status, cancel_at_period_end,
            subscription_cancelled_at, plan, is_admin
       FROM public.users
       WHERE id = $1`,
    [userId],
  );

  const user = result.rows[0];
  if (!user) throw new Error("USER_NOT_FOUND");

  return user;
}

export async function syncCustomerSubscription(customerId: string) {
  const stripe = getStripe();

  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });

  if (!subs.data.length) {
    await pool.query(
      `UPDATE public.users
         SET subscription_status = 'canceled', gateway_subscription_id = NULL
         WHERE gateway_customer_id = $1`,
      [customerId],
    );
    return { message: "Cliente sem subscriptions" };
  }

  const sorted = [...subs.data].sort((a, b) => b.created - a.created);
  const priorityOrder = ["active", "trialing", "past_due", "incomplete"];

  let selectedSub = null;
  for (const status of priorityOrder) {
    selectedSub = sorted.find((s) => s.status === status);
    if (selectedSub) break;
  }
  if (!selectedSub) selectedSub = sorted[0];

  let finalStatus: string = selectedSub.status;
  if (finalStatus === "incomplete_expired") finalStatus = "canceled";

  const canceledAt = selectedSub.canceled_at
    ? new Date(selectedSub.canceled_at * 1000)
    : null;
  const trialEnd = selectedSub.trial_end
    ? new Date(selectedSub.trial_end * 1000)
    : null;

  const result = await pool.query(
    `UPDATE public.users
       SET subscription_status = $1,
           gateway_subscription_id = $2,
           cancel_at_period_end = $3,
           subscription_cancelled_at = $4,
           trial_end = $5
       WHERE gateway_customer_id = $6
       RETURNING id`,
    [
      finalStatus,
      selectedSub.id,
      selectedSub.cancel_at_period_end,
      canceledAt,
      trialEnd,
      customerId,
    ],
  );

  if (result.rowCount === 0) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  return {
    message: "Customer sincronizado com sucesso",
    data: {
      subscription_id: selectedSub.id,
      status: finalStatus,
      trial_end: trialEnd,
    },
  };
}
