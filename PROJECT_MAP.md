# PROJECT_MAP — frontend_enem (NexAprova)

Mapa de referência do projeto. Consulte-o **antes** de reabrir um arquivo.
Mantido atualizado a cada alteração visual. Última revisão: 2026-07-14.

## Stack
- **Next.js 16** (App Router, RSC) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (config via `@theme inline` em `app/globals.css`, sem `tailwind.config`)
- Auth: cookie httpOnly (JWT via `jose`), Google OAuth. Pagamentos: **Stripe**. DB: **pg** (Postgres).
- Gráficos admin: **recharts**.
- Fontes (next/font): Space Grotesk (display), Inter (body), JetBrains Mono (mono/números).

## Identidade visual (NÃO INTRODUZIR CORES NOVAS)
Tema: nota do ENEM subindo rumo a 1000. Logo = barras ascendentes + linha de tendência.
Paleta completa documentada em **`DESIGN_NOTES.md`** (fonte da verdade das cores).
Regras fixas do cliente:
- **Card principal do Dashboard** (hero `brand-gradient` "Média geral" em `app/(app)/page.tsx`) → **NÃO ALTERAR**.
- **Paleta atual** → manter em todo o projeto. Trabalhar só com tons/variações existentes.

## Convenção: camada visual vs. lógica
- Lógica de negócio vive em `lib/` (services, auth, db, api) e nas rotas `app/api/**`. **Não tocar.**
- Componentes em `app/(app|auth)/**` e `components/**` misturam apresentação + chamadas `apiFetch`.
  Ao mexer no visual, preservar handlers, estados, efeitos e chamadas de API intactos.

---

## Estrutura

### `app/` — rotas e layout
| Caminho | Responsabilidade | Tipo | Notas |
|---|---|---|---|
| `layout.tsx` | Root layout: carrega fontes, injeta script de tema (dark), `<html>`/`<body>`. | Visual | Metadata do site. |
| `globals.css` | **Design system**: variáveis de cor (light/dark), `@theme`, primitivas (`.card`, `.btn`, `.eyebrow`, `.score-chip`), fontes, focus, reduced-motion. | Visual | Ponto central de estilo. |
| `icon.svg` | Favicon (marca). | Visual | |
| `(auth)/layout.tsx` | Layout de auth: painel `brand-gradient` (signature) + área do form. | Visual | Marca d'água "1000". |
| `(auth)/login/page.tsx` | Form de login + Google OAuth. | Visual+lógica | `apiFetch /users/login`. Ícone Google via URL externa (svgrepo). |
| `(auth)/register/page.tsx` | Form de cadastro. | Visual+lógica | `apiFetch /users/register`. |
| `(auth)/auth-success/page.tsx` | Redirect legado → `/`. | Lógica | Só `redirect()`. |
| `(app)/layout.tsx` | Shell autenticado: Sidebar + Navbar + `<main>`. Carrega `me` e `is_admin`. | Visual+lógica | Overlay mobile da sidebar. |
| `(app)/page.tsx` | **Dashboard**: hero média (PRESERVAR), StatCards, lista últimos simulados. | Visual+lógica | `apiFetch /simulados`, `/billing/subscription`. |
| `(app)/simulado/page.tsx` | Wrapper server → `SimuladoRunner`. | — | |
| `(app)/simulado/refazer/[id]/page.tsx` | Wrapper → `SimuladoRunner` com `retryId`. | — | |
| `(app)/historico/page.tsx` | Histórico: filtros, tabela (desktop) / cards (mobile), expandir questões. | Visual+lógica | `apiFetch /simulados`, `/enem/simulados/:id`. |
| `(app)/conta/page.tsx` | Conta + assinatura (assinar/cancelar/reativar via Stripe). | Visual+lógica | Usa `.card`. |
| `(app)/questao/*` | (Admin) criar questão. `NewQuestionClient.tsx` = form. | Visual+lógica | |
| `(app)/dash-admin/*` | (Admin) métricas + gráficos recharts. `AdminDashboardClient.tsx`. | Visual+lógica | |
| `(app)/users/*` | (Admin) gestão de usuários + `UserDetailsModal`. `UsersClient.tsx`. | Visual+lógica | |
| `api/**` | Rotas de API (billing, enem, users). | **Lógica — não tocar** | |

