## Why

Todas as telas do help desk já existem e navegam, mas nenhuma delas persiste nada: o app inteiro lê `lib/mock/data.ts`, um array estático em memória. Não há banco, não há login, não há isolamento entre empresas — trocar o status de um chamado só emite um `toast` e o valor volta ao original no próximo carregamento. O desenho validado em `docs/superpowers/specs/2026-08-04-help-desk-design.md` já fechou a stack (Next.js 15 + Supabase), o modelo de dados e as regras de SLA; falta executá-lo. Este change entrega a fase 0 (Supabase, auth, migrations, RLS, seed) somada às fases que dependem dela para que as telas existentes deixem de ser protótipo: motor de SLA, persistência de chamados, horas, anexos e avaliação.

## What Changes

- **Projeto Supabase dedicado** ao help desk, com migrations versionadas em `supabase/migrations/` cobrindo todo o modelo de dados do desenho: `empresa`, `usuario`, `empresa_status`, `sla_policy`, `categoria_atendimento`, `categoria_problema`, `ticket`, `comentario`, `apontamento_horas`, `anexo`, `avaliacao`, `ticket_evento`. `status_key` e `prioridade` como enums Postgres espelhando os enums TypeScript de `lib/types.ts`.
- **Autenticação real** por e-mail/senha via Supabase Auth, com sessão em cookie (`@supabase/ssr`), rota `/login`, `middleware.ts` protegendo as rotas e redirecionamento por papel: admin/analista para `(app)`, solicitante para `(portal)`.
- **RLS em todas as tabelas**, não checagem no front: solicitante enxerga apenas a própria empresa, `comentario.interno = true` invisível para solicitante na policy, escrita em configuração restrita a admin, bucket de anexos privado com acesso por signed URL.
- **Motor de SLA** (`lib/sla/calendario.ts` e `lib/sla/prazos.ts`): módulo puro, sem acesso a banco, com horário comercial 09:00–18:00 seg–sex, pausa em `pausado`/`aguardando_aprovacao` e recálculo de prazos no triage de prioridade. Coberto por testes unitários (Vitest) antes de ser ligado às telas.
- **Persistência dos chamados**: abertura (portal e interno), numeração serial global, triage (prioridade, categoria de atendimento, atribuição), troca de status, comentários públicos e internos, e registro automático em `ticket_evento` para alimentar a timeline. Filtros da fila passam a consultar o banco a partir dos mesmos query params já usados na URL.
- **Apontamento de horas** com timer persistido (lançamento aberto com `fim` nulo sobrevive a recarregar a página), flag faturável e totais por chamado.
- **Anexos** via Supabase Storage em bucket privado, com upload no chamado e no comentário, e leitura por signed URL de validade curta.
- **Avaliação** 1–5 estrelas em `/avaliar/[token]`, com token opaco gerado na finalização do chamado e válido sem login, uma avaliação por chamado.
- **Dashboard** passa a ler agregados reais (KPIs já exibidos hoje), em vez do mock.
- **BREAKING** — `lib/mock/data.ts` é removido ao final. Todo componente e página que hoje importa de `@/lib/mock/data` passa a receber dados via Server Component ou Server Action. Os tipos de `lib/types.ts` permanecem como contrato compartilhado, gerados/conferidos contra os tipos do banco.

Não fazem parte deste change: realtime no kanban (fase 3), e-mail transacional e job de alerta de SLA (fase 7), relatórios e exportação CSV (fase 8), e testes E2E Playwright — o link de avaliação, que na fase 7 chegaria por e-mail, fica acessível na própria tela do chamado finalizado.

## Capabilities

### New Capabilities

- `autenticacao-acesso`: login, sessão, os três papéis (admin, analista, solicitante), redirecionamento por papel e as regras de isolamento aplicadas no banco via RLS — incluindo a invisibilidade de nota interna para o solicitante.
- `motor-sla`: cálculo de prazos de resposta e solução em minutos úteis, congelamento e retomada do relógio, e recálculo quando a prioridade é definida no triage.
- `chamados`: ciclo de vida do chamado — abertura, numeração global, triage, transições de status, comentários e trilha de eventos que alimenta a timeline, além dos filtros da fila.
- `apontamento-horas`: lançamentos de horas por analista, timer persistido e marcação de faturável.
- `anexos`: upload, armazenamento privado e leitura controlada de arquivos anexados a chamados e comentários.
- `avaliacao`: coleta da nota de 1 a 5 estrelas por link com token, sem exigir login.
- `administracao`: gestão de empresas, usuários, categorias, política de SLA e status ativos/renomeados por empresa.

### Modified Capabilities

- Nenhuma. As capacidades declaradas por `frontend-visual-polish` (`design-system`, `navigation`) tratam de apresentação e não têm requisito alterado aqui; nenhuma spec em `openspec/specs/` descreve comportamento de dados hoje.

## Impact

- **Dependências novas**: `@supabase/supabase-js`, `@supabase/ssr`, `supabase` (CLI, dev), `vitest` + `@vitejs/plugin-react` (dev) para os testes do motor de SLA. Scripts `test` e `db:*` no `package.json`.
- **Configuração**: `.env.local` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` (apenas server-side); `.env.example` versionado; `.gitignore` conferido para não versionar segredo.
- **Código novo**: `supabase/migrations/`, `supabase/seed.sql`, `lib/supabase/` (clientes browser/server/middleware), `lib/sla/`, `lib/data/` (consultas), `app/actions/` (Server Actions), `middleware.ts`, `app/login/`.
- **Código alterado**: praticamente toda página em `app/` — as que hoje são Client Component apenas por causa de `useState` local passam a Server Component com Server Actions; `app/(app)/chamados/[numero]/page.tsx` é a maior delas. Componentes em `components/chamado/` mantêm a interface de props e passam a receber dados reais.
- **Código removido**: `lib/mock/data.ts` e todos os seus imports.
- **Dado**: seed derivado do mock atual (2 empresas, analistas e ~20 chamados em status variados) para que as telas continuem verificáveis em `npm run dev`.
- **Risco principal**: RLS mal configurada vaza dado entre empresas. Mitigação: `get_advisors` do MCP Supabase após cada migration e um teste de acesso por papel antes de considerar a tarefa concluída.
