"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";

interface Subscription {
  subscription_status: string;
  plan: string;
  cancel_at_period_end?: boolean;
  current_period_end?: string;
}

interface User {
  name: string;
  email: string;
}

export default function ContaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function loadData() {
    try {
      const sub = await apiFetch<Subscription>("/billing/subscription");
      const me = await apiFetch<User>("/users/me");
      setSubscription(sub);
      setUser(me);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    try {
      const data = await apiFetch<{ url: string }>(
        "/billing/create-checkout-session",
        { method: "POST", body: JSON.stringify({ system: "enem" }) },
      );
      window.location.href = data.url;
    } catch {
      setError("Erro ao iniciar assinatura");
    }
  }

  async function handleCancel() {
    if (!window.confirm("Tem certeza que deseja cancelar?")) return;
    await apiFetch("/billing/subscription/cancel", { method: "POST" });
    loadData();
  }

  async function handleReactivate() {
    await apiFetch("/billing/subscription/reactivate", { method: "POST" });
    loadData();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card p-6">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton mt-3 h-8 w-48" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton h-3 w-16" />
                <div className="skeleton mt-2 h-5 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!subscription || !user) return null;

  const isActive = ["active", "trialing", "trial"].includes(
    subscription.subscription_status,
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-6">
        <p className="eyebrow">Conta</p>
        <h1 className="mt-1 text-3xl font-bold text-text-primary">Minha Conta</h1>
        <p className="mt-1 text-sm text-text-muted">
          Gerencie sua assinatura e seus dados
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" value={user.name} />
          <Field label="Email" value={user.email} />
          <Field label="Plano" value={subscription.plan} />
          <Field
            label="Expira em"
            value={
              subscription.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
                : "-"
            }
          />
          <div className="sm:col-span-2">
            <span className="field-label">Status</span>
            <div className="mt-1">
              <span className={`badge ${isActive ? "badge-success" : "badge-muted"}`}>
                {subscription.subscription_status}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mt-6">
          {!isActive && (
            <button onClick={handleSubscribe} className="btn btn-primary">
              Assinar
            </button>
          )}
          {isActive && !subscription.cancel_at_period_end && (
            <button onClick={handleCancel} className="btn btn-danger">
              Cancelar assinatura
            </button>
          )}
          {subscription.cancel_at_period_end && (
            <button onClick={handleReactivate} className="btn btn-primary">
              Reativar assinatura
            </button>
          )}
        </div>

        {subscription.cancel_at_period_end && (
          <p className="mt-3 text-sm text-text-muted">
            Sua assinatura será cancelada ao final do período.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <p className="mt-0.5 font-medium text-text-primary">{value}</p>
    </div>
  );
}
