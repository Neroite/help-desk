## 1. Banco de dados

- [x] 1.1 Aplicar migration `helpdesk_ultima_interacao` via MCP Supabase: colunas `ticket.ultima_interacao_em`/`ultima_interacao_papel`, backfill a partir do último comentário público de cada ticket, índice `ticket_ultima_interacao_idx`.
- [x] 1.2 Aplicar migration `helpdesk_evento_corpo`: coluna `ticket_evento.corpo text`.
- [x] 1.3 Aplicar migration `helpdesk_evento_tipos_atendimento` (separada, fora da transação da 1.2): `evento_tipo` ganha `inicio`, `pausa`, `retomada`, `categoria`.
- [x] 1.4 Rodar `get_advisors` após cada migration e confirmar RLS ativa nas colunas novas.
- [x] 1.5 Conferir o backfill: contagem de tickets com `ultima_interacao_papel = 'solicitante'` bate com a leitura manual dos comentários existentes.
- [x] 1.6 Criar `supabase/migrations/` no repo com os 3 arquivos `.sql` aplicados e um `README.md` explicando que as migrations anteriores a esta change só existem no projeto remoto.

## 2. Kanban: técnico obrigatório

- [x] 2.1 `lib/kanban/colunas.ts`: mudar `dropPermitido` para devolver `"permitido" | "bloqueado" | "exige-tecnico"` (bloqueado = mesma coluna ou status fora das visíveis; exige-tecnico = destino ≠ `cancelado` e `analistaId === null`).
- [x] 2.2 Atualizar `lib/kanban/colunas.test.ts` com os casos novos de `dropPermitido` (com/sem analista, destino `cancelado`, destino inválido).
- [x] 2.3 `lib/tickets/actions.ts`: `mudarStatus` inclui `analista_id` no `select` existente e lança erro quando a regra é violada (destino ≠ `cancelado` e `analista_id` nulo).
- [x] 2.4 Nova ação `atribuirEMover(ticketNumero, analistaId, novoStatus)`: atribui o analista e muda o status numa chamada, registrando os dois eventos (`atribuicao` + `status`).
- [x] 2.5 Criar `components/chamado/atribuir-tecnico-dialog.tsx`: `Select` de analistas (via `useReferenceData`), checkbox "Assumir eu" pré-marcado quando o usuário atual é analista, botão "Atribuir e mover" chamando `atribuirEMover`.
- [x] 2.6 `components/chamado/kanban-board.tsx`: `handleDragEnd` chama `onExigeTecnico(numero, destino)` quando `dropPermitido` devolve `"exige-tecnico"`, em vez de `onStatusChange` (mesma trava aplicada no menu `⋮` do card).
- [x] 2.7 `app/(app)/chamados/chamados-client.tsx`: estado do diálogo de atribuição + handler ligando ao `KanbanBoard`.
- [x] 2.8 Trava real no Kanban (drag e menu `⋮`, via `dropPermitido`/`onExigeTecnico`). Escopo ajustado: `TicketQuickEdit` e `handleBulkStatus` **não** ganharam o diálogo — continuam chamando `mudarStatus` direto, que agora rejeita no servidor (mensagem "Chamado sem técnico atribuído...") e cai no `.catch` de erro genérico já existente nesses dois pontos. Abrir um diálogo de atribuição dentro de um menu radio-group (quick edit) ou de uma ação em lote (bulk) exigiria bem mais estrutura nova pra um caminho secundário — a spec só descreve o cenário de arrastar no Kanban.

## 3. Coluna derivada "Última interação do cliente"

