## Why

O Kanban trata mudança de status como um `Select` solto: qualquer chamado pode ir para qualquer coluna sem técnico atribuído, sem motivo, e sem deixar rastro legível na conversa (`dropPermitido` em `lib/kanban/colunas.ts` só rejeita mesma coluna e status invisível). O quadro reserva uma coluna inteira para "Cancelado", que quase não se usa, enquanto esconde o sinal que o analista mais precisa: quais chamados estão esperando resposta dele. O detalhe do chamado reserva só 320px fixos para SLA/categorias — pouco frente à referência validada com o usuário (Milvus, ~1/3 da tela) — e trata categoria como texto read-only, apesar de o banco já ter hierarquia (`categoria_problema.pai_id`) e a coluna `cat_atendimento_id` nunca ser escrita por nenhuma tela. A busca do topo só aceita número.

## What Changes

- Mover um chamado no Kanban para fora de "A fazer" exige técnico atribuído; sem técnico, abre diálogo de atribuição em vez de mover direto.
- Coluna "Cancelado" sai do quadro. Entra coluna derivada "Última interação do cliente" (somente leitura, não aceita drop) listando chamados abertos cuja última interação pública foi do solicitante; o chamado continua aparecendo também na coluna do seu status real.
- Dashboard ganha tile "Aguardando resposta" ao lado do tile "Estourados" existente.
- Novas ações de atendimento `iniciarAtendimento`, `pausarChamado` (motivo obrigatório) e `retomarChamado`, cada uma registrando um evento com texto livre na timeline, renderizado como card de mensagem (estilo Milvus) — sem contar como comentário.
- Painel de detalhe do chamado passa de coluna fixa de 320px para proporção ~1/3 da largura (grid responsivo `380px`/`440px`).
- Categorias de problema ganham UI em árvore (expandir/recolher) e exclusão (hoje só existe criar/editar); chamado passa a permitir trocar categoria de atendimento e de problema depois de criado.
- Lista e Kanban de chamados ganham um wrapper de card visível envolvendo filtros + conteúdo + paginação.
- Busca do topo (analista e portal) passa a levar qualquer termo — número ou texto — para `/chamados?view=kanban&busca=<termo>`, reaproveitando a busca por título que já existe em `listarChamados` mas nunca é usada pela UI.

## Capabilities

### New Capabilities
- `kanban-atendimento`: regras de movimentação do Kanban (exigência de técnico, diálogo de atribuição) e a coluna derivada "última interação do cliente" (composição, duplicação, ausência de drop) e seu reflexo no dashboard.
- `atendimento-registro`: ações de iniciar/pausar/retomar atendimento e sua materialização como eventos de conversa com texto livre, distintos de comentários.
- `chamado-categorizacao`: hierarquia de categorias de problema (árvore, exclusão) e a capacidade de definir/alterar categorias (atendimento e problema) em um chamado existente.
- `busca-chamados`: comportamento da busca global (topbar analista e portal) — todo termo cai na visão Kanban filtrada.
- `layout-atendimento`: proporção do painel de detalhe do chamado (~1/3 da largura) e o wrapper de card da lista/Kanban de chamados.

### Modified Capabilities
- Nenhuma. Não existem specs prévias em `openspec/specs/` — a change anterior (`frontend-visual-polish`) nunca chegou a gerar specs.

## Impact

- **Banco** (schema `helpdesk`, projeto `dyutvxtrcchkqvykjmyy`): `ticket.ultima_interacao_em`/`ultima_interacao_papel` (novas colunas + índice), `ticket_evento.corpo` (nova coluna), enum `evento_tipo` ganha `inicio`/`pausa`/`retomada`/`categoria`. Migrations aplicadas via MCP e gravadas em `supabase/migrations/` (schema hoje não está versionado no repo).
- **Server actions** (`lib/tickets/actions.ts`): `mudarStatus` ganha checagem de técnico; novas `iniciarAtendimento`, `pausarChamado`, `retomarChamado`, `atribuirEMover`, `definirCategorias`; `adicionarComentario` passa a também atualizar `ultima_interacao_*`.
- **Kanban** (`lib/kanban/colunas.ts`, `components/chamado/kanban-board.tsx`, `ticket-card.tsx`): terceiro estado de `dropPermitido`, coluna derivada, diálogo novo `atribuir-tecnico-dialog.tsx`.
- **Detalhe** (`app/(app)/chamados/[numero]/chamado-detalhe-client.tsx`): grid do layout, seção de categorias editável, botões iniciar/pausar reais, diálogo novo `pausar-dialog.tsx`.
- **Timeline** (`components/chamado/ticket-timeline.tsx`, `lib/types.ts`): novos tipos de evento e renderização de eventos com corpo como card de mensagem.
- **Categorias** (`app/(app)/configuracoes/categorias/categorias-client.tsx`, `lib/config/categorias.ts`): árvore com expand/collapse, ações de exclusão novas.
- **Busca** (`app/(app)/app-shell.tsx`, `app/(portal)/portal-shell.tsx`, `chamados-client.tsx`): redirecionamento unificado + filtro de busca client-side.
- **Dashboard** (`app/(app)/dashboard/dashboard-client.tsx`): tile novo.
- Sem mudança de contrato para o portal do solicitante além da busca; papéis e RLS não mudam.
