# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commits — regra obrigatória

**Proibido commitar (ou dar push) sem avisar antes.** Faça as alterações pedidas e
pare por aí — não rode `git commit`/`git push` por conta própria durante a tarefa.
Ao final do trabalho, monte **um único commit geral** com tudo que mudou na sessão e
peça permissão explícita antes de executá-lo. Uma aprovação não vale para o próximo
commit: pergunte de novo toda vez.

## Comandos

```bash
npm run dev        # next dev --turbopack
npm run build      # next build --turbopack
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
```

Um teste só, por arquivo ou por nome:

```bash
npx vitest run lib/sla/prazos.test.ts
npx vitest run -t "recalcula prazos ao definir prioridade"
npx vitest            # watch
```

## Stack

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind v4 ·
shadcn/ui (style `base-nova`, sobre Base UI, ícones lucide) · Supabase (Postgres +
Auth + Realtime + Storage) · Vitest.

Alias `@/*` → raiz do projeto (`tsconfig.json`), replicado em `vitest.config.mts` —
sem isso, módulo que importa de `@/...` falha só sob vitest.

## Arquitetura

### Schema dedicado no Supabase

O help desk vive no schema **`helpdesk`**, não em `public` (que pertence a outro
projeto no mesmo Supabase). **Todo** cliente Supabase precisa de `db: { schema: "helpdesk" }`
— são três, e os três repetem isso: `middleware.ts`, `lib/supabase/server.ts` (Server
Components / Server Actions, via cookies) e `lib/supabase/client.ts` (browser).

### Auth e roteamento por papel

Três papéis: `admin`, `analista`, `solicitante`. Toda a guarda está em `middleware.ts`:

- Usa `getUser()`, nunca `getSession()` — o primeiro revalida o token no servidor Auth;
  o segundo só lê o cookie e aceitaria um token já revogado.
- Busca o papel em `helpdesk.usuario` e aplica `redirectPorPapel()`: solicitante vive em
  `/portal`, staff em `/chamados`. Um papel no shell errado é redirecionado.
- Rotas públicas: `/login` e `/avaliar/*` (link de avaliação por token opaco).
- `/logout` passa direto para o route handler antes da guarda de shell, senão o
  solicitante voltaria para `/portal` sem o `signOut()` rodar.

Daí os dois shells: `app/(app)/` (staff) e `app/(portal)/` (cliente).

### Dado de referência via Context

Empresas, usuários, categorias e políticas de SLA são buscados **uma vez por shell**
no `layout.tsx` de cada grupo de rotas e distribuídos por `ReferenceDataProvider`
(`lib/reference-data/provider.tsx`), em vez de prop-drilling. Use `useReferenceData()`
em client components; os IDs são UUID reais do Supabase.

`lib/mock/data.ts` é o dado mock antigo — só o provider ainda o referencia. Não
reintroduza mock nas telas religadas ao backend. Alguns campos de `Ticket` (`assunto`,
`mesa`, `tarefasAbertas`…) são resquício do mock, sem coluna real; a UI os trata como
enriquecimento opcional.

### Camada de dados

- `lib/tickets/queries.ts` — leitura. Marcado `import "server-only"`. Mapeia
  `snake_case` do Postgres para `camelCase` do domínio (`mapTicket` e afins). Toda
  query roda sob RLS.
- `lib/tickets/actions.ts` e vizinhos (`anexos`, `apontamentos`, `duracao`) — escrita,
  `"use server"`, com `revalidatePath()`. `lib/config/*` faz o mesmo para as telas de
  configuração.

### Motor de SLA (puro, testado)

`lib/sla/` não acessa banco: recebe `Date`, devolve `Date`. É a parte com testes de
verdade, e a fase 1 do roadmap a colocou de propósito antes das telas.

- Expediente fixo e global: **09:00–18:00, seg–sex** (`calendario.ts`).
- Chamado nasce **sem prioridade** e vale a política padrão (`prioridade IS NULL`);
  ao definir prioridade, os prazos recalculam a partir de `criado_em`.
- `pausado` **e** `aguardando_aprovacao` congelam o relógio (`STATUS_PAUSA_SLA`);
  a retomada soma os minutos úteis parados aos dois vencimentos.

### Realtime

