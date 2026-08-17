## Context

Ver `proposal.md` — Why. O que molda o desenho técnico:

- As telas já existem e definem o contrato de dados: `lib/types.ts` (camelCase, enums TypeScript) é consumido por todos os componentes de `components/chamado/`. Trocar esse contrato significaria reescrever as telas, o que não é objetivo deste change.
- Várias páginas são Client Component **apenas** porque guardam estado local de protótipo (`useState` + `toast`). Ver o comentário em `app/(app)/chamados/[numero]/page.tsx:83-89`.
- O desenho de produto (`docs/superpowers/specs/2026-08-04-help-desk-design.md`) já fixou stack (Next.js 15 + Supabase), modelo de dados, expediente 09:00–18:00 seg–sex e a exigência de RLS no Postgres em vez de checagem no front.
- `lib/sla-display.ts` calcula severidade só para exibição e declara no comentário que o motor real mora em `lib/sla/`. Este change cria esse motor.
- **Atualizado na implementação**: em vez de projeto novo, o help desk usa o projeto Supabase já existente `byteflow-pro` (`sa-east-1`), por decisão explícita do usuário — ele concentra todos os projetos pessoais ali. O projeto já serve outro sistema (POS: tabelas `clients`, `products`, `sales`, `stock_movements`, `store_settings`, `profiles`, `rate_limit_hits`, `audit_log`, `players`, `goals`, função `public.current_user_role()`). Isso muda duas decisões abaixo — ver "Isolamento em projeto Supabase compartilhado".

## Goals / Non-Goals

**Goals:**

- Uma única fronteira de autorização — as policies do Postgres — em vez de regra duplicada entre front e banco.
- Motor de SLA testável sem banco e sem servidor, coberto por testes antes de ser ligado às telas.
- Preservar `lib/types.ts` e a interface de props dos componentes de domínio: a troca de mock por banco não deve virar refatoração visual.
- Toda escrita passa por Server Action, para que o cálculo de SLA e o registro de evento não dependam de o chamador lembrar de fazê-los.

**Non-Goals:**

- Multi-ambiente (dev/staging/prod) e pipeline de deploy — um projeto Supabase único nesta etapa.
- Otimização de consulta (índices além dos óbvios, paginação por cursor, cache). A fila trabalha com dezenas de chamados no seed.
- Realtime, e-mail, relatórios e E2E — ver os não-objetivos do `proposal.md`.

## Decisions

### Isolamento em projeto Supabase compartilhado

`byteflow-pro` já serve um POS em produção. Duas consequências:

**Schema dedicado `helpdesk`, não `public`.** Todas as tabelas do help desk (`empresa`, `usuario`, `ticket`, etc.) vivem no schema `helpdesk`, exposto à API via `db-schema` (o Supabase permite múltiplos schemas expostos). Isso elimina qualquer risco de colisão de nome com as tabelas do POS e deixa claro, ao olhar `list_tables`, o que pertence a qual sistema. `auth.users` continua compartilhado — é a única identidade de login do projeto — mas `helpdesk.usuario` é que guarda papel e vínculo de empresa, referenciando `auth.users.id`.

*Alternativa descartada:* prefixar tabelas em `public` (`hd_ticket`, `hd_empresa`...) — funciona, mas mistura os dois domínios no mesmo namespace e obriga prefixo em toda referência.

### Papel e empresa via função `SECURITY DEFINER`, não custom access token hook

O *custom access token hook* do Supabase Auth é configuração única por projeto — ativá-lo mudaria o formato do token para o POS também, que não foi desenhado para isso. Alterar esse comportamento de um sistema em produção que não é objeto deste change é risco desproporcional ao ganho.

**Decisão:** `helpdesk.auth_papel()` e `helpdesk.auth_empresa_id()` são funções `SECURITY DEFINER` de superfície mínima (sem `EXECUTE` para `authenticated`, chamadas apenas de dentro de policy), que leem `helpdesk.usuario` por `auth.uid()`, marcadas `stable`. `SECURITY DEFINER` ignora a RLS da própria tabela `usuario` ao ler, então não há recursão. O custo por linha é o mesmo de ler um claim de JWT — Postgres reavalia função `stable` uma vez por statement, não por linha.

