"use client";

import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  userLabel: string;
  onToggleSidebar: () => void;
}

export default function Navbar({ userLabel, onToggleSidebar }: NavbarProps) {
  const initial = userLabel.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border-soft bg-bg-card/80 px-4 py-3 backdrop-blur">
      <button
        onClick={onToggleSidebar}
        aria-label="Abrir menu"
        className="rounded-lg px-2 py-1 text-xl text-text-primary transition-colors hover:bg-bg-hover lg:hidden"
      >
        ☰
      </button>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
            aria-hidden
          >
            {initial}
          </span>
          <span className="hidden text-sm text-text-primary sm:inline">
            Olá, <strong className="font-semibold">{userLabel}</strong>
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
