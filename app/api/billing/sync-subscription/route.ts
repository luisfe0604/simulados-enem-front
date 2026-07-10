import { NextRequest, NextResponse } from "next/server";
import { handleRoute, badRequest, notFound } from "@/lib/api";
import { syncCustomerSubscription } from "@/lib/services/billing";

// Rota utilitária de sincronização manual (sem auth de sessão, igual ao backend).
// Não é chamada pelo frontend, mas mantida para paridade com o sistema antigo.
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const { customer_id } = await req.json();
    if (!customer_id) return badRequest("customer_id é obrigatório");

    try {
      const result = await syncCustomerSubscription(customer_id);
      return NextResponse.json({ success: true, ...result });
    } catch (err) {
      if (err instanceof Error && err.message === "CUSTOMER_NOT_FOUND") {
        return notFound("Usuário não encontrado com esse customer_id");
      }
      throw err;
    }
  });
}
