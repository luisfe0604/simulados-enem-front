import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { requireAdmin } from "@/lib/authz";
import pool from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Portado de removeSubscription do backend. O original tinha um bug (referenciava
// `userService` e `stripe` não importados naquele módulo, quebrando em runtime).
// Aqui: busca a assinatura no gateway, cancela se existir, e zera o plano.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    await requireAdmin();
    const { id } = await params;

    const { rows } = await pool.query(
      "SELECT gateway_subscription_id FROM public.users WHERE id = $1",
      [id],
    );
    const user = rows[0];

    if (user?.gateway_subscription_id) {
      try {
        await getStripe().subscriptions.cancel(user.gateway_subscription_id);
      } catch (err) {
        // Se a assinatura já não existe no Stripe, seguimos limpando o banco
        console.error("Falha ao cancelar assinatura no Stripe:", err);
      }
    }

    const result = await pool.query(
      `UPDATE public.users
         SET plan = 'free',
             subscription_status = 'inactive',
             gateway_subscription_id = NULL
         WHERE id = $1
         RETURNING id, name, email, plan, subscription_status, is_admin`,
      [id],
    );

    return NextResponse.json(result.rows[0]);
  });
}
