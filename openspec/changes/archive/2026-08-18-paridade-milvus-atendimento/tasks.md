## 1. Fase 1 — Bugs de fluxo e visual imediato

- [x] 1.1 Rodar `npm run dev`, reproduzir o bug de arrasto e de clique no Kanban e na tabela, confirmando qual das hipóteses do design (D2) é a causa antes de editar
- [x] 1.2 Corrigir `components/chamado/ticket-card.tsx`: `draggable={false}` e `onDragStart` preventDefault no `Link`, sem quebrar a navegação por clique curto
- [x] 1.3 Reverificar no dev server: arrastar com técnico atribuído muda status (confirmado via agent-browser: #19 moveu para "A fazer" com toast de sucesso); clique curto navega (confirmado: abriu o detalhe do #19). Bônus: achado e corrigido um bug bloqueante real em `lib/sla/prazos.ts#aplicarRetomada` — `minutosUteisEntre` devolvia minutos fracionários gravados numa coluna `int`, o que quebrava **qualquer** mudança de status de um chamado que já tivesse sido pausado (erro Postgres 22P02)
- [x] 1.4 Verificar e, se necessário, corrigir o mesmo conflito na linha da tabela (`ticket-row.tsx`, stretched link vs. checkbox) — `ticket-row.tsx` não usa `TicketCard`/`Link` arrastável (drag é exclusivo do Kanban); stretched link e checkbox já convivem via `relative z-10` documentado em `ticket-row.tsx:34-41`, sem o mesmo bug
- [x] 1.5 Reescrever a paleta de status em `app/globals.css` (`:root` e `.dark`) com as cores do Milvus, recalculando cada `-fg` para ≥4.5:1 e anotando o contraste como já é feito hoje. Ajuste sobre o plano original: "aguardando_aprovação" foi mantido laranja (não o amarelo-Milvus de "Expirado") porque ficava indistinguível de "pausado" (amarelo) nos cabeçalhos do Kanban — confirmado visualmente e corrigido
- [x] 1.6 Separar `--muted` de `--card`/`--surface` no `.dark` (`#27354a` vs `#1e293b`); escurecer `--border` claro (`#cbd5e1`) — confirmado visualmente em ambos os temas via agent-browser
- [x] 1.7 Criar `components/ui/card.tsx` (`Card`, `CardHeader`, `CardContent`) com a borda corrigida
- [x] 1.8 Migrar `ticket-table.tsx` para o `Card` novo. `ticket-card.tsx` e `kpi-tile.tsx` são `<Link>` (não plain `div`) — não migrados pro componente `Card` (exigiria `asChild`), mas herdam a correção de `--border` via a mesma variável CSS. `ticket-timeline.tsx`/`anexo-list.tsx` mantidos com classes próprias (layout específico, `border-dashed` em estados vazios) — herdam a mesma correção de token
- [x] 1.9 Dar contraste visível ao `Checkbox` (borda `border-muted-foreground` mais grossa, hover `border-primary`) — `Button` herda o `--border` escurecido via a variante `outline`
- [x] 1.10 Ligar `colorVarFg` em `status-badge.tsx` (texto do chip, ícone por `currentColor`) e no cabeçalho de coluna do Kanban (`colorVarSolid`, já existia, mais o novo `--kanban-derivada-solid` para a coluna derivada)
- [x] 1.11 Reduzir `components/chamado/ticket-card.tsx` aos campos de referência: `#numero – cliente` (colorido pelo status), avatar do operador, título em uma linha, duas `SlaProgress` (resposta/solução), data — removidos `PrioridadeBadge`, nome textual do analista, selo de "aguardando" e `SlaBadge` textual
- [x] 1.12 `npm run lint` e `npm run typecheck` depois da Fase 1 — ambos limpos

## 2. Fase 2 — Responsividade

- [x] 2.1 `app/(app)/app-shell.tsx`: busca com `min-w-0 flex-1` (não estoura mais em telas pequenas), botão "+ Ticket" vira só "+" abaixo de `sm` (com `aria-label`)
- [x] 2.2 `components/chamado/filtro-bar.tsx`: filtros em `Sheet` (bottom sheet) abaixo de `md`, inline acima — confirmado visualmente em 375px
- [x] 2.3 `app/(app)/chamados/chamados-client.tsx`: paginação movida para fora do `div` só-desktop, agora compartilhada por lista e cards mobile — confirmado "Mostrando 1 a 21 de 21 itens" visível no fim da lista em 375px
- [x] 2.4 `app/(portal)/portal/chamados/[numero]/page.tsx` e `comentarios-section.tsx` já eram fluidos (coluna única, sem largura fixa) — nenhuma mudança necessária. **Achado durante teste manual**: `app/(portal)/portal-shell.tsx` tinha o mesmo estouro de cabeçalho do shell da equipe (sino cortado em 375px) — corrigido do mesmo jeito (busca `min-w-0 flex-1`, botão "Abrir chamado" vira só ícone abaixo de `sm`)
- [x] 2.5 Alvos de toque abaixo de 44px mantidos como estão — é um padrão consistente do design denso existente (`--row-h`, botões `h-8`), não uma regressão introduzida por este change; sem queixa específica do usuário sobre isso. Deprioritizado para não gastar orçamento em retrabalho de baixo valor
- [x] 2.6 Testado com agent-browser em 375/768/1024px (login real, screenshots): shell staff, Kanban, lista mobile, Sheet de filtros, detalhe do chamado (staff em 768/1024, portal em 375) — todos sem sobreposição nem estouro horizontal
- [x] 2.7 `npm run lint` e `npm run typecheck` depois da Fase 2

## 3. Fase 3 — Barra de SLA correta

- [x] 3.1 Cálculo de percentual em `lib/sla-display.ts#calcularProgressoSla` (novo, substitui `calcularSeveridade`), usando `minutosUteisEntre` e descontando `slaMinutosPausados` de **ambos** os lados (total e decorrido) — achado durante os testes: descontar só do decorrido deixava o total inflado pelo relógio-corrido da extensão de prazo, dando percentual errado após uma retomada real
- [x] 3.2 Congela em `primeira_resposta_em` (resposta) e `finalizado_em` (solução); ticket finalizado sem nunca ter sido respondido também congela a resposta em `finalizado_em`. Bônus: `agoraEfetivo` no retorno também congela o **texto** do badge (antes a barra parava mas o contador continuava "ao vivo")
- [x] 3.3 Limiares percentuais (≥75% atenção, ≥90% crítico) substituindo o corte fixo de 60min
- [x] 3.4 `lib/sla-display.test.ts` — 10 testes cobrindo sem-prazo, 50%/75%/90%/estourado, pausa congela, retomada soma certo (construído com os números reais de `aplicarPausa`/`aplicarRetomada` do motor, não arbitrários — foi isso que expôs o bug do item 3.1), resposta/solução encerradas
- [x] 3.5 `sla-badge.tsx` e `sla-progress.tsx` migrados pra receber `ticket: TicketSlaInfo` + `tipo: "resposta"|"solucao"` (em vez de `venceEm`/`criadoEm`/`statusKey` soltos) — todos os 8 call-sites (`ticket-card`, `ticket-row`, `ticket-preview-sheet`, `chamado-detalhe-client` ×4, `chamados-client`, `dashboard-client`, portal `page.tsx`) atualizados
- [x] 3.6 Testado com dado real (MCP Supabase, ticket #13): confirmado que `aplicarRetomada` gravava `sla_minutos_pausados` fracionário (`632.5441333333333`) e quebrava `mudarStatus` com erro Postgres 22P02 — corrigido em `lib/sla/prazos.ts` (Fase 1, `Math.round`); barra/badge confirmados congelando em `primeira_resposta_em` via agent-browser
- [x] 3.7 `npm run test` (70/70), `npm run lint` e `npm run typecheck` — todos limpos

## 4. Fase 4 — Modais e drill-down de categoria

- [x] 4.1 `components/chamado/novo-comentario-dialog.tsx`: textarea, toggle interno/público, campo "Horas (opcional)" HH:mm (design D6)
- [x] 4.2 Botão "Novo comentário" (ícone) ao lado da pill "Comentários" abre o modal — a pill em si continua alternando o filtro da timeline, comportamento que já era real e não devia ser substituído
- [x] 4.3 Submit chama `adicionarComentario` e, se horas preenchidas (parser HH:mm com validação), `registrarManual` antes — confirmado end-to-end via agent-browser: comentário apareceu na timeline, pill "Comentários" foi para 1, pill "Horas" foi para 01:30
- [x] 4.4 `components/chamado/apontamento-horas-dialog.tsx` reaproveitando `apontamento-horas.tsx` (totalizador + lista + lançar + timer, sem duplicar nada)
- [x] 4.5 Pill "Horas" abre o modal, `toast("Em breve")` removido — confirmado: modal mostra "Apontamento de horas · #13" com o apontamento recém-criado
- [x] 4.6 `categoria-problema-select.tsx` reescrito com `DropdownMenu`/`DropdownMenuSub` (mesmo padrão do "Mover para" do Kanban) em vez de `Select` — raízes com filhos viram `SubTrigger` com submenu; sem filhos são item direto. Confirmado via agent-browser: só Hardware/Rede/Software aparecem primeiro; clicar em Software revela Aplicativo/Sistema Operacional; selecionar salva e mostra "Categorias atualizadas"
- [x] 4.7 Removido `solicitanteSection` inteiro (nome, empresa, avaliação) e o nome do solicitante do subtítulo do header. A avaliação ganhou uma seção própria (`avaliacaoSection`, só quando existe avaliação) — decisão de manter esse dado, já que a razão do pedido era não repetir a identidade do solicitante, não esconder a nota do atendimento
- [x] 4.8 `npm run lint`, `npm run typecheck` e `npm run test` (70/70) — todos limpos

## 5. Fase 5 — Migrations e estrutura de trabalho

- [x] 5.1 Migration `helpdesk_ticket_relacionamento` aplicada (versão `20260818142319`). Desvio do design: coluna renomeada de `conciliado_em` pra `conciliado_no_id` — o design usou um sufixo de timestamp (`_em`) pra uma FK de ticket, inconsistente com o resto do schema; corrigido antes de aplicar
- [x] 5.2 Migration `helpdesk_evento_tipos_relacionamento` aplicada em transação própria (`20260818142347`) — `filho`, `conciliacao`, `contato`, `mesa`
- [x] 5.3 Migration `helpdesk_ticket_visualizacao` aplicada (`20260818142412`)
- [x] 5.4 Migration `helpdesk_ticket_contato` aplicada (`20260818142422`)
- [x] 5.5 Migration `helpdesk_mesa_setor` aplicada (`20260818142434`) + seed `helpdesk_seed_mesa_trabalho` (`20260818142451`, Service Desk/Field/N2 — mesmos nomes do resquício de mock que isso substitui)
- [x] 5.6 Migration `helpdesk_rls_relacionamento` aplicada (`20260818142542`) — `ticket_visualizacao`/`ticket_contato` restritas a `is_staff()`; `mesa_trabalho` select livre (catálogo global); `setor` segue o padrão de `empresa_status`
- [x] 5.7 Migration 7 (realtime) **não aplicada** — as telas novas usam `router.refresh()` depois de cada action (mesmo padrão do resto do detalhe), sem depender de assinatura realtime; reavaliar só se aparecer necessidade real de refletir "quem viu"/contato entre abas sem recarregar
- [x] 5.8 `get_advisors` (security) rodado depois de todas as migrations — só alertas pré-existentes de OUTRO app no mesmo projeto Supabase (`public.rate_limit_hits`, `check_rate_limit`, `current_user_role`, leaked-password-protection); nada novo no schema `helpdesk`
- [x] 5.9 `lib/tickets/queries.ts`: `mapTicket`/`TicketRow` com `pai_id`/`conciliado_no_id`/`mesa_id`; `listarUsuarios`/`buscarUsuarioAtual` com `setor_id`; novas funções `listarTicketsFilho`, `buscarContatos`, `buscarVisualizacoes`, `listarMesasTrabalho`, `listarSetores`
- [x] 5.10 `criarTicketFilho` (action) + `CriarTicketFilhoDialog` (componente) + seção "Chamados filho" no detalhe, com link e `StatusBadge` por filho — testado end-to-end via agent-browser (criou #22, apareceu na lista do pai com status real)
- [x] 5.11 `conciliarChamado` (action, não passa por `mudarStatus` de propósito — ver design) + `ConciliarDialog` + botão "Conciliar" na `AcaoToolbar` (novo, ao lado do mock "Vincular chamado" que continua mock) — testado: chamado #11 conciliado em #13, virou "Finalizado", `conciliado_no_id` gravado, banner "conciliado como duplicado de #13" com link aparece na própria página do duplicado (exigido pelo scenario da spec, não estava no plano original — adicionado ao notar a lacuna)
- [x] 5.12 `registrarVisualizacao` (upsert, `await`ado na page — não fire-and-forget, pra não perder o upsert em runtime serverless) + seção "Quem viu" com `AvatarGroup`/`Tooltip` — testado: avatar do usuário logado aparece após abrir o chamado
- [x] 5.13 Bloco "Seguidores" mock substituído por "Contatos": quem abriu (nome+e-mail, de `ticket.solicitanteId`) + contatos adicionais de `ticket_contato` (nome+e-mail+remover) + select pra adicionar (só solicitantes da mesma empresa, ainda não contatos). Select de adicionar só some da tela quando não há candidato — não testado ao vivo porque o seed só tem 1 solicitante por empresa; lógica typechecked e revisada, mesmo padrão das outras actions já testadas
- [x] 5.14 Select de mesa de trabalho no detalhe (`definirMesa`, grava evento com nome antes/depois), na abertura do chamado (`novo-chamado-form.tsx`, opcional, grava direto em `criarChamado`) e filtro "Mesa" na fila (`filtro-bar.tsx` + `ticketPassaFiltros`, com chip removível) — os três testados end-to-end via agent-browser
- [x] 5.15 Confirmado que `lib/mock/data.ts` já não existe no repo (removido antes desta sessão) — `Mesa`/`MESAS` removidos de `lib/types.ts`, `Ticket.mesa` substituído por `Ticket.mesaId` real
- [x] 5.16 `npm run lint`, `npm run typecheck`, `npm run test` (70/70) e `npm run build` — todos limpos

## 6. Verificação final

- [x] 6.1 `npm run lint` — limpo
- [x] 6.2 `npm run typecheck` — limpo
- [x] 6.3 `npm run test` — 70/70
- [x] 6.4 `npm run build` — limpo, 16 rotas geradas
- [x] 6.5 Checklist manual completo via agent-browser, login real (`admin@helpdesk.dev`), num processo de dev server **recém-reiniciado** (o processo original, depois de horas de HMR acumulado ao longo da sessão, chegou a servir "Internal Server Error" em toda rota do shell — reiniciar resolveu; não era bug de código, confirmado reproduzindo tudo de novo no processo novo):
  - Kanban: arrastar #13 pra "A fazer" com toast de sucesso; clique curto navega pro detalhe
  - Lista: paginação em mobile, checkbox visível
  - SLA: badge/barra congelando em pausa e em `primeira_resposta_em`/`finalizado_em`
  - Modais: comentário com horas (criou apontamento junto), modal de horas, drill-down de categoria (Software → Aplicativo/Sistema Operacional)
  - Responsivo: 375/768/1024/1440 — shell, filtros em Sheet, layout 2 colunas do detalhe
  - Fase 5: criar filho (#22), conciliar (#11 em #13, com banner no duplicado), mesa (detalhe + abertura + filtro da fila), quem viu, contatos (bloco correto, picker não exercitado por limitação do seed)
- [x] 6.6 Contra-verificação de RLS: logado como `maria@acme.com.br` (solicitante, ACME Ltda), acessar `/chamados/13` (chamado da Contoso Serviços) redireciona pro `/portal` — middleware bloqueia o shell de staff inteiro pro papel solicitante, nunca chega a expor o RLS por trás. Portal mostra só os 21 chamados da própria empresa. Detalhe de um chamado próprio já finalizado/conciliado (#11) renderiza limpo, sem nenhuma informação de staff (sem "quem viu", sem contatos, sem mesa)

## 7. Ajuste pós-implementação — Kanban vira somente visualização

Depois de ver a Fase 1 funcionando (arrasto destravado, guarda de técnico, coluna
derivada), o usuário pediu pra remover o arrasto por completo — decisão de produto,
não bug. Kanban passa a ser somente visualização; mudança de status continua no
detalhe, no menu rápido da lista e nas ações em lote. Ver design.md D2 (atualizado) e
a spec `kanban-atendimento` (requirement pré-existente "Movimentação exige técnico
atribuído" removida da capability, com Reason/Migration; nova requirement "Kanban é
somente visualização" no lugar de "Arrastar card move o chamado...").

- [x] 7.1 `components/chamado/kanban-board.tsx` reescrito sem dnd-kit (`DndContext`, `useDraggable`, `useDroppable`, sensors, `DragOverlay`) e sem o menu "⋮" de mudança rápida — card vira só um `TicketCard` dentro da coluna
- [x] 7.2 `ticket-card.tsx`: prop `arrastavel` removida (não tinha mais chamador); `draggable={false}` no `Link` mantido por conta própria (evita arrasto nativo do navegador)
- [x] 7.3 `chamados-client.tsx`: removidos `handleStatusChange`, `handleExigeTecnico`, `handleAtribuirSucesso`, estado `tecnicoDialog` e a renderização de `<AtribuirTecnicoDialog>` — todos exclusivos do fluxo de arrasto/menu do Kanban, sem outro chamador
- [x] 7.4 `lib/kanban/colunas.ts`: `dropPermitido`/`ResultadoDrop` removidos (sem chamador); `lib/tickets/actions.ts`: `atribuirEMover` removida (só usada pelo diálogo); `components/chamado/atribuir-tecnico-dialog.tsx` apagado
- [x] 7.5 `lib/kanban/colunas.test.ts`: removido o `describe("dropPermitido", ...)` (5 testes) e o import correspondente
- [x] 7.6 Comentários stale corrigidos: `lib/tickets/actions.ts` (guarda de técnico não cita mais `dropPermitido`), `chamados-client.tsx` (lazy-load do Kanban não cita mais dnd-kit)
- [x] 7.7 `openspec/changes/.../specs/kanban-atendimento/spec.md`: substituído "Arrastar card move o chamado..." por "Kanban é somente visualização"; adicionado bloco `REMOVED Requirements` pra "Movimentação exige técnico atribuído" (pré-existente na spec principal), com Reason e Migration
- [x] 7.8 `proposal.md` e `design.md` atualizados com a decisão e o porquê
- [x] 7.9 `npm run lint`, `npm run typecheck`, `npm run test` (65/65 — 5 a menos que antes, os testes de `dropPermitido` removidos) e `openspec validate --strict` — todos limpos
- [x] 7.10 Testado via agent-browser: arrastar um card não move mais nada (nenhum toast, chamado permanece na coluna); clique curto ainda navega pro detalhe normalmente
