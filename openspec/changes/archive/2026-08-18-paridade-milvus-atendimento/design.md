## Context

Ver `proposal.md` — Why. Este design cobre a parte de maior risco técnico: as
migrations novas no schema `helpdesk` (projeto Supabase `byteflow-pro`) e o cálculo do
progresso de SLA. O resto (cores, contraste, responsividade, drag, drill-down, modais)
é implementação direta sem decisão de arquitetura relevante e está detalhado no plano
de tarefas.

Fatos do estado atual usados como base:
- `helpdesk.ticket.numero bigint generated always as identity` é a **chave primária**;
  todo FK para ticket referencia `numero`, não um `id` separado.
- O motor de SLA (`lib/sla/`) é puro — recebe `Date`, devolve `Date`, sem acesso a
  banco. `aplicarPausa`/`aplicarRetomada` já leem/gravam `slaPausadoEm` e
  `slaMinutosPausados`; a UI hoje ignora esses campos e calcula em tempo de parede.
- RLS existente segue sempre o padrão `is_staff() or empresa_id = current_empresa_id()`
  (4 funções `SECURITY DEFINER` em `20260807015958_helpdesk_rls.sql`), e Postgres não
  aceita usar um valor de enum novo na mesma transação em que ele foi criado —
  precedente já resolvido assim em `20260813000003_helpdesk_evento_tipos_atendimento.sql`.

## Goals / Non-Goals

**Goals:**
- Especificar exatamente as migrations da Fase 5, na ordem em que devem ser criadas e
  aplicadas, incluindo RLS.
- Fixar a fórmula de progresso de SLA (fase 3) para que a implementação e os testes
  fiquem inequívocos.
- Registrar as decisões de UI que não são óbvias a partir da spec (onde o `Card` novo
  entra, como o drag é destravado, como o comentário-com-horas grava duas linhas).

**Non-Goals:**
- Não redesenha o motor de SLA (`lib/sla/`) — ele permanece puro e correto; só a
  camada de exibição muda.
- Não adiciona colunas de tipo/deslocamento/valor em `apontamento_horas` (fora de
  escopo, ver proposal.md — Impact).
- Não implementa e-mail transacional nem alerta automático de SLA (fases 7–8).

## Decisions

### D1 — Progresso de SLA: minutos úteis, não tempo de parede

`sla-progress.tsx` hoje calcula `(agora - criadoEm) / (venceEm - criadoEm)`. Passa a
calcular:

```
minutosTotais = minutosUteisEntre(criadoEm, venceEm)          // já existe, lib/sla/calendario.ts
minutosPausadosAteAgora = slaMinutosPausados
  + (pausadoAgora ? minutosUteisEntre(slaPausadoEm, agora) : 0)
minutosDecorridos = minutosUteisEntre(criadoEm, agoraOuFimEfetivo) - minutosPausadosAteAgora
percentual = clamp(minutosDecorridos / minutosTotais * 100, 0, 100)
```

`agoraOuFimEfetivo` é `agora` para chamado ativo, `primeiraRespostaEm`/`finalizadoEm`
para o SLA já encerrado (SLA de resposta encerra em `primeira_resposta_em`; SLA de
solução encerra em `finalizado_em`). Isso é o que cumpre "indicador congela ao
finalizar" da spec `sla-visual` sem exigir nenhuma coluna nova — os dois timestamps já
existem em `helpdesk.ticket`.

Alternativa considerada: persistir o percentual no banco a cada evento. Rejeitada —
o percentual é derivável a qualquer momento a partir de colunas já existentes; gravar
duplicaria estado e criaria divergência quando o `useSlaClock()` faz tick sem escrever
no banco.

**Severidade** (`lib/sla-display.ts`) troca o corte fixo de 60 minutos por limiares
percentuais (ex.: `≥75%` atenção, `≥90%` crítico, `≥100%` ou prazo já passado
estourado), usando o mesmo `minutosTotais`/`minutosDecorridos` acima.

### D2 — Kanban: primeiro destravar o drag, depois removê-lo (decisão do usuário)

`ticket-card.tsx` renderiza o card inteiro como `<Link>`; a âncora HTML é `draggable`
por padrão e seu `dragstart` nativo competia com o `PointerSensor` do dnd-kit
(`activationConstraint: { distance: 6 }`), impedindo tanto o arrasto quanto o clique
curto de funcionarem. Corrigido com `draggable={false}` + `onDragStart={(e) =>
e.preventDefault()}` no `Link` — e confirmado em runtime que o arrasto passou a
funcionar de verdade (dnd-kit, guarda de técnico, coluna derivada, tudo operando).

