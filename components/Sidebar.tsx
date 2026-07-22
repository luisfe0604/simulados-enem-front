"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import Logo from "@/components/Logo";
import {
  IconGauge,
  IconDocPencil,
  IconSpark,
  IconHistory,
  IconUserCircle,
  IconPlusSquare,
  IconBarChart,
  IconUsers,
} from "@/components/icons";
import type { ComponentType } from "react";

interface SidebarProps {
  open: boolean;
  isAdmin: boolean;
  onNavigate: () => void;
}

type NavEntry = { href: string; label: string; icon: ComponentType<{ className?: string }> };

const BASE_ITEMS: NavEntry[] = [
  { href: "/", label: "Dashboard", icon: IconGauge },
  { href: "/simulado", label: "Novo Simulado", icon: IconDocPencil },
  { href: "/assistente", label: "NexAI", icon: IconSpark },
  { href: "/historico", label: "Histórico", icon: IconHistory },
  { href: "/conta", label: "Conta", icon: IconUserCircle },
];

const ADMIN_ITEMS: NavEntry[] = [
  { href: "/questao", label: "Nova Questão", icon: IconPlusSquare },
  { href: "/dash-admin", label: "Dashboard Admin", icon: IconBarChart },
  { href: "/users", label: "Usuários", icon: IconUsers },
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
          <Logo size={30} />
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
  icon: Icon,
  active,
  onNavigate,
}: NavEntry & {
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`nav-link ${active ? "nav-link-active" : ""}`}
    >
      <Icon className="nav-icon h-[18px] w-[18px]" />
      {label}
    </Link>
  );
}
