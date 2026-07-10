"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { apiFetch } from "@/lib/client-api";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userLabel, setUserLabel] = useState("Usuário");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const me = await apiFetch<{ name?: string; email?: string }>(
          "/users/me",
        );
        setUserLabel(me.name || me.email || "Usuário");
      } catch {
        router.replace("/login");
        return;
      }

      try {
        const sub = await apiFetch<{ is_admin?: boolean }>(
          "/billing/subscription",
        );
        setIsAdmin(Boolean(sub.is_admin));
      } catch {
        // sem assinatura não impede uso do layout
      }
    }
    load();
  }, [router]);

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar
        open={sidebarOpen}
        isAdmin={isAdmin}
        onNavigate={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          userLabel={userLabel}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