**Depois de ver o resultado funcionando, o usuário pediu para remover o arrasto por
completo** — o Kanban vira somente visualização; mudar status só no detalhe do
chamado, no menu rápido da lista (`TicketQuickEdit`) ou nas ações em lote
(`BulkActionBar`). Consequência: todo o dnd-kit (`DndContext`, `useDraggable`,
`useDroppable`, sensors, `DragOverlay`) sai de `kanban-board.tsx`; o menu "⋮" de
mudança rápida por card também sai (menos um jeito de mudar status pelo board, não só
o arrasto). Isso deixa `dropPermitido`/`ResultadoDrop` (`lib/kanban/colunas.ts`) e a
action `atribuirEMover` (`lib/tickets/actions.ts`) sem nenhum chamador — removidos,
junto com `AtribuirTecnicoDialog` (que só existia para esse fluxo). O `draggable={false}`
no `Link` continua fazendo sentido por conta própria (evita o "fantasma" de arrasto
nativo do navegador num link), mesmo sem dnd-kit por trás.

A regra de negócio "técnico atribuído antes de sair de A fazer" não muda — ela vive
no server, dentro de `mudarStatus`/`atribuirAnalista`, e continua valendo pros
caminhos que sobraram (quick-edit, bulk). Só deixa de ter uma segunda camada de guarda
client-side específica do Kanban, porque o Kanban não inicia mudança de status.

### D3 — Componente `Card` novo

`components/ui/card.tsx` não existe hoje; sete lugares repetem
`border border-border ... rounded-*` manualmente. Criar um `Card` shadcn-padrão
(`Card`, `CardHeader`, `CardContent` — só o necessário, sem `CardFooter` se não usado)
com a borda de contraste corrigida (D4), e migrar os sete usos existentes para ele,
para que a correção de contraste valha em um só lugar.

### D4 — Tokens de cor

`app/globals.css`: reescrever os seis pares `--status-*`/`--status-*-fg` com as cores
do Milvus (ver mapeamento no plano de tarefas), recalculando cada `-fg` para manter
≥4.5:1 sobre `--surface`/`--card` em cada tema — o arquivo já documenta o contraste
calculado ao lado de cada valor (`globals.css:147-158`), manter esse padrão. Separar
`--muted` de `--card`/`--surface` no `.dark` (hoje idênticos, `#1e293b`). Escurecer
`--border` claro de `#e2e8f0` para algo como `#cbd5e1`. Ligar `colorVarFg` (definido em
`lib/status.ts` mas nunca lido) nos componentes que hoje usam `colorVar` para texto
pequeno.

### D5 — Migrations da Fase 5 (schema `helpdesk`)

Sete migrations, cada uma um arquivo em `supabase/migrations/`, aplicada e versionada
no mesmo passo (regra do `README.md` do diretório). Nomeação:
`YYYYMMDDHHMMSS_helpdesk_<slug>.sql`, timestamp gerado no momento da aplicação real
(não neste documento).

1. **`helpdesk_ticket_relacionamento`**
   ```sql
   alter table helpdesk.ticket
     add column pai_id bigint references helpdesk.ticket(numero),
     add column conciliado_em bigint references helpdesk.ticket(numero);
   create index ticket_pai_id_idx on helpdesk.ticket(pai_id);
   create index ticket_conciliado_em_idx on helpdesk.ticket(conciliado_em);
   ```
   `pai_id` e `conciliado_em` são mutuamente exclusivos por convenção de aplicação
   (um ticket não é ao mesmo tempo filho de divisão de trabalho e duplicado
   conciliado) — não é imposto por `check` para não engessar um caso legítimo futuro
   de um filho também ser conciliado.

2. **`helpdesk_evento_tipos_relacionamento`** — migration isolada, só o `alter type`:
   ```sql
   alter type helpdesk.evento_tipo add value 'filho';
   alter type helpdesk.evento_tipo add value 'conciliacao';
   alter type helpdesk.evento_tipo add value 'contato';
   alter type helpdesk.evento_tipo add value 'mesa';
   ```
   Precisa ser sua própria transação/migration porque Postgres não permite usar um
   valor de enum recém-criado na mesma transação em que foi adicionado.

3. **`helpdesk_ticket_visualizacao`**
   ```sql
   create table helpdesk.ticket_visualizacao (
     ticket_id bigint not null references helpdesk.ticket(numero) on delete cascade,
     usuario_id uuid not null references helpdesk.usuario(id) on delete cascade,
     visto_em timestamptz not null default now(),
     primary key (ticket_id, usuario_id)
   );
   ```
   `visto_em` é sobrescrito (`upsert`) a cada nova visualização — a UI mostra "última
   vez que cada pessoa viu", não um log de todas as visualizações.

