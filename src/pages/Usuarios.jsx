import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

import UserDetailsModal from "../components/UserDetailsModal";

import styles from "./Usuarios.module.css";

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
    <div className={styles.page}>
      <h1 className={styles.title}>Gestão de Usuários</h1>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />

        <button className={styles.searchButton} onClick={() => loadUsers(1)}>
          Buscar
        </button>
      </div>

      {loading ? (
        <p className={styles.loading}>Carregando...</p>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
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
                        className={styles.userButton}
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setDetailsOpen(true);
                        }}
                      >
                        {user.name}
                      </button>
                    </td>

                    <td>{user.email}</td>

                    <td>
                      <span
                        className={
                          user.plan === "premium" || "admin"
                            ? styles.planPremium
                            : styles.planFree
                        }
                      >
                        {user.plan}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          user.subscription_status === "active" || "admin" || "trialing"
                            ? styles.statusActive
                            : styles.statusInactive
                        }
                      >
                        {user.subscription_status}
                      </span>
                    </td>

                    <td>
                      {user.is_admin ? (
                        <span className={styles.adminBadge}>Admin</span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.actionButton} ${styles.adminButton}`}
                          onClick={() => toggleAdmin(user.id)}
                        >
                          {user.is_admin ? "Remover Admin" : "Tornar Admin"}
                        </button>

                        <button
                          className={`${styles.actionButton} ${styles.premiumButton}`}
                          onClick={() => grantPremium(user.id)}
                        >
                          Premium
                        </button>

                        <button
                          className={`${styles.actionButton} ${styles.freeButton}`}
                          onClick={() => revokePremium(user.id)}
                        >
                          Free
                        </button>

                        <button
                          className={`${styles.actionButton} ${styles.cancelButton}`}
                          onClick={() => removeSubscription(user.id)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!users.length && (
              <div className={styles.empty}>Nenhum usuário encontrado.</div>
            )}
          </div>

          <div className={styles.pagination}>
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

      <UserDetailsModal
        open={detailsOpen}
        userId={selectedUserId}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}