*Alternativas:* (a) custom access token hook — descartado pelo motivo acima; (b) subconsulta direta em cada policy — recursão, pois a policy de `helpdesk.usuario` consultaria `helpdesk.usuario`. Consequência aceita, igual ao desenho original: mudança de papel só vale na próxima leitura (sem cache de sessão longa), cenário já coberto na spec `administracao`.

### Server Actions com o cliente autenticado do usuário; `service_role` fora do request

Escrita via Server Action usando cliente Supabase construído a partir dos cookies da sessão. Assim toda consulta e gravação atravessa RLS com a identidade real — a autorização não depende de o código lembrar de filtrar.

A chave `service_role` é usada **apenas** em scripts de seed e migração, nunca dentro do ciclo de request. Rotas `app/api` não são criadas: não há consumidor externo, e Server Actions evitam manter um contrato HTTP paralelo ao das telas.

*Alternativa descartada:* rotas REST em `app/api` — útil se houvesse cliente externo; hoje só acrescentaria uma camada a manter em sincronia.

### Motor de SLA em TypeScript puro, invocado nas Actions — não em trigger

O calendário de expediente é a regra mais densa do sistema e a que mais precisa de teste. Em trigger PL/pgSQL ela seria testável só com banco de pé.

**Decisão:** `lib/sla/calendario.ts` e `lib/sla/prazos.ts` como módulos puros, cobertos por Vitest, chamados pelas Server Actions que abrem chamado, mudam status e definem prioridade. O banco guarda apenas o resultado (instantes absolutos e minutos acumulados de pausa).

*Risco assumido:* uma escrita feita fora do app (SQL direto, painel do Supabase) não recalcula prazo. Mitigado por concentrar escrita nas Actions; a alternativa — duplicar o calendário em PL/pgSQL — traria dois motores para manter em acordo, que é pior.

### Fuso do expediente fixado em America/Sao_Paulo

Timestamps são gravados como `timestamptz` (UTC). O expediente 09:00–18:00, porém, é local: calcular em UTC deslocaria o expediente conforme o horário do servidor.

**Decisão:** o motor converte para `America/Sao_Paulo` para decidir se um instante é útil, e devolve `Date` absoluto. O fuso é uma constante do módulo, não uma configuração por empresa.

### Banco em snake_case, app em camelCase, com mapeadores explícitos

O banco segue a convenção Postgres do documento de desenho (`sla_resposta_vence_em`); `lib/types.ts` já usa camelCase e é consumido por todos os componentes.

**Decisão:** `lib/data/` concentra consultas e converte linha do banco para os tipos de `lib/types.ts`. Os tipos gerados do banco (`supabase gen types`) ficam em arquivo separado e servem para conferir o schema, não para vazar até os componentes.

*Alternativa descartada:* renomear campos em `lib/types.ts` para casar com o banco — mudaria todos os componentes de domínio, contra o objetivo de não transformar isso em refatoração visual.

### Páginas viram Server Component com ilhas cliente e atualização otimista

O estado local de protótipo é substituído por: página busca no servidor → passa dados como props → uma ilha cliente pequena (seletor de status, composer de comentário, timer) dispara a Server Action e usa atualização otimista para manter o feedback imediato e os toasts que já existem.

Isso preserva o comportamento percebido hoje — o valor muda na hora — mas agora ele persiste. Sem otimismo, cada troca de status esperaria o round-trip e a tela pareceria mais lenta que o protótipo.

### Avaliação por token via função `SECURITY DEFINER`, sem `service_role` na rota

A página `/avaliar/[token]` é pública. Consultá-la com `service_role` daria à rota poder total sobre o banco caso o parâmetro escape do filtro.

