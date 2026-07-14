# DESIGN NOTES — Paleta e primitivas (fonte da verdade)

> **Regra do cliente:** a paleta abaixo é fechada. Nenhuma cor de destaque nova pode
> ser introduzida. Melhorias visuais só usam estes tokens (ou variações de opacidade
> `/xx` do Tailwind sobre eles). Definidos em `app/globals.css`.

## Cores — Light (`:root`)
| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | `#2563eb` | Azul da marca; CTAs, links, ativo. |
| `--color-primary-hover` | `#1d4ed8` | Hover do primário. |
| `--color-primary-light` | `#eff6ff` | Fundo suave azul (chips, item ativo). |
| `--color-secondary` | `#0ea5e9` | Sky; gradiente da marca, acento no dark. |
| `--color-secondary-hover` | `#0284c7` | Hover do secundário. |
| `--color-success` | `#16a34a` | Verde; nota ≥50, status ativo. |
| `--color-success-light` | `#dcfce7` | Fundo verde suave. |
| `--color-danger` | `#dc2626` | Vermelho; nota <50, erro, cancelar. |
| `--color-danger-light` | `#fee2e2` | Fundo vermelho suave. |
| `--color-disabled` | `#94a3b8` | Desabilitado. |
| `--color-text-primary` | `#0f172a` | Texto principal. |
| `--color-text-muted` | `#64748b` | Texto secundário. |
| `--color-bg-page` | `#f1f5f9` | Fundo da página. |
| `--color-bg-card` | `#ffffff` | Fundo de cards. |
| `--color-bg-input` | `#ffffff` | Fundo de inputs. |
| `--color-bg-hover` | `#f1f5f9` | Hover neutro. |
| `--color-border` | `#cbd5e1` | Borda padrão. |
| `--color-border-soft` | `#e2e8f0` | Borda sutil. |
| `--color-focus` | `#0ea5e9` | Anel de foco. |
| `--color-overlay` | `rgba(0,0,0,.35)` | Overlay de modais. |

## Cores — Dark (`.dark`, overrides)
text-primary `#e5e7eb` · text-muted `#9ca3af` · bg-page `#020617` · bg-card `#111827` ·
bg-input `#020617` · bg-hover `#1f2937` · border/soft `#374151` ·
primary-light `#1e3a8a` · success-light `#14532d` · danger-light `#7f1d1d`.
No dark, `.eyebrow` usa `--color-secondary` (sky) em vez do primário.

## Sombras
`--shadow-soft`, `--shadow-card`, `--shadow-strong` (mais densas no dark).

## Gradiente da marca (`.brand-gradient`)
`linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #0ea5e9 100%)` — azul → sky.
Usado no hero do Dashboard (PRESERVAR), painel de auth e badge do logo.

## Tipografia
- **Display** — Space Grotesk (h1–h4, `.font-display`), tracking `-0.02em`.
- **Body** — Inter.
- **Mono** — JetBrains Mono (`.font-mono`, `.tabular`, timer, notas), `tabular-nums`.
- **Eyebrow** — `.eyebrow`: mono, 11px, uppercase, tracking `0.14em`, cor primária.

## Primitivas (`app/globals.css`)
`.card` · `.btn` + `.btn-primary` / `.btn-outline` · `.score-chip` · `.eyebrow` · `.brand-gradient`.
Foco visível global em `a/button/input/select/textarea:focus-visible`.
`@media (prefers-reduced-motion)` zera animações.

### Primitivas adicionadas (bloco 1 — 2026-07-14)
- `.card-interactive` — card clicável com leve elevação no hover.
- `.btn-danger` (contorno vermelho), `.btn-sm` (compacto), `.btn-block` (largura total).
- `.input` — input/select/textarea unificados, com anel de foco (`color-mix` sobre `--color-focus`).
- `.badge` + `.badge-primary` / `.badge-success` / `.badge-danger` / `.badge-muted` — pílulas de status.
- `.skeleton` — placeholder de carregamento com shimmer (respeita reduced-motion).

Todas usam **apenas** tokens já existentes. Exceção deliberada fora da paleta: o ícone
multicolor do Google (marca de fornecedor, inline em `login/page.tsx`) e as cores da paleta
oficial nos gráficos do admin (já eram tokens do sistema).

### Redesign "Caderno de Prova" (bloco 2 — 2026-07-14)
Direção estética escolhida pelo cliente: **cartão-resposta / caderno de prova do ENEM**.
Paleta 100% mantida; mudou estrutura, raio, sombra, tipografia e forma dos componentes.
- **Tokens de raio:** `--radius-sm` (6px), `--radius` (8px), `--radius-lg` (12px). Cantos
  precisos, de documento — não broadsheet 0px.
- **Sombras** ficaram bem mais sutis; superfícies são definidas pela **borda hairline**.
- **Novas primitivas:** `.panel` + `.panel-header` + `.panel-body` (folha com cabeçalho por fio),
  `.hairline`, `.marker` (casa numerada mono), `.bubble` (+ `-selected/-correct/-wrong`, a bolha
  A–E do cartão-resposta), `.answer` (+ `-selected/-correct/-wrong`, linha de alternativa),
  `.sheet` (tabela estilo gabarito), `.field-label` (rótulo mono), `.watermark-number`.
- **Superfícies-assinatura:** alternativas viram bolhas (QuestionCard); navegador vira
  cartão-resposta; Dashboard vira "Boletim" com régua 0–100; Histórico/Usuários viram folhas
  de resultados (`.sheet`). Números em mono/tabular por toda parte.
- **Verificação:** `tsc --noEmit` OK e `next build` OK (todas as rotas compilam).
</content>
