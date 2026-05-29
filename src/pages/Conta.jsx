import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import styles from "./Conta.module.css";

export default function Conta() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [error, success]);

  async function loadData() {
    try {
      const sub = await apiFetch("/billing/subscription");
      const me = await apiFetch("/users/me");

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
      const data = await apiFetch("/billing/create-checkout-session", {
        method: "POST",
      });
      setSuccess("Assinatura atualizada com sucesso");
      setError(null);
      setSuccess(null);
      window.location.href = data.url;
    } catch {
      setError("Erro ao iniciar assinatura");
    }
  }

  async function handleCancel() {
    if (!window.confirm("Tem certeza que deseja cancelar?")) return;

    await apiFetch("/billing/subscription/cancel", { method: "POST" });
    setError(null);
    setSuccess(null);
    loadData();
  }

  async function handleReactivate() {
    await apiFetch("/billing/subscription/reactivate", { method: "POST" });
    setError(null);
    setSuccess(null);
    loadData();
  }

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const isActive = ["active", "trialing", "trial"].includes(
    subscription.subscription_status,
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Minha Conta</h1>
        <p className={styles.subtitle}>Gerencie sua assinatura e seus dados</p>

        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>Nome</span>
            <span className={styles.value}>{user.name}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Email</span>
            <span className={styles.value}>{user.email}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Plano</span>
            <span className={styles.valuePlan}>{subscription.plan}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Expira em</span>
            <span className={styles.value}>
              {subscription.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString()
                : "-"}
            </span>
          </div>

          <div className={styles.fieldFull}>
            <div className={styles.statusRow}>
              <span className={styles.label}>Status</span>
              <span
                className={`${styles.status} ${styles[subscription.subscription_status]}`}
              >
                {subscription.subscription_status}
              </span>
            </div>
          </div>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        {success && <div className={styles.successBox}>{success}</div>}

        {/* AÇÕES */}
        <div style={{ marginTop: 20 }}>
          {!isActive && (
            <button className={styles.button} onClick={handleSubscribe}>
              Assinar
            </button>
          )}

          {isActive && !subscription.cancel_at_period_end && (
            <button className={styles.button} onClick={handleCancel}>
              Cancelar assinatura
            </button>
          )}

          {subscription.cancel_at_period_end && (
            <button
              className={styles.button}
              onClick={handleReactivate}
            >
              Reativar assinatura
            </button>
          )}
        </div>

        {/* AVISO */}
        {subscription.cancel_at_period_end && (
          <p className={styles.subtitle} style={{ marginTop: 10 }}>
            Sua assinatura será cancelada ao final do período.
          </p>
        )}
      </div>
    </div>
  );
}
