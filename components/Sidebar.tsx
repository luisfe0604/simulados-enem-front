"use client";

import Link from "next/link";
import Image from "next/image";
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

  async function handleLogout() {
    try {
      await apiFetch("/users/logout", { method: "POST" });
    } catch {
      // mesmo se falhar, seguimos para o login
    }
    router.replace("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-border-soft bg-bg-card p-5 transition-transform lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div>
        <div className="mb-8 flex items-center gap-2 px-1">
          <Image src="/logo.png" alt="NexAprova" width={30} height={30} />
          <span className="font-display text-lg font-bold text-text-primary">
            NexAprova
          </span>
        </div>

        <p className="eyebrow mb-2 px-3">Menu</p>
        <nav className="flex flex-col gap-0.5">
          {BASE_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        {isAdmin && (
          <>
            <p className="eyebrow mb-2 mt-6 px-3">Administração</p>
            <nav className="flex flex-col gap-0.5">
              {ADMIN_ITEMS.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  active={isActive(item.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </nav>
          </>
        )}
      </div>

      <div className="space-y-3 border-t border-border-soft pt-4 text-sm">
        <span className="block px-1 text-text-muted">
          Dúvidas?{" "}
          <a
            href="mailto:contato.jurisaprova@gmail.com?subject=Ajuda"
            className="font-medium text-primary hover:underline"
          >
            Fale com a gente
          </a>
        </span>
        <button onClick={handleLogout} className="btn btn-outline w-full">
          Sair
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary-light text-primary"
          : "text-text-primary hover:bg-bg-hover"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-primary" />
      )}
      {label}
    </Link>
  );
}
