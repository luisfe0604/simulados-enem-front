import { NextRequest, NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/services/webhook";

// O Stripe exige o corpo BRUTO para validar a assinatura — por isso lemos
// req.text() em vez de req.json(). Não há autenticação de sessão aqui: a
// autenticidade vem da assinatura do Stripe (STRIPE_WEBHOOK_SECRET).
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente" }, { status: 400 });
  }

  const rawBody = await req.text();

  try {
    await handleStripeWebhook(rawBody, signature);
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("Webhook error:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }
}