4. **`helpdesk_ticket_contato`**
   ```sql
   create table helpdesk.ticket_contato (
     ticket_id bigint not null references helpdesk.ticket(numero) on delete cascade,
     usuario_id uuid not null references helpdesk.usuario(id) on delete cascade,
     criado_em timestamptz not null default now(),
     adicionado_por uuid references helpdesk.usuario(id),
     primary key (ticket_id, usuario_id)
   );
   ```
   Quem abriu o chamado (`ticket.solicitante_id`) não precisa de linha aqui — a spec
   `chamado-participantes` trata "contato de quem abriu" como derivado de
   `solicitante_id`, e esta tabela só guarda os **adicionais**.

5. **`helpdesk_mesa_setor`**
   ```sql
   create table helpdesk.mesa_trabalho (
     id uuid primary key default gen_random_uuid(),
     nome text not null,
     ativo boolean not null default true
   );
   create table helpdesk.setor (
     id uuid primary key default gen_random_uuid(),
     nome text not null,
     empresa_id uuid references helpdesk.empresa(id)
   );
   alter table helpdesk.ticket add column mesa_id uuid references helpdesk.mesa_trabalho(id);
   alter table helpdesk.usuario add column setor_id uuid references helpdesk.setor(id);
   ```
   `setor.empresa_id` é nullable — cobre tanto setor interno da equipe quanto setor do
   lado do cliente, igual ao dado hoje mostrado como "Setor do Solicitante" na
   referência Milvus.

6. **`helpdesk_rls_relacionamento`** — habilita RLS e replica o padrão existente
   (`is_staff() or empresa_id = current_empresa_id()`) nas quatro tabelas novas mais os
   dois campos novos de `ticket`; `mesa_trabalho` é catálogo global (select livre para
   staff, sem filtro de empresa, mesmo padrão de `categoria_atendimento`).

7. **`helpdesk_realtime_relacionamento`** — adiciona `ticket_contato` e
   `ticket_visualizacao` à publicação realtime só se as telas precisarem refletir
   mudança de outro usuário em tempo real (ex.: ver "fulano acabou de visualizar" sem
   recarregar); avaliar durante a implementação se o `router.refresh()` já disparado
   por mudança em `ticket` é suficiente antes de adicionar mais tabelas à publicação.

Alternativa considerada para pai/filho e conciliação: uma única tabela genérica
`ticket_relacionamento(ticket_a, ticket_b, tipo)`. Rejeitada — os dois FKs diretos em
`ticket` (`pai_id`, `conciliado_em`) mantêm o padrão do resto do schema (FK direta,
não tabela de associação genérica) e tornam a query "detalhe do ticket" uma leitura
simples sem join extra para o caso comum.

### D6 — Modal de comentário com horas

Um único `Dialog` novo (`components/chamado/novo-comentario-dialog.tsx`) que, ao
confirmar, chama `adicionarComentario` (`lib/tickets/actions.ts:81`) e, se o campo
horas foi preenchido, também `registrarManual` (`lib/tickets/apontamentos.ts:138`) —
duas chamadas de server action, não uma nova action combinada, para não duplicar a
lógica de SLA/`primeira_resposta_em` que já vive em `adicionarComentario`. O composer
inline (`comentario-composer.tsx`) permanece como está, para resposta rápida sem abrir
modal.

## Risks / Trade-offs

- **Severidade percentual muda o que hoje é "crítico"** para chamados com prazos muito
  curtos ou muito longos → mitigar calibrando os limiares (75%/90%) contra os cinco
  perfis de `sla_policy` já semeados (15min a 2880min de solução) antes de fechar a
  Fase 3, e ajustar se algum perfil ficar sempre "crítico" ou nunca.
- **Migration de enum em transação separada** atrasa a Fase 5 em pelo menos duas
  aplicações sequenciais (migration 2 antes de qualquer código que grave os tipos
  novos) → sequenciar assim de propósito na Fase 5 do `tasks.md`.
- **Conciliação SHALL funcionar "em qualquer status"** pode conflitar com a guarda de
  `mudarStatus` que hoje exige técnico atribuído antes de sair de "A fazer" → a
  conciliação não passa pelo caminho de `mudarStatus`; finaliza o duplicado por uma
  action própria que ignora essa guarda, documentando por quê.
- **RLS das tabelas novas replicada por padrão** pode ficar frouxa para
  `ticket_visualizacao`/`ticket_contato` se um solicitante conseguir ver quem mais
  visualizou o próprio chamado → confirmar na implementação se o solicitante deve
  enxergar a lista de visualizadores staff (provavelmente não) e restringir o `select`
  dessas tabelas a `is_staff()`, sem o `or empresa_id = ...` do padrão genérico.

## Migration Plan

Cada migration da Fase 5 é aplicada isoladamente, na ordem 1→7, verificando entre
cada uma com `list_tables`/`get_advisors` (MCP Supabase) antes de seguir para a
próxima, seguindo a regra do repo de commitar o arquivo no mesmo momento da aplicação.
Sem rollback automatizado — reversão é uma migration nova que desfaz a anterior,
igual ao padrão já em uso no diretório.