`lib/realtime/use-realtime-refresh.ts`. O evento do Postgres é **só o sinal** — nunca
a fonte do dado. Ele dispara `router.refresh()` (debounce de 400ms), e quem recarrega
é o Server Component da rota, refazendo as queries que já respeitam RLS. É o que
impede uma nota interna de vazar para o portal.

A assinatura é feita **sem filtro por linha**, de propósito: o filtro nativo do
Realtime devolvia `401 Unauthorized` porque `auth.uid()` não é propagado para as
funções `SECURITY DEFINER` na conexão de autorização do Realtime. O comentário no
arquivo documenta o que foi tentado — leia antes de "consertar".

### Status e prioridade

Catálogo fixo de 6 status em `lib/types.ts`; a empresa liga/desliga e renomeia via
`empresa_status`. `lib/status.ts` mapeia cada status/prioridade para rótulo, ícone e
**três** tokens de cor distintos (`colorVar`, `colorVarFg` para texto pequeno,
`colorVarSolid` para fundo cheio com texto branco). Não os intercambie — os comentários
no arquivo explicam por que cada um existe e como se comportam no dark mode.

### Migrations

`supabase/migrations/` versiona **todas** as migrations do schema `helpdesk`, aplicadas
no projeto Supabase `byteflow-pro`. Regra: migration nova entra como arquivo **no mesmo
momento** em que é aplicada via MCP ou CLI, com nome batendo com
`supabase_migrations.schema_migrations`. O `README.md` do diretório lista o que cada uma
faz e como conferir que nada ficou de fora.

Detalhe recorrente: Postgres não permite usar um valor de enum recém-criado na mesma
transação — adicionar valor e usá-lo exigem migrations separadas.

## Convenções

- **Domínio em português** (`chamado`, `apontamento`, `prazo`, `papel`), inclusive em
  nomes de arquivo, rota e função. Mantenha.
- Comentário no código explica **por que**, não o quê — vários registram uma tentativa
  que falhou. Leia antes de refatorar o trecho.

## Worktrees e tooling

Há worktrees git em `.claude/worktrees/`, cada uma com uma cópia inteira do projeto
(e seu próprio `.next`). Elas são invisíveis ao git (`.git/info/exclude`) mas não às
ferramentas: ESLint (`.claude/**`, `**/.next/**`) e Vitest (`exclude: [".claude/**"]`)
já as ignoram explicitamente. Se um comando começar a acusar centenas de erros em
arquivos gerados, ou a suíte inflar para bem mais que os 7 arquivos de teste reais,
é isso — corrija o ignore, não os arquivos.

`next.config.ts` fixa `turbopack.root` pelo mesmo motivo: sem isso o Next infere a raiz
errada e passa a observar a árvore inteira do repositório pai.

### Relatórios (fase 8)

`lib/relatorios/` — módulos puros, mesma linha de `lib/sla/`. `metricas.ts` agrupa
tickets por analista/empresa (total, abertos, finalizados, tempo médio de resposta e
solução em minutos úteis via `lib/sla/calendario`, % de cumprimento de SLA — cancelado
fica fora da estatística). `csv.ts` gera o CSV como string pura (sem BOM: quem grava o
Blob prefixa `﻿`, não este módulo). Renderizado em `RelatorioTabela`
(`components/dashboard/`) e no botão "Exportar CSV" do dashboard.

## Roadmap

Fases 0–6 e 8 entregues (scaffold/auth, motor de SLA, CRUD + timeline, Kanban +
realtime, apontamento de horas, anexos, avaliação por token, dashboard/relatórios/CSV).

Fase 7 (e-mail transacional + job de alerta de SLA) **adiada por decisão do usuário**
(2026-08-17) — não é trabalho ativo nem pendência a resolver agora. Retomar só quando
pedido explicitamente; não iniciar por conta própria. Se retomada, a decisão de
provedor (Resend cogitado) e a conta/API key ainda estarão em aberto.

O desenho validado está em `docs/superpowers/specs/2026-08-04-help-desk-design.md`
(decisões fechadas, modelo de dados, responsividade em 375/768/1024/1440). Mudanças
maiores passam pelo OpenSpec em `openspec/` (`changes/` em andamento, `changes/archive/`
concluídas, `specs/` sincronizadas).
