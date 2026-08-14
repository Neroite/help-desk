## Why

O protótipo visual do help desk (fila, kanban, detalhe, dashboard) está funcional mas com problemas de usabilidade percebidos em revisão: os cards de chamado são visualmente neutros demais (cor só aparece em dois badges pequenos), o corpo de texto está pequeno mesmo após um ajuste anterior, botões não sinalizam claramente que são clicáveis (sem `cursor: pointer`, feedback de hover fraco), e a sidebar colapsa para uma rail de ícones em vez de deslizar para fora da tela. Nenhum desses pontos depende do backend — são ajustes de tokens de design e de dois componentes de UI (`Button`, `Sidebar`), então cabe resolver antes de iniciar a fase 0 (Supabase/auth).

## What Changes

- Cards de chamado (`TicketCard`, linhas de `TicketRow`/`TicketTable`, colunas do Kanban) passam a ter uma barra lateral de 3px colorida pela cor do status/prioridade **e** um fundo tintado (5–8% de opacidade) na mesma cor, em vez de fundo neutro uniforme.
- Escala tipográfica sobe dois passos: `--text-base` de 15px para ~17–18px, com os demais tokens da escala (`--text-sm`, `--text-lg`, etc.) e `--row-h` recalculados na mesma proporção.
- `Button` (`components/ui/button.tsx`) ganha `cursor-pointer` em todas as variantes e um estado de hover mais perceptível (sombra leve ou elevação, além da troca de opacidade atual).
- ~~Sidebar do shell `(app)` passa de `collapsible="icon"` para `collapsible="offcanvas"`~~ **Revertido.** Depois de testar em uso, o comportamento pedido era o oposto: rail escuro fixo de 56px só com ícones, expandindo para 240px ao passar o mouse (hover) — não uma sidebar que some por completo. `app/(app)/layout.tsx` mantém `collapsible="icon"`, com handlers de hover/foco novos.

## Capabilities

### New Capabilities
- `design-system`: tokens visuais do help desk — cor associada a status/prioridade nos cards e linhas de tabela, escala tipográfica, affordance de clique em elementos interativos (cursor, hover/foco).
- `navigation`: comportamento da sidebar do shell `(app)` — modo de colapso/abertura (hover-expand) e como o estado é acionado pelo usuário.

### Modified Capabilities
- Nenhuma. Não existem specs prévias em `openspec/specs/` — este é o primeiro change do repositório.

## Impact

- **Tokens**: `app/globals.css` (escala de texto, `--row-h`).
- **Componentes de domínio**: `components/chamado/ticket-card.tsx`, `ticket-row.tsx`, `ticket-table.tsx`, `kanban-board.tsx` (aplicação da cor por status/prioridade).
- **Componentes base (shadcn)**: `components/ui/button.tsx` (cursor + hover), `components/ui/sidebar.tsx` e `app/(app)/layout.tsx` (hover-expand, rail de 56px).
- Mudança é puramente visual/CSS + prop de configuração — não toca `lib/mock/data.ts`, `lib/types.ts` nem lógica de SLA. Sem impacto em dado, rota ou contrato de API (não há backend ainda).
- Tensão com a decisão original registrada em `docs/superpowers/specs/2026-08-04-help-desk-design.md` ("Data-Dense Dashboard", cor nunca é único portador de informação, texto nunca abaixo de 12px mas propositalmente compacto): este change ajusta essa decisão para mais cor e mais densidade de leitura, mantendo os princípios de acessibilidade (contraste, cor + ícone/rótulo) já validados.

## Nota — segunda rodada (fora do escopo original deste proposal)

Depois deste change, uma segunda rodada de feedback visual (cores vibrantes por status com semântica nova, sidebar hover-expand definitiva, modal de abertura de chamado, timeline/botões/chips coloridos) foi implementada diretamente via plano aprovado em modo de planejamento, sem novo change formal do OpenSpec. Ver `openspec/changes/frontend-visual-polish/proposal.md` (este arquivo) para o que ficou obsoleto acima, e o histórico de commits do branch `worktree-milvus-ui-overhaul` para o detalhe do que mudou depois.