- [x] 3.1 `lib/types.ts`: `Ticket` ganha `ultimaInteracaoEm: string | null` e `ultimaInteracaoPapel: Papel | null`.
- [x] 3.2 `lib/tickets/queries.ts`: `mapTicket` mapeia as duas colunas novas.
- [x] 3.3 `lib/tickets/actions.ts`: `adicionarComentario` atualiza `ultima_interacao_em`/`ultima_interacao_papel` no mesmo `update` que já faz para `primeira_resposta_em`, usando o papel de quem comentou.
- [x] 3.4 `lib/kanban/colunas.ts`: novo helper `aguardandoAnalista(ticket)` (`ultimaInteracaoPapel === "solicitante" && !STATUS_FINAIS.includes(statusKey)`), com teste em `colunas.test.ts`.
- [x] 3.5 `colunasDoKanban`: remove a coluna `cancelado` das colunas retornadas e anexa uma coluna derivada `{ statusKey: null, tipo: "derivada", rotulo: "Última interação do cliente" }` ao fim; `ColunaKanban` ganha o campo `tipo`.
- [x] 3.6 `components/chamado/kanban-board.tsx`: `KanbanColumn` não chama `useDroppable` para coluna do tipo `"derivada"` e recebe borda tracejada; a coluna lista tickets via `aguardandoAnalista`, não por `statusKey`.
- [x] 3.7 `KanbanCardArrastavel` dentro da coluna derivada renderiza `TicketCard` com selo do status real (reusar `StatusBadge`).
- [x] 3.8 `lib/formato.ts` (novo): extrair `formatarRelativo` de `ticket-row.tsx` para reuso.
- [x] 3.9 `components/chamado/ticket-card.tsx`: chip "← {nome} · {tempo}" quando `aguardandoAnalista(ticket)`, na posição hoje ocupada pelo `SlaBadge` de estourado.
- [x] 3.10 `app/(app)/dashboard/dashboard-client.tsx`: tile novo "Aguardando resposta" no bloco SLA, contando `tickets.filter(aguardandoAnalista)`, linkando para `/chamados?view=kanban&aguardando=1`.
- [x] 3.11 `chamados-client.tsx`: suportar `?aguardando=1` como filtro client-side equivalente a `aguardandoAnalista`.

## 4. Iniciar, pausar, retomar

- [x] 4.1 `lib/tickets/actions.ts`: `iniciarAtendimento(ticketNumero, analistaId?)` — atribui analista se vazio, status → `em_andamento`, evento `inicio` com `corpo: "Atendimento iniciado"`.
- [x] 4.2 `pausarChamado(ticketNumero, motivo)` — valida `motivo` não vazio, status → `pausado` (aplicando `aplicarPausa` de `lib/sla/prazos.ts`), evento `pausa` com `corpo: motivo`.
- [x] 4.3 `retomarChamado(ticketNumero)` — status → `em_andamento` (aplicando `aplicarRetomada`), evento `retomada`.
- [x] 4.4 Criar `components/chamado/pausar-dialog.tsx`: textarea de motivo obrigatório, contador de caracteres, botão desabilitado enquanto vazio.
- [x] 4.5 `lib/types.ts`: `TicketEventoTipo` ganha `"inicio" | "pausa" | "retomada" | "categoria"`; `descreverEvento`/`iconeEvento`/`corEvento` cobrem os quatro (implementado em `components/chamado/ticket-timeline.tsx`, não em `lib/types.ts` — o levantamento inicial errou o arquivo).
- [x] 4.6 Autor "Sistema" no lugar do literal `"Alguém"` quando `autorId` não resolve (`ticket-timeline.tsx#descreverEvento`).
- [x] 4.7 `components/chamado/ticket-timeline.tsx`: eventos com `corpo` não vazio renderizam como card de mensagem (mesma caixa dos comentários, borda esquerda de 4px na cor do tipo, ícone circular no canto); eventos sem `corpo` mantêm a pílula atual.
- [x] 4.8 `chamado-detalhe-client.tsx`: botão `Play` do toolbar (hoje mock) vira "Iniciar atendimento" real; botão de pausa novo ao lado; ambos condicionados ao `statusKey` atual.
- [x] 4.9 `chamado-detalhe-client.tsx`: `handleStatusChange` roteia `em_andamento` → `iniciarAtendimento` (ou `retomarChamado` quando vem de `pausado`), `pausado` → abre `pausar-dialog`, demais → `mudarStatus` como hoje.

## 5. Layout do detalhe (proporção Milvus)