### `components/`
| Arquivo | Responsabilidade | Principais props/funções |
|---|---|---|
| `Logo.tsx` | Marca SVG (variant `badge`/`mark`). | `size`, `variant` |
| `Navbar.tsx` | Top bar sticky: toggle sidebar (mobile), avatar + saudação, `ThemeToggle`. | `userLabel`, `onToggleSidebar` |
| `Sidebar.tsx` | Navegação lateral: itens base + admin, logout. | `open`, `isAdmin`, `onNavigate`; `NavItem` |
| `ThemeToggle.tsx` | Alterna tema dark/light (localStorage + classe no `<html>`). | — |
| `SimuladoRunner.tsx` | Motor do simulado: modos, timer, progresso, navegador de questões, submit, resultado. | `retryId`; estado grande, `apiFetch` várias. |
| `QuestionCard.tsx` | Renderiza 1 questão: parse do enunciado, alternativas A–E, feedback de correção. | `q`, `index`, `answers`, `result`, `onSelect`, `disabled` |
| `UserDetailsModal.tsx` | (Admin) modal de detalhes/ações do usuário. | `userId`, `open`, `onClose`, `onChanged` |

### `lib/` — LÓGICA (não tocar em melhorias visuais)
`api.ts`, `client-api.ts` (fetch wrapper), `auth.ts`, `authz.ts`, `session.ts`, `db.ts`,
`google.ts`, `stripe.ts`, `password.ts`, `page-guards.ts`, `useBodyScrollLock.ts`,
`services/{billing,enem,users,webhook}.ts`.

---

## Estado do design (diagnóstico) e plano de melhoria
**Identidade já é forte** (tema ENEM, logo próprio, gradiente, eyebrows, fontes).
**Problema central:** primitivas existem mas são aplicadas de forma desigual — muitos
botões/cards usam classes ad-hoc (`rounded-lg bg-primary px-4 py-2 …`) em vez de `.btn`/`.card`.

Eixos de melhoria (todos dentro da paleta, sem tocar lógica nem o hero do dashboard):
1. **Fortalecer/estender primitivas** em `globals.css` (`.btn` variantes, `.card` hover/acento, `.input`, `.chip`, `.skeleton`, `.badge`).
2. **Padronizar** componentes para usar as primitivas (coesão).
3. **Polir estados**: loading (skeleton), vazio (empty states com direção), resultado do simulado.
4. **Microinterações** discretas (hover lift, transições) respeitando reduced-motion.

### Log de alterações visuais
**2026-07-14 — Bloco 1: sistema de primitivas + padronização (sem tocar lógica).**
- `globals.css`: adicionadas primitivas `.card-interactive` (hover lift), `.btn-danger`,
  `.btn-sm`, `.btn-block`, `.input` (com anel de foco), `.badge` (+ `-primary/-success/-danger/-muted`),
  `.skeleton`; `.card` ganhou `transition`. Nenhuma cor nova (só tokens existentes).
- `login`/`register`: inputs → `.input`, botões → `.btn`; ícone do Google agora é **SVG inline**
  (removida a dependência externa svgrepo.com que travava o render).
- `SimuladoRunner`: inputs/select → `.input`, botões → `.btn`; card de **resultado** redesenhado
  (nota mono colorida por desempenho + copy com direção); modal navegador com sombra + legenda.
- `historico`: cards mobile → `.card card-interactive`; notas → `.score-chip`; botões → `.btn`;
  **empty state** com CTA.
- `conta`: status → `.badge`; botões → `.btn`/`.btn-danger`; loading → **skeleton**.
- `QuestionCard`: wrapper → `.card`; título "Questão N" → `.eyebrow`.
- `NewQuestionClient`, `UsersClient`, `UserDetailsModal`: inputs → `.input`, botões → `.btn`,
  status/plano/admin → `.badge`; modal com sombra.
- `AdminDashboardClient`: stat cards no padrão do dashboard (eyebrow + mono); cores dos gráficos
  alinhadas à paleta (success `#16a34a`, danger `#dc2626`).
- **Preservados:** hero card do Dashboard (`app/(app)/page.tsx` intocado) e paleta.
- **Verificação:** `tsc --noEmit` OK; eslint sem novos erros (5 pré-existentes, todos de lógica);
  primitivas confirmadas via computed styles no browser. _Nota: watcher do Turbopack no Windows
  pode não pegar mudanças em `globals.css` — se o CSS parecer velho, reiniciar o dev server._
</content>
</invoke>
