import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  async function loadUsers(currentPage = page) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
      });

      if (search.trim()) {
        params.append("search", search);
      }

      const data = await apiFetch(`/users/list?${params.toString()}`);

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
  }, []);

  async function toggleAdmin(userId) {
    await apiFetch(`/users/${userId}/admin`, {
      method: "PATCH",
    });

    loadUsers();
  }

  async function grantPremium(userId) {
    await apiFetch(`/users/${userId}/premium`, {
      method: "PATCH",
    });

    loadUsers();
  }

  async function revokePremium(userId) {
    await apiFetch(`/users/${userId}/free`, {
      method: "PATCH",
    });

    loadUsers();
  }

  async function removeSubscription(userId) {
    const confirmed = window.confirm("Deseja realmente cancelar a assinatura?");

    if (!confirmed) return;

    await apiFetch(`/users/${userId}/subscription`, {
      method: "DELETE",
    });

    loadUsers();
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div style={{ padding: "24px" }}>
      <h1>Gestão de Usuários</h1>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "10px",
          }}
        />

        <button onClick={() => loadUsers(1)}>Buscar</button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
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
                  <td>
                    <button
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "var(--primary)",
                        textDecoration: "underline",
                      }}
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setDetailsOpen(true);
                      }}
                    >
                      {user.name}
                    </button>
                  </td>

                  <td>{user.email}</td>

                  <td>{user.plan}</td>

                  <td>{user.subscription_status}</td>

                  <td>{user.is_admin ? "Sim" : "Não"}</td>

                  <td>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                      }}
                    >
                      <button onClick={() => toggleAdmin(user.id)}>
                        {user.is_admin ? "Remover Admin" : "Tornar Admin"}
                      </button>

                      <button onClick={() => grantPremium(user.id)}>
                        Premium
                      </button>

                      <button onClick={() => revokePremium(user.id)}>
                        Free
                      </button>

                      <button onClick={() => removeSubscription(user.id)}>
                        Cancelar Assinatura
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <button disabled={page === 1} onClick={() => loadUsers(page - 1)}>
              Anterior
            </button>

            <span>
              Página {page} de {Math.max(totalPages, 1)}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => loadUsers(page + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}

<UserDetailsModal
  open={detailsOpen}
  userId={selectedUserId}
  onClose={() => setDetailsOpen(false)}
/>