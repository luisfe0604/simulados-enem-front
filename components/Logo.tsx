"use client";

import { useId } from "react";

interface LogoProps {
  size?: number;
  className?: string;
  /**
   * "badge": tile arredondado com o gradiente da marca — para fundos neutros
   * (navbar, sidebar, favicon). "mark": só o glifo branco, sem fundo próprio —
   * para usar sobre um fundo que já é o gradiente da marca (painel de auth).
   */
  variant?: "badge" | "mark";
}

/**
 * Marca da NexAprova: barras ascendentes + linha de tendência terminando num
 * ponto — a mesma linguagem visual do hero do Dashboard (nota subindo rumo a
 * 1000). Não é um ícone genérico de "gráfico de negócios": aqui ele representa
 * literalmente o que a marca promete, evolução de nota ao longo dos simulados.
 */
export default function Logo({ size = 32, className, variant = "badge" }: LogoProps) {
  const gradId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="NexAprova"
    >
      {variant === "badge" && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="45%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="10" fill={`url(#${gradId})`} />
        </>
      )}

      {/* barras ascendentes */}
      <rect x="9" y="24" width="5" height="8" rx="1.5" fill="white" fillOpacity="0.85" />
      <rect x="17" y="18" width="5" height="14" rx="1.5" fill="white" fillOpacity="0.9" />
      <rect x="25" y="11" width="5" height="21" rx="1.5" fill="white" />

      {/* linha de tendência subindo além da última barra, até o ponto */}
      <path
        d="M11.5 24 L19.5 18 L27.5 11 L31 7"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="31" cy="7" r="2.6" fill="white" />
    </svg>
  );
}
