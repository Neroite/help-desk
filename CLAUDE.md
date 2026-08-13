# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git

Nunca rodar `git commit` ou `git push` neste repositório sem autorização explícita do usuário para aquela ação específica. Autorização anterior não vale pra próxima vez — perguntar sempre, mesmo dentro da mesma sessão.

## Stack

Next.js 15 (App Router, Turbopack) + React 19 + TypeScript + Tailwind v4 + shadcn/ui (`components.json` presente). Sem backend/DB — dados são mock, em memória.

## Comandos

```bash
npm run dev      # servidor de desenvolvimento (Turbopack)
npm run build    # build de produção (Turbopack)
npm start        # roda o build
npm run lint     # eslint
```

Não há suíte de testes configurada (nenhum script `test`, nenhum runner instalado).

## Arquitetura

Produto: **Help-Desk** — sistema de chamados estilo MSP, com painel interno para analistas/admins e portal externo para solicitantes.

- `app/(app)/` — área interna autenticada: `dashboard`, `chamados` (lista, detalhe `[numero]`, `meus`, `novo`), `configuracoes` (categorias, empresas, sla, usuarios). Layout próprio em `app/(app)/layout.tsx`.
- `app/(portal)/` — portal do solicitante (externo): `portal` (lista/detalhe `[numero]`, `novo`). Layout próprio em `app/(portal)/layout.tsx`.
- `app/avaliar/[token]/` — avaliação de chamado por link tokenizado, fora dos dois grupos de layout acima.
- `components/chamado/` — componentes de domínio (kanban-board, ticket-card/row, sla-badge, status-badge, prioridade-badge, ticket-timeline, apontamento-horas, comentario-composer, avaliacao-estrelas, anexo-list, filtro-bar).
- `components/ui/` — primitivos shadcn/ui puros, não editar regra de negócio aqui.
- `lib/types.ts` — fonte de verdade dos tipos de domínio (`Ticket`, `StatusKey`, `Prioridade`, `Usuario`, `Empresa`, SLA, etc). Ler este arquivo antes de mexer em qualquer fluxo de chamado.
- `lib/status.ts`, `lib/sla-display.ts`, `lib/sla-clock.tsx` — regras de status e cálculo/exibição de SLA (semáforo: ok/atenção/crítico/estourado/pausado). Status pausado (`pausado`, `aguardando_aprovacao`) suspende contagem de SLA — ver `STATUS_PAUSA_SLA` em `lib/types.ts`.
- `lib/mock/data.ts` — dataset mock único usado por todas as telas (sem API/fetch real).

## Design system

`design-system/help-desk/MASTER.md` é o resumo operacional dos design tokens (cores, status, SLA). A fonte completa (fluxos de usuário, arquitetura de telas) está em `docs/superpowers/specs/2026-08-04-help-desk-design.md`. Se `design-system/help-desk/pages/[nome-da-tela].md` existir para a tela em questão, ele tem prioridade sobre o MASTER.

Convenção: nomes de domínio (rotas, tipos, campos) em português (`chamados`, `solicitante`, `analista`, `statusKey`), mesmo com código/identificadores em inglês onde for idiomático (`Ticket`, `props`, etc).
