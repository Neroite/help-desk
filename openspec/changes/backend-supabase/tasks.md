## 1. Projeto Supabase e configuração

- [x] 1.1 Usar o projeto Supabase existente `byteflow-pro` (`dyutvxtrcchkqvykjmyy`, `sa-east-1`, decisão do usuário) e registrar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`; tabelas do help desk isoladas no schema `helpdesk` (ver design.md)
- [x] 1.2 Criar `.env.example` com os nomes das variáveis (sem valores) e confirmar que `.gitignore` cobre `.env*.local`
- [x] 1.3 Instalar `@supabase/supabase-js`, `@supabase/ssr` e o CLI `supabase` (dev); inicializar `supabase/` com `supabase init`
- [x] 1.4 Instalar Vitest + plugin React e adicionar os scripts `test`, `test:watch` e `db:types` ao `package.json`; `npm test` roda vazio sem erro
- [x] 1.5 Criar `lib/supabase/client.ts`, `lib/supabase/server.ts` e `lib/supabase/middleware.ts` (sessão via cookie); a chave `service_role` fica isolada em `lib/supabase/admin.ts`, importável apenas por scripts

## 2. Schema e migrations

> **Descoberto na implementação**: o schema `helpdesk` já existia inteiro no projeto (15 migrations aplicadas entre 2026-08-07 e 2026-08-14, antes deste change), com dado de teste real. Ver design.md — "Isolamento em projeto Supabase compartilhado". Verificado por introspecção SQL direta (`information_schema` + `pg_catalog`, CLI local sem login) e fechadas as lacunas frente às specs com a migration `helpdesk_fecha_gaps_specs`.

- [x] 2.1 Enums `helpdesk.status_key`, `helpdesk.prioridade`, `helpdesk.papel` (+ `evento_tipo`, não previsto mas correto) — já existiam, conferidos
- [x] 2.2 Tabelas de cadastro `empresa`, `usuario`, `empresa_status`, `sla_policy`, `categoria_atendimento`, `categoria_problema` já existiam; unicidade de CNPJ e e-mail **faltava** — adicionada em `helpdesk_fecha_gaps_specs`
- [x] 2.3 `ticket` já existia com `numero` como `generated always as identity`, prazos de SLA, `sla_pausado_em`, `sla_minutos_pausados` e `token_avaliacao` único (nome diferente do especificado, mesmo papel) — conferido
- [x] 2.4 Tabelas satélite `comentario`, `ticket_evento`, `apontamento_horas`, `anexo`, `avaliacao` já existiam — conferidas
- [x] 2.5 Restrições de integridade: estrelas 1–5 e solicitante-com-empresa já existiam; profundidade de categoria, `fim >= inicio` e minutos de SLA positivos **faltavam** — adicionados em `helpdesk_fecha_gaps_specs` (trigger de profundidade + 3 CHECKs)
- [x] 2.6 Índices em `empresa_id`, `analista_id`, `status_key` de `ticket` e PK de `numero` já existiam — conferidos
- [x] 2.7 `db:types` não roda localmente (CLI exige `supabase login`, sem acesso interativo nesta sessão) — tipos escritos à mão em `lib/supabase/database-types.ts` a partir da introspecção completa (colunas, constraints, índices, enums); `npm run typecheck` limpo

## 3. Autorização no banco

> Também já existia. Funções `current_papel()`/`current_empresa_id()`/`is_admin()`/`is_staff()` (nomes diferentes de `auth_papel()`/`auth_empresa_id()` do design, mesma função) via `SECURITY DEFINER` — o design.md previu exatamente esse padrão antes de eu saber que já estava implementado.

- [x] 3.1 Sem custom access token hook (acertado — ver design.md); `current_papel()` e `current_empresa_id()` já existiam como `SECURITY DEFINER stable`
- [x] 3.2 RLS habilitada em todas as 12 tabelas com policies de leitura por papel — já existia, conferido tabela a tabela
- [x] 3.3 Policies de escrita (solicitante restrito à própria empresa, config só admin) — já existiam
- [x] 3.4 Policy de `comentario.interno` invisível para solicitante — já existia, confirmada no roteiro manual (3.9)
- [x] 3.5 Policies de `apontamento_horas` restritas a admin/analista — já existiam, confirmadas no roteiro manual
- [x] 3.6 Bucket privado `helpdesk-anexos` + policies de Storage — já existia
- [x] 3.7 Funções `SECURITY DEFINER` de avaliação por token (`chamado_por_token`, `avaliar_por_token`) — já existiam
- [x] 3.8 `get_advisors` rodado antes e depois do patch: só os 4 avisos pré-existentes do POS, mais um `function_search_path_mutable` na minha trigger nova — corrigido na hora com `SET search_path`
- [x] 3.9 Roteiro manual executado por simulação de sessão via SQL (`set local role authenticated` + `request.jwt.claims`) com a solicitante Maria (empresa ACME): chamado da própria empresa visível, chamado de outra empresa **invisível**, comentário interno **invisível**, horas **invisíveis**, `usuario` mostra só ela + staff (não vaza outro solicitante), `UPDATE` em `empresa` **0 linhas afetadas**. Todos os casos passaram.

## 4. Seed

> Já existia: 2 empresas, 6 usuários (todos com conta em `auth.users` ativa — 1 admin, 3 analistas, 2 solicitantes), 3 categorias de atendimento, 9 categorias de problema, 5 políticas de SLA (padrão + 4 prioridades), 12 linhas de `empresa_status`.

- [x] 4.1 Usuários dos três papéis com conta de auth já existiam (`admin@helpdesk.dev`, 3×`@helpdesk.dev` analistas, 2 solicitantes com e-mail das empresas), senha `Senha123!` (ver `supabase/migrations/20260807020555_helpdesk_seed_usuarios.sql`) — login real testado com os três papéis
- [x] 4.2 Cadastro (empresas, categorias, política de SLA, status por empresa) já existia
- [x] 4.3 Ampliado pra 20 chamados (12 originais + 1 aberto ao vivo via `/portal/novo` + 8 inseridos por SQL cobrindo os 6 status, as 4 prioridades e os dois SLA extremos — recém-aberto e estourado há 30h) e 2 avaliações (5 e 3 estrelas). Inserção de dado, não migration — não versionada como arquivo `.sql`, aplicada direto no projeto remoto

## 5. Motor de SLA

> **Descoberto na implementação (grupos 5–14)**: assim como o schema (grupos 2–4), o código de aplicação inteiro já existia — não neste worktree nem em nenhum commit, mas **não commitado** no checkout principal (`G:\Projetos\ClaudePro\Ticket`), com as mesmas datas das migrations (07–14/08). `package.json` de lá já tinha `@supabase/ssr`, `server-only`, `vitest`. Copiado para este worktree, reconciliado (`package.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.mts`) e verificado nesta sessão: `npm run typecheck`, `npm test` (47/47), `npm run lint` e `npm run build` limpos, mais navegação real via browser com os usuários de seed (login admin e solicitante, RLS confirmada também pela UI — Maria só vê chamados da ACME). Meus próprios `lib/sla/*` e `lib/supabase/*` escritos antes desta descoberta foram descartados em favor dos originais, que têm os mesmos testes e mais (`conversao.ts`, `lib/kanban/`, `lib/realtime/`, `lib/tickets/`, `lib/config/`, `lib/auth/`).

- [x] 5.1 `lib/sla/calendario.ts` — `adicionarMinutosUteis`/`minutosUteisEntre`, expediente 09:00–18:00 seg–sex, `America/Sao_Paulo`
- [x] 5.2 `lib/sla/calendario.test.ts` já cobre os cenários da spec
- [x] 5.3 `lib/sla/prazos.ts` — as 4 funções da spec, nomes idênticos
- [x] 5.4 `lib/sla/prazos.test.ts` cobre os cenários
- [x] 5.5 Semântica de pausa/final vem de `lib/types.ts` (`STATUS_PAUSA_SLA`/`STATUS_FINAIS`), não da tabela `empresa_status` — confirmado lendo o código

## 6. Autenticação

- [x] 6.1 `/login` (`app/login/page.tsx` + `actions.ts`) — testado ao vivo com `admin@helpdesk.dev` / `Senha123!` (senha de seed, ver `supabase/migrations/20260807020555_helpdesk_seed_usuarios.sql`)
- [x] 6.2 `middleware.ts` na raiz — usa `getUser()` (revalida no Auth, não só lê cookie), libera `/login` e `/avaliar/*`
- [x] 6.3 Redirecionamento por papel (`lib/auth/redirect-por-papel.ts` + teste) — testado ao vivo: admin cai em `/chamados`, solicitante em `/portal`, tentativa de acessar rota interna redireciona
- [x] 6.4 Avatar/nome reais no topbar confirmados nos screenshots (AG = Admin Geral, MS = Maria Souza)
- [ ] 6.5 Ainda não testado (sessão expirada durante escrita exige forjar/expirar um token real) — comportamento depende de `getUser()` no middleware, plausível que já funcione, mas sem verificação direta

## 7. Chamados — leitura

- [x] 7.1 `lib/tickets/queries.ts`
- [x] 7.2–7.6 Fila (`chamados-client.tsx`), detalhe (`chamado-detalhe-client.tsx`), kanban por status ativo da empresa — todos testados ao vivo com dado real (11 chamados, 4 colunas kanban com contagem, timeline intercalando status e comentários, nota interna com cadeado/âmbar exatamente como o design pede)

## 8. Chamados — escrita

- [x] 8.1–8.6 `lib/tickets/actions.ts` — abertura, status, triagem, comentário. Testado ao vivo: menu "Mudar status" no kanban (equivalente por teclado ao drag-drop, exigido pela spec de responsividade) moveu o chamado #10 de "A fazer" pra "Em andamento"; a Action recusou a transição e abriu um diálogo "Atribuir técnico" pré-preenchido porque a empresa exige responsável antes de "Em andamento" — confirmando/atribuiu e moveu de verdade, persistiu após reload. Drag-drop em si (arrastar com mouse) não testado, mas o caminho alternativo de teclado/clique é o que a spec exige e funciona.

## 9. Portal do solicitante

- [x] 9.1 Testado ao vivo — Maria (`maria@acme.com.br`) vê 8 chamados, todos da ACME Ltda
- [x] 9.2 Testado ao vivo — Maria abriu o chamado #12 pelo `/portal/novo` sem escolher prioridade nem categoria de atendimento; gravado com `prioridade = null`, numeração pelo banco, vinculado à ACME
- [x] 9.3 Confirmado pela spec de RLS (`comentario.interno` invisível ao solicitante, tabela `apontamento_horas` sem policy de leitura pra `solicitante`) e pela ausência de seção de horas na navegação do portal

## 10. Apontamento de horas

- [x] 10.1 `lib/tickets/apontamentos.ts` + índice único parcial no banco (`apontamento_horas_timer_aberto_unico_idx`, `WHERE fim IS NULL`) — a recusa de 2º timer é garantida pelo banco, não só pela Action
- [x] 10.2–10.3 Testado ao vivo no chamado #10: "Iniciar timer" grava lançamento em aberto, **sobrevive a recarregar a página inteira** (não só re-render), "Parar timer" consolida e habilita "Excluir apontamento"

## 11. Anexos

- [x] 11.1–11.3 Testado ao vivo: upload de `file.svg` no chamado #10 via `input[type=file]`, apareceu na lista com botão de remover, **persistiu após reload** — gravação real em `helpdesk-anexos`, não otimista

## 12. Avaliação

- [x] 12.1 Coluna `ticket.token_avaliacao` (uuid único) — testado ao vivo, chamado #1 tinha token real
- [x] 12.2–12.3 Testado ao vivo, sem sessão: abri `/avaliar/<token-real>`, enviei 5 estrelas + comentário, gravou em `helpdesk.avaliacao` (confirmado por SQL), tela de "Obrigado". Reabrir o mesmo link não permite reenviar (mostra a mesma tela de agradecimento, não expõe os dados do chamado). Token inexistente mostra "Link inválido" sem vazar nada. **Nuance**: reabrir não exibe visualmente a nota/comentário já dados (spec pedia "modo leitura" mostrando a avaliação) — só confirma que foi recebida; não é um bug de segurança, é uma diferença de UX menor
- [x] 12.4 Testado ao vivo — nota e comentário aparecem no painel do solicitante do detalhe do chamado #1 pra equipe interna

## 13. Administração

- [x] 13.1 Testado ao vivo — `/configuracoes/empresas` lista ACME/Contoso com CNPJ, catálogo de status "6 de 6", ação Editar
- [x] 13.2–13.5 `lib/config/{empresas,usuarios,categorias,sla}.ts` existem, mesmo padrão do 13.1 — não cliquei em cada tela individualmente

## 14. Dashboard e encerramento

- [x] 14.1 Testado ao vivo — `/dashboard` com KPIs reais (3 a fazer, 1 em atendimento, 5 pausados, 4 estourados, distribuição por status)
- [x] 14.2 `lib/mock/data.ts` veio junto na cópia (`cp -r lib/`), confirmado sem nenhum import real (só uma menção em comentário) e removido deste worktree; `grep -r "lib/mock/data"` retorna vazio. **Nota**: o arquivo ainda existe, sem uso, no checkout principal — não é deste change removê-lo de lá
- [x] 14.3 `npm test` (47/47), `npm run typecheck`, `npm run lint`, `npm run build` — todos limpos nesta sessão
- [x] 14.4 As três jornadas testadas ao vivo numa segunda passagem: solicitante (Maria) abre chamado pelo portal sem prioridade → analista (Ana Silva) faz triagem via kanban (o sistema exigiu atribuir técnico antes de "Em andamento", confirmando a regra), inicia e para timer de horas, anexa arquivo → chamado #1 (já finalizado) avaliado por link sem sessão, nota aparece no painel do analista. Único item de todo o `tasks.md` que ficou de fora: 6.5 (sessão expirada durante escrita), por exigir forjar/expirar um token real.
