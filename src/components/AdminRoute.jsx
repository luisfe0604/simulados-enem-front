import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchSub() {
      try {
        const sub = await apiFetch("/billing/subscription");

        if (sub?.is_admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchSub();
  }, []);

  if (loading) {
    return <h2>Carregando...</h2>;
  }

  if (error) {
    return <h2>Não autenticado</h2>;
  }

  if (!isAdmin) {
    return <h2>Sem permissão</h2>;
  }

  return children;
}