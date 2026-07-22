// Ícones de linha, minimalistas, desenhados à mão para o menu — 24x24,
// stroke currentColor. Evitam depender de uma lib de ícones externa e mantêm
// a mesma linguagem visual (traço fino, cantos arredondados) em todo o app.

type IconProps = { className?: string; style?: React.CSSProperties };

const base = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconGauge({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d="M12 15l4.2-5.4" />
      <circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconDocPencil({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path d="M8 3h6l4 4v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
      <path d="M9.5 15.5 14 11l1.5 1.5-4.5 4.5H9.5v-1.5Z" />
    </svg>
  );
}

export function IconSpark({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="M12 7a5 5 0 0 0 5 5 5 5 0 0 0-5 5 5 5 0 0 0-5-5 5 5 0 0 0 5-5Z" />
    </svg>
  );
}

export function IconHistory({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path d="M4 10a8 8 0 1 0 2.3-5.6" />
      <path d="M4 4v4h4" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

export function IconUserCircle({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.3 18.5a6 6 0 0 1 11.4 0" />
    </svg>
  );
}

export function IconPlusSquare({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

export function IconBarChart({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path d="M4 20V10M12 20V4M20 20v-7" />
      <path d="M4 20h16" />
    </svg>
  );
}

export function IconSliders({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path d="M5 6h9M18 6h1M5 18h1M8 18h11M5 12h5M14 12h5" />
      <circle cx="16" cy="6" r="2" fill="var(--color-bg-card)" />
      <circle cx="6" cy="18" r="2" fill="var(--color-bg-card)" />
      <circle cx="11" cy="12" r="2" fill="var(--color-bg-card)" />
    </svg>
  );
}

export function IconRefreshCcw({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path d="M4 12a8 8 0 0 1 14.5-4.7M20 12a8 8 0 0 1-14.5 4.7" />
      <path d="M18.5 3v4.3h-4.3M5.5 21v-4.3h4.3" />
    </svg>
  );
}

export function IconBookOpen({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path d="M12 6.5c-1.6-1.3-3.7-2-6-2H4v13h2c2.3 0 4.4.7 6 2" />
      <path d="M12 6.5c1.6-1.3 3.7-2 6-2h2v13h-2c-2.3 0-4.4.7-6 2v-13Z" />
    </svg>
  );
}

export function IconCalculator({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01" strokeWidth="2.4" />
    </svg>
  );
}

export function IconTarget({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCheck({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

export function IconUsers({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 8.5a3 3 0 1 1 3.2 3M15 13.2c2.6.3 4.5 1.7 5 3.8" />
    </svg>
  );
}
