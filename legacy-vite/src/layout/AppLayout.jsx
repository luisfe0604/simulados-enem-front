import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import styles from "./AppLayout.module.css";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar open={sidebarOpen} />
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <div className={styles.main}>
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
