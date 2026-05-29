import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import styles from "./Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const data = await apiFetch("/users/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user_name", email);

      navigate("/");
    } catch {
      setError("Credenciais inválidas");
    }
  }

  function loginWithGoogle() {
    window.location.href = `${import.meta.env.VITE_API_URL}/users/auth/google?system=enem`;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>JurisAprova - Enem</h1>
        <p className={styles.subtitle}>Acesse sua conta para continuar</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input
              type="email"
              placeholder="seuemail@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <button type="submit" className={styles.button}>
            Entrar
          </button>
        </form>

        <div className={styles.divider}>
          <span>OU</span>
        </div>

        <button
          className={styles.registerButton}
          onClick={() => navigate("/register")}
        >
          Criar conta
        </button>

        <button className={styles.googleButton} onClick={loginWithGoogle}>
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className={styles.googleIcon}
          />
          Continuar com Google
        </button>
      </div>
    </div>
  );
}