- [x] 5.1 `chamado-detalhe-client.tsx`: layout desktop trocado por `lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,32%)]`, removendo o `Separator` vertical (virou borda no `aside`). Ajustado durante a verificação visual: a primeira versão usava px fixo (380/440px), que em 1920px encolhia pra ~24% da largura — trocado por percentual com piso, mantém ~32% em qualquer largura ≥ 1024px.
- [x] 5.2 Ajustar o `aside`: largura extra absorvida pelo grid; seções já usavam `flex justify-between` para rótulo/valor.
- [x] 5.3 Conferido visualmente via agent-browser em 1280px e 1920px, logado como admin@helpdesk.dev — painel em ~32% da largura nas duas, timeline com cards de mensagem coloridos estilo Milvus.

## 6. Categorias em árvore

- [x] 6.1 Confirmar se `components/ui/collapsible.tsx` existe; se não, adicionar via skill `shadcn`.
- [x] 6.2 `app/(app)/configuracoes/categorias/categorias-client.tsx`: cada categoria raiz vira um `Collapsible` com chevron, `aria-expanded` e contador de filhos; filhos só montam quando expandido. Estado em `useState<Set<string>>`.
- [x] 6.3 `lib/config/categorias.ts`: `excluirCategoriaProblema(id)` e `excluirCategoriaAtendimento(id)` — bloqueiam quando há chamados vinculados ou (para problema) subcategorias, com mensagem distinguindo os dois motivos.
- [x] 6.4 `categorias-client.tsx`: botão de excluir por linha, com confirmação e tratamento do erro de bloqueio.
- [x] 6.5 `components/chamado/categoria-problema-select.tsx`: trocar o `Select` plano com prefixo `— ` por `SelectGroup`/`SelectLabel` agrupado por categoria pai.

## 7. Categoria editável no chamado

- [x] 7.1 `lib/tickets/actions.ts`: `definirCategorias(ticketNumero, catAtendimentoId, catProblemaId)` — atualiza as duas colunas, registra evento `categoria` descrevendo a troca.
- [x] 7.2 Criar `components/chamado/categoria-atendimento-select.tsx` (lista plana, mesmo formato de `categoria-problema-select.tsx`).
- [x] 7.3 `chamado-detalhe-client.tsx`: `categoriasSection` deixa de ser `<dl>` read-only; passa a ter os dois selects, salvando via `definirCategorias` com o padrão optimistic+rollback de `lib/hooks/use-estado-sincronizado.ts`.

## 8. Busca unificada

- [x] 8.1 `app/(app)/app-shell.tsx`: `handleBuscaSubmit` sempre navega para `/chamados?view=kanban&busca=<termo>` (mantendo a remoção do `#` inicial).
- [x] 8.2 `app/(app)/chamados/chamados-client.tsx`: `ticketPassaFiltros` ganha o filtro `busca` — igualdade de `numero` quando o termo é numérico, substring case-insensitive em `titulo` caso contrário (mesma semântica de `queries.ts:91-98`).
- [x] 8.3 `components/chamado/filtro-bar.tsx` (`FiltroChips`): chip da busca ativa com botão de limpar.
- [x] 8.4 Estado vazio dedicado em `chamados-client.tsx`: "Nenhum chamado para «termo»" com ação de limpar a busca.
- [x] 8.5 Portal não tem Kanban (spec: "cards, sem kanban") — `app/(portal)/portal-shell.tsx` navega para `/portal?busca=<termo>`; `app/(portal)/portal/page.tsx` vira client-filtrado por número/título, reaproveitando `TicketCard`, com estado vazio dedicado.

## 9. Camada de card na fila

- [x] 9.1 `app/(app)/chamados/chamados-client.tsx`: envolver filtros + tabela/Kanban + paginação num contêiner `rounded-xl border border-border bg-surface p-(--space-4) shadow-sm`, mantendo título e botão "Novo chamado" fora do contêiner.
- [x] 9.2 Conferir que o mesmo tratamento vale igualmente para a visão de lista e a visão Kanban.

## 10. Verificação final

- [x] 10.1 `npm test` — 41/41 testes passam (6 arquivos), incluindo os casos novos de `dropPermitido`/`aguardandoAnalista`.
- [x] 10.2 `npm run lint` — sem apontamentos. `npx tsc --noEmit` também limpo.
- [ ] 10.3 Percorrer manualmente com `npm run dev`: arrastar sem técnico, coluna derivada, iniciar/pausar com motivo, categoria editável, exclusão de categoria bloqueada e permitida, busca numérica e textual, proporção do detalhe em duas larguras.
