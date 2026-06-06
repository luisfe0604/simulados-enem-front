import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import styles from "./UserDetailsModal.module.css";

export default function UserDetailsModal({ userId, open, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;

    loadUser();
  }, [open, userId]);

  async function loadUser() {
    try {
      setLoading(true);

      const data = await apiFetch(`/users/${userId}`);

      setUser(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdmin() {
    await apiFetch(`/users/${user.id}/admin`, {
      method: "PATCH",
    });

    await loadUser();
  }

  async function grantPremium() {
    await apiFetch(`/users/${user.id}/premium`, {
      method: "PATCH",
    });

    await loadUser();
  }

  async function revokePremium() {
    await apiFetch(`/users/${user.id}/free`, {
      method: "PATCH",
    });

    await loadUser();
  }

  async function removeSubscription() {
    const confirmed = window.confirm("Deseja realmente cancelar a assinatura?");

    if (!confirmed) return;

    await apiFetch(`/users/${user.id}/subscription`, {
      method: "DELETE",
    });

    await loadUser();
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Detalhes do Usuário</h2>

          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {loading && <p>Carregando...</p>}

        {!loading && user && (
          <div className={styles.content}>
            <div>
              <strong>ID:</strong> {user.id}
            </div>

            <div>
              <strong>Nome:</strong> {user.name}
            </div>

            <div>
              <strong>Email:</strong> {user.email}
            </div>

            <div>
              <strong>Plano:</strong> {user.plan}
            </div>

            <div>
              <strong>Status:</strong> {user.subscription_status}
            </div>

            <div>
              <strong>Stripe Subscription:</strong>{" "}
              {user.stripe_subscription_id || "-"}
            </div>

            <div>
              <strong>Criado em:</strong>{" "}
              {user.created_at
                ? new Date(user.created_at).toLocaleString("pt-BR")
                : "-"}
            </div>
            <div className={styles.actions}>
              <button className={styles.adminBtn} onClick={toggleAdmin}>
                {user.is_admin ? "Remover Admin" : "Tornar Admin"}
              </button>

              <button className={styles.premiumBtn} onClick={grantPremium}>
                Liberar Premium
              </button>

              <button className={styles.freeBtn} onClick={revokePremium}>
                Definir como Free
              </button>

              <button className={styles.cancelBtn} onClick={removeSubscription}>
                Cancelar Assinatura
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