**Decisão:** duas funções `SECURITY DEFINER` de superfície mínima — uma lê o essencial do chamado a partir do token, outra grava a avaliação — cada uma validando o token internamente. A rota nunca recebe chave privilegiada. Token gerado com bytes aleatórios codificados em base64url, guardado em coluna única do chamado.

### Anexos em bucket privado com policies espelhando o chamado

Bucket `anexos` privado, caminho `{numero_do_chamado}/{uuid}-{nome}`. As policies do Storage repetem a regra de visibilidade do chamado correspondente. A leitura acontece por *signed URL* de validade curta, emitida em Server Action. Limite adotado: 10 MB por arquivo.

### Numeração pelo banco

`ticket.numero` é `identity` / sequência global do Postgres. Contar linhas e somar um colide sob concorrência — cenário já coberto na spec `chamados`.

## Risks / Trade-offs

- **RLS incompleta vaza dado entre empresas** → após cada migration, rodar `get_advisors` do MCP Supabase e um roteiro de acesso por papel (solicitante A tentando ler chamado da empresa B, ler nota interna, gravar em configuração) antes de dar a tarefa por concluída.
- **Policy correta mas consulta que a contorna** — usar `service_role` por engano dentro de uma página anula toda a RLS → a chave privilegiada fica em módulo próprio, importado apenas por scripts, e o cliente de request não a recebe.
- **Divergência entre enums TypeScript e enums Postgres** (ex.: novo status só de um lado) → tipos gerados do banco conferidos em `npm run typecheck`, com o gerado importado onde os enums são declarados.
- **Seed com senhas de teste versionadas** → usuários de seed são criados por script lendo senha de variável de ambiente; `.env.example` traz o nome da variável, nunca o valor.
- **Remoção do mock quebra telas ainda não migradas** → `lib/mock/data.ts` só é apagado na última tarefa, depois que nenhum import restar; a verificação é um `grep` por `@/lib/mock/data` retornando vazio.
- **Escopo grande em um único change** → a ordem das tarefas entrega valor verificável em etapas (auth funcionando, depois SLA testado, depois chamados persistindo), permitindo parar num ponto estável se necessário.
- **Projeto compartilhado com o POS `byteflow-pro`** — uma migration ou policy mal escrita pode afetar dado ou usuário daquele sistema, que está em uso → schema `helpdesk` isolado (nunca `public`), nenhuma alteração em tabela, função ou configuração de auth pré-existente do POS; baseline de `get_advisors` capturado antes da primeira migration do help desk para diferenciar aviso novo de aviso pré-existente.

## Migration Plan

1. Registrar as variáveis do projeto `byteflow-pro` (`dyutvxtrcchkqvykjmyy`) em `.env.local`; `.env.example` versionado.
2. Migrations em ordem: enums e tabelas de cadastro → `ticket` e satélites → funções auxiliares de papel → policies de RLS → bucket e policies de Storage → funções de avaliação por token.
3. Seed derivado de `lib/mock/data.ts` (2 empresas, analistas, ~20 chamados em status variados) mais os usuários de teste dos três papéis.
4. Motor de SLA com testes verdes antes de qualquer tela ler o banco.
5. Telas migradas por área, cada uma verificável em `npm run dev`: login → fila e detalhe → portal → configuração → dashboard.
6. Remoção de `lib/mock/data.ts` como último passo.

**Rollback:** o trabalho vive em worktree e branch próprios; nada é mesclado em `main` antes de as telas rodarem com o banco. No banco, cada migration é um arquivo versionado — reverter é aplicar a migration de compensação ou recriar o projeto a partir das migrations e do seed, já que não há dado de produção nesta etapa.

## Open Questions

- Retenção e cota de anexos por empresa (hoje: só limite por arquivo de 10 MB) — não afeta specs nem tarefas; decidível quando houver uso real.
- Se o dashboard deve agregar por consulta direta ou por *view* materializada — a decisão depende do volume, e a consulta direta atende o seed atual sem mudar comportamento observável.
- Se `admin` deve ver o apontamento de horas de todos os analistas em relatório consolidado — fora do escopo desta etapa, pois relatórios ficaram para a fase de dashboard.
