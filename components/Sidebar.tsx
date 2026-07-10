"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";

interface SidebarProps {
  open: boolean;
  isAdmin: boolean;
  onNavigate: () => void;
}

const BASE_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/simulado", label: "Novo Simulado" },
  { href: "/historico", label: "Histórico" },
  { href: "/conta", label: "Conta" },
];

const ADMIN_ITEMS = [
  { href: "/questao", label: "Nova Questão" },
  { href: "/dash-admin", label: "Dashboard Admin" },
  { href: "/users", label: "Usuários" },
];

export default function Sidebar({ open, isAdmin, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const items = isAdmin ? [...BASE_ITEMS, ...ADMIN_ITEMS] : BASE_ITEMS;

  async function handleLogout() {
    try {
      await apiFetch("/users/logout", { method: "POST" });
    } catch {
      // mesmo se falhar, seguimos para o login
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-border bg-bg-card p-5 transition-transform lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div>
        <h2 className="mb-6 text-xl font-bold text-primary">NexAprova</h2>

        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-text-primary hover:bg-bg-hover"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 text-sm">
        <span className="block text-text-muted">
          Dúvidas:{" "}
          <a
            href="mailto:contato.jurisaprova@gmail.com?subject=Ajuda"
            className="text-primary hover:underline"
          >
            contato.jurisaprova@gmail.com
          </a>
        </span>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-border py-2 font-medium text-text-primary transition-colors hover:bg-bg-hover"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
