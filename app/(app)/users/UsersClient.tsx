"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import UserDetailsModal from "@/components/UserDetailsModal";

interface UserRow {
  id: number;
  name: string;
  email: string;
  plan: string;
  subscription_status: string;
  is_admin: boolean;
}

export default function UsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  async function loadUsers(currentPage = page) {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "20",
      });
      if (search.trim()) params.append("search", search);

      const data = await apiFetch<{ users?: UserRow[]; total?: number; page?: number }>(
        `/users/list?${params.toString()}`,
      );
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPage(data.page || currentPage);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 text-2xl font-bold text-text-primary">Gestão de Usuários</h1>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadUsers(1)}
          className="input flex-1"
        />
        <button onClick={() => loadUsers(1)} className="btn btn-primary">
          Buscar
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-text-muted">Carregando...</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="sheet text-sm">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Admin</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setDetailsOpen(true);
                        }}
                        className="font-medium text-primary hover:underline"
                      >
                        {user.name}
                      </button>
                    </td>
                    <td className="p-3 text-text-primary">{user.email}</td>
                    <td className="p-3">
                      {user.plan === "premium" ? (
                        <span className="badge badge-primary">{user.plan}</span>
                      ) : (
                        <span className="text-text-muted">{user.plan}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {user.subscription_status === "active" ? (
                        <span className="badge badge-success">{user.subscription_status}</span>
                      ) : (
                        <span className="text-text-muted">{user.subscription_status}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {user.is_admin ? (
                        <span className="badge badge-primary">Admin</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        <ActionBtn onClick={() => act(user.id, "admin", "PATCH", loadUsers)}>
                          {user.is_admin ? "- Admin" : "+ Admin"}
                        </ActionBtn>
                        <ActionBtn onClick={() => act(user.id, "premium", "PATCH", loadUsers)}>
                          Premium
                        </ActionBtn>
                        <ActionBtn onClick={() => act(user.id, "free", "PATCH", loadUsers)}>
                          Free
                        </ActionBtn>
                        <ActionBtn
                          danger
                          onClick={() => {
                            if (window.confirm("Deseja realmente cancelar a assinatura?")) {
                              act(user.id, "subscription", "DELETE", loadUsers);
                            }
                          }}
                        >
                          Cancelar
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users.length && (
              <div className="p-6 text-center text-text-muted">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => loadUsers(page - 1)}
              className="btn btn-outline btn-sm"
            >
              Anterior
            </button>
            <span className="text-sm text-text-muted">
              Página {page} de {Math.max(totalPages, 1)}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => loadUsers(page + 1)}
              className="btn btn-outline btn-sm"
            >
              Próxima
            </button>
          </div>
        </>
      )}

      <UserDetailsModal
        open={detailsOpen}
        userId={selectedUserId}
        onClose={() => setDetailsOpen(false)}
        onChanged={() => loadUsers()}
      />
    </div>
  );
}

async function act(
  userId: number,
  action: string,
  method: string,
  reload: () => void,
) {
  await apiFetch(`/users/${userId}/${action}`, { method });
  reload();
}

function ActionBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-2 py-1 text-xs transition-colors ${
        danger
          ? "border-danger text-danger hover:bg-danger-light"
          : "border-border text-text-primary hover:bg-bg-hover"
      }`}
    >
      {children}
    </button>
  );
}
