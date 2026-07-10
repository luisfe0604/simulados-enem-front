"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/client-api";

interface UserDetails {
  id: number;
  name: string;
  email: string;
  plan: string;
  subscription_status: string;
  is_admin: boolean;
  created_at?: string;
}

interface Props {
  userId: number | null;
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

export default function UserDetailsModal({ userId, open, onClose, onChanged }: Props) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUser = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await apiFetch<UserDetails>(`/users/${userId}`);
      setUser(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!open || !userId) return;
    loadUser();
  }, [open, userId, loadUser]);

  async function act(fn: () => Promise<void>) {
    await fn();
    await loadUser();
    onChanged?.();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            Detalhes do Usuário
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        {loading && <p className="mt-4 text-text-muted">Carregando...</p>}

        {!loading && user && (
          <div className="mt-4 space-y-2 text-sm text-text-primary">
            <div><strong>ID:</strong> {user.id}</div>
            <div><strong>Nome:</strong> {user.name}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Plano:</strong> {user.plan}</div>
            <div><strong>Status:</strong> {user.subscription_status}</div>
            <div><strong>Administrador:</strong> {user.is_admin ? "Sim" : "Não"}</div>
            <div>
              <strong>Criado em:</strong>{" "}
              {user.created_at
                ? new Date(user.created_at).toLocaleString("pt-BR")
                : "-"}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => act(() => apiFetch(`/users/${user.id}/admin`, { method: "PATCH" }))}
                className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-bg-hover"
              >
                {user.is_admin ? "Remover Admin" : "Tornar Admin"}
              </button>
              <button
                onClick={() => act(() => apiFetch(`/users/${user.id}/premium`, { method: "PATCH" }))}
                className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-bg-hover"
              >
                Liberar Premium
              </button>
              <button
                onClick={() => act(() => apiFetch(`/users/${user.id}/free`, { method: "PATCH" }))}
                className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-bg-hover"
              >
                Definir como Free
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Deseja realmente cancelar a assinatura?")) {
                    act(() => apiFetch(`/users/${user.id}/subscription`, { method: "DELETE" }));
                  }
                }}
                className="rounded-lg border border-danger px-3 py-1 text-sm text-danger hover:bg-danger-light"
              >
                Cancelar Assinatura
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
