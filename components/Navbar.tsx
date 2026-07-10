"use client";

import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  userLabel: string;
  onToggleSidebar: () => void;
}

export default function Navbar({ userLabel, onToggleSidebar }: NavbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-bg-card px-4 py-3">
      <button
        onClick={onToggleSidebar}
        aria-label="Abrir menu"
        className="rounded-lg px-2 py-1 text-xl text-text-primary transition-colors hover:bg-bg-hover lg:hidden"
      >
        ☰
      </button>

      <div className="flex items-center gap-2 text-text-primary">
        <Image src="/logo.png" alt="logo" width={28} height={28} />
        <span>
          Olá, <strong>{userLabel}</strong>
        </span>
      </div>

      <ThemeToggle />
    </header>
  );
}
