import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import ThemeToggle from "../components/ThemeToggle";
import styles from "./Navbar.module.css";

export default function Navbar({ toggleSidebar }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    async function loadUser() {
      try {
        const data = await apiFetch("/users/me");
        setUser(data);
      } catch {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      }
    }

    loadUser();
  }, [navigate]);

  return (
    <div className={styles.navbar}>
      <button className={styles.menuButton} onClick={toggleSidebar}>
        ☰
      </button>

      <div className={styles.userInfo}>
        <img src="/logo.png" alt="logo" /> Olá, <strong>{user?.name || user?.email || "Usuário"}</strong>
      </div>

      <ThemeToggle />
    </div>
  );
}
