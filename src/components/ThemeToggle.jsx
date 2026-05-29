import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");

    if (saved === "dark") {
      document.body.classList.add("dark");
      setDark(true);
    }
  }, []);

  function toggleTheme() {
    const newDark = !dark;
    setDark(newDark);

    if (newDark) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <button className={styles.toggleBtn} onClick={toggleTheme}>
      {dark ? "🌙" : "☀️"}
    </button>
  );
}