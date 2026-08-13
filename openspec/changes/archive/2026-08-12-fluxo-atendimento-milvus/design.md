## Context

Ver `proposal.md` para a motivação. Pontos de partida técnicos relevantes, levantados por exploração do código atual:

- `dropPermitido(ticket, destino, colunas)` (`lib/kanban/colunas.ts:28`) hoje devolve `boolean` e é o único guarda de movimentação, chamado só do lado do cliente em `kanban-board.tsx`.
- `mudarStatus` (`lib/tickets/actions.ts:279`) é a única ação de status hoje; já lê as colunas de SLA e aplica `aplicarPausa`/`aplicarRetomada` de `lib/sla/prazos.ts` conforme a pertinência a `STATUS_PAUSA_SLA`.
- `ticket_evento` tem `tipo: "criado"|"status"|"atribuicao"|"prioridade"`, sem campo de texto livre. `descreverEvento`/`iconeEvento`/`corEvento` (`lib/types.ts`) geram a renderização a partir só de `tipo`/`de`/`para`.
- Não existe conceito de "última interação" no banco; é preciso derivá-lo ou materializá-lo.
- O schema `helpdesk` não está versionado no repo (nenhum `.sql` local); as sete migrations existentes só existem no projeto Supabase remoto.
- `categoria_problema.pai_id` já suporta hierarquia; a única lacuna é de UI e de exclusão.

## Goals / Non-Goals

**Goals:**
- Tornar a movimentação do Kanban consistente com quem está de fato atendendo o chamado.
- Dar à pausa e ao início um registro estruturado e legível, sem misturar com comentários.
- Versionar as migrations desta change (e abrir o precedente para as futuras).

**Non-Goals:**
- Não implementar apontamento de horas real (fica listado no backlog do proposal, item separado).
- Não mudar RLS ou papéis de usuário.
- Não introduzir uma segunda fonte de verdade para "última interação" além do que já é gravado em `comentario`/`ticket`.

## Decisions

**"Última interação do cliente" como coluna materializada, não calculada em runtime.**
Alternativa considerada: calcular no cliente, no momento da renderização, varrendo `comentarios` de cada ticket. Rejeitada porque a lista de tickets já é toda enviada ao cliente sem seus comentários (só o dashboard/lista carregam `Ticket[]`, não a timeline inteira) — calcular exigiria buscar comentários de todos os tickets visíveis a cada render. Em vez disso, `ticket.ultima_interacao_em`/`ultima_interacao_papel` são atualizados no mesmo `update` que `adicionarComentario` já faz para `primeira_resposta_em`, sem round-trip adicional, e ficam disponíveis no `select *` que `listarChamados` já executa.

**`dropPermitido` muda de `boolean` para um union de três estados.**
Alternativa: manter `boolean` e adicionar uma função separada `precisaTecnico`. Rejeitada por criar duas fontes de decisão que podem divergir. Um único `"permitido" | "bloqueado" | "exige-tecnico"` mantém uma function pura e testável, e o chamador (`kanban-board.tsx`) decide a UI a partir de um switch exaustivo.

**Eventos de atendimento reaproveitam `ticket_evento` com uma coluna `corpo` nova, em vez de uma tabela separada.**
Alternativa: tabela `atendimento_evento` dedicada. Rejeitada — a timeline já faz merge de `comentario` + `ticket_evento` por data; introduzir uma terceira fonte duplicaria essa lógica de merge sem necessidade. `corpo text null` é compatível com os eventos existentes (que continuam sem corpo e renderizam como pílula compacta); eventos novos com corpo renderizam como card de mensagem.

**Enum `evento_tipo` ganha 4 valores novos em vez de generalizar para `tipo: string`.**
Alternativa: soltar o enum e validar em aplicação. Rejeitada — o enum documenta no próprio banco quais eventos existem, e `ALTER TYPE ... ADD VALUE` é uma operação simples (só exige rodar fora da transação que a usa).

**Validação de técnico obrigatório entra no servidor, não só no cliente.**
A UI barra o drag-and-drop, mas `mudarStatus` é chamada também pelo menu `⋮`, pelo `TicketQuickEdit` e pelo `handleBulkStatus` — replicar a checagem em cada chamador do cliente é frágil. A regra definitiva mora em `mudarStatus`, que já lê `analista_id` implicitamente ao buscar a linha do ticket (basta incluir a coluna no `select`).

**Coluna "Cancelado" sai do Kanban mas o status `cancelado` continua existindo.**
Alternativa (rejeitada explicitamente com o usuário): substituir `cancelado` por um status novo `aguardando_cliente` no enum. Isso removeria a capacidade de cancelar chamado e exigiria migrar linhas existentes — desproporcional ao pedido, que era só sobre visibilidade no quadro. A capacidade de cancelar continua pelo menu do card e pelo `Select` de status no detalhe.

## Risks / Trade-offs

- **[Risco] Materializar `ultima_interacao_*` cria uma segunda fonte de verdade além de `comentario.criado_em`, que pode divergir se algum caminho de escrita de comentário for adicionado no futuro sem passar por `adicionarComentario`.** → Mitigação: é a única função de escrita de comentários hoje; documentar o invariante com um comentário no código, não com uma trigger (mantém o padrão do repo de não usar triggers de banco).
- **[Risco] `ALTER TYPE ... ADD VALUE` não pode rodar na mesma transação em que o valor é usado.** → Mitigação: migration 3 separada da 2, como já mapeado no proposal.
- **[Risco] Duplicar o card na coluna derivada e na coluna de status pode confundir contagem de "quantos chamados têm eu" se o analista não perceber a duplicação.** → Mitigação: selo explícito do status real no card duplicado, mesma decisão validada com o usuário via preview.
- **[Trade-off] Backfill de `ultima_interacao_*` roda uma vez, no momento da migration; chamados sem nenhum comentário público ficam com o campo nulo** (tratado como "não aguardando cliente" pela regra `aguardandoAnalista`). Aceitável — sem comentário público não há de quem ser a última interação.

## Migration Plan

1. Aplicar as 3 migrations via MCP Supabase (`apply_migration`), na ordem do proposal; rodar `get_advisors` depois de cada uma.
2. Copiar os corpos aplicados para `supabase/migrations/` no repo (novo diretório), com um `README.md` explicando que as migrations anteriores a esta change existem só no projeto remoto.
3. Implementar as ações de servidor e só depois a UI que as consome — cada tela nova assume que a coluna/enum já existe.
4. Sem rollback automatizado: as colunas novas são aditivas (nenhuma coluna existente muda de tipo ou perde dado); reverter é uma migration adicional de `DROP COLUMN`/enum não decrescente (Postgres não remove valor de enum) se necessário.
