## Why

O help desk não tem porta de entrada pública. Hoje `app/page.tsx` só redireciona
`/chamados?view=kanban`, e `middleware.ts` manda qualquer visitante anônimo direto para
`/login` — quem chega no domínio não tem como saber o que o produto faz. O usuário fechou
a marca do produto (**Aegis**) e forneceu a logo; falta a landing de aquisição em `/`.

## What Changes

- Nova landing pública de SaaS B2B em `/`, servida por um route group `app/(site)/`, com
  10 seções (hero, prova de escala, personas, dor→virada, pilares, como funciona, recap+CTA,
  FAQ, CTA final, footer), copy restrita ao que o produto entrega hoje (fases 0–6) e
  mockups de produto recriados em JSX (nunca screenshot ou dado de cliente real).
- `middleware.ts`: `"/"` passa a ser rota pública. Deslogado vê a landing; logado continua
  sendo redirecionado ao shell do papel pela regra já existente. **BREAKING** para quem
  dependia de `/` redirecionar sempre — agora só redireciona quando há sessão.
- `app/page.tsx` é removido (route group resolve `/` no lugar dele).
- Escala tipográfica de display e escopo de `--radius` aditivos em `app/globals.css`,
  sem alterar nenhuma variável consumida pelo app hoje.
- `design-system/help-desk/pages/landing.md` novo, documentando o override explícito das
  proibições de landing-page do `MASTER.md` (`:169-172`), restrito a `app/(site)/**`.
- Marca Aegis como SVG inline (`AegisLogo`), favicon e OG image derivados da logo fornecida.
- Métricas de prova social como placeholders com sentinela — nenhum número inventado
  apresentado como real.

## Capabilities

### New Capabilities
- `landing-publica`: a landing page de aquisição do Aegis em `/` — conteúdo, seções,
  mockups de produto, prova social com placeholders, marca e comportamento responsivo/a11y.

### Modified Capabilities
- `autenticacao-acesso`: o requisito "Login com identificação de papel" (`spec.md:7-8`)
  hoje exige sessão para "qualquer rota que não seja a de login ou a de avaliação por
  token". Passa a excluir também `/` (a landing) — sem sessão, `/` é pública; com sessão,
  o comportamento de redirecionamento por papel já existente continua valendo.

## Impact

- `middleware.ts` — `ROTAS_PUBLICAS` e (opcional) early-return de custo para pageview
  anônimo.
- `app/page.tsx` — removido.
- `app/globals.css` — bloco aditivo de tokens de display, sem tocar nos existentes.
- `app/layout.tsx` — `metadataBase`.
- `design-system/help-desk/MASTER.md` — correção de caminho (`:3`) e nota de exceção (`:169`).
- Novos diretórios: `app/(site)/`, `components/site/`, `lib/site/`.
- Nenhuma migration, nenhuma mudança em RLS ou em `lib/sla/`, `lib/tickets/`.
