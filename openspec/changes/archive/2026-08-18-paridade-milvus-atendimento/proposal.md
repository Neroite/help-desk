## Why

O help desk chegou às fases 0–6 do roadmap com backend real, mas o uso diário revelou doze problemas concretos: dois bugs que travam o fluxo de atendimento (o Kanban não aceita arrastar cards, e clicar num chamado não abre o detalhe), uma paleta de cores e um contraste de card/checkbox/botão abaixo do padrão de referência (Milvus), uma barra de SLA que continua contando durante a pausa, três controles do detalhe que só disparam "Em breve", e quatro capacidades de trabalho que não existem nem no schema (ticket pai/filho, conciliação de duplicados, contatos e visualizações do chamado, mesa de trabalho/setor). A referência visual e comportamental de todos os itens é o produto Milvus, capturado em telas fornecidas pelo usuário.

## What Changes

- Corrige a navegação por clique no card/linha, hoje interceptada pelo link de navegação envolvendo o card inteiro. **Decisão tomada durante a implementação**: o arrasto do Kanban, que chegou a ser corrigido, foi removido a pedido do usuário depois de ver o resultado funcionando — o Kanban vira só visualização, sem nenhum jeito de mudar status por ele (nem arrastar, nem menu no card); a mudança de status continua disponível no detalhe do chamado, no menu rápido da lista e nas ações em lote.
- Substitui a paleta de cores de status/prioridade pelas cores de referência do Milvus, mantendo os três tokens (`colorVar`, `colorVarFg`, `colorVarSolid`) e ligando `colorVarFg` (hoje definido mas nunca consumido) nos textos pequenos.
- Reduz o card do Kanban aos campos de referência (número + cliente, avatar do operador, título, duas mini-barras de SLA, data) e cria um componente `Card` reutilizável para uniformizar borda/contraste, hoje repetidos ad-hoc em sete lugares.
- Aumenta o contraste de bordas de card, checkbox e botão (o botão de selecionar da lista é hoje quase invisível), e corrige `--muted` sendo idêntico a `--card`/`--surface` no tema escuro.
- Torna o shell staff, a barra de filtros, a paginação da lista e o detalhe do chamado (staff e portal) utilizáveis em telas pequenas (375/768/1024/1440), com alvos de toque adequados.
- Corrige o cálculo e a exibição da barra de SLA: passa a descontar minutos pausados e a considerar o expediente comercial, com severidade gradual (não mais um corte fixo de 60 minutos) e congelamento visual durante pausa e após finalização.
- Substitui os controles mock "Em breve" de Base de Conhecimento/E-mail/Horas por: um modal de novo comentário com campo de horas opcional, e um modal de apontamento de horas aberto pela pill "Horas".
- Muda a seleção de categoria de problema do chamado para um drill-down (categorias raiz visíveis; subcategorias aparecem ao clicar na raiz), como já existe na tela de administração de categorias.
- Remove o bloco "Solicitante" do detalhe do chamado, substituindo-o pelo bloco de contatos (que mostra quem abriu o chamado, com e-mail).
- Adiciona ao schema `helpdesk` e às telas: ticket filho (divisão de um chamado por setor, com progresso refletido no pai), conciliação de chamados duplicados (anexa um chamado ao outro sem perder histórico), registro de quem visualizou o chamado, contatos adicionais acompanhando o chamado, e mesa de trabalho/setor.

## Capabilities

### New Capabilities
- `sla-visual`: cálculo e exibição do progresso e da severidade da barra de SLA (minutos úteis descontando pausa, congelamento em pausa/finalização, gradação de cor).
- `chamado-interacao`: modal de novo comentário (com apontamento de horas opcional embutido), modal de apontamento de horas aberto pela pill "Horas", e remoção do bloco de solicitante do detalhe do chamado.
- `chamado-relacionamento`: criação de ticket filho a partir de um chamado existente, e conciliação de chamados duplicados em um principal.
- `chamado-participantes`: contatos do chamado (quem abriu + contatos adicionais), registro de quem visualizou o chamado, e mesa de trabalho/setor.

### Modified Capabilities
- `kanban-atendimento`: a navegação por clique no card deixa de ser interceptada pelo link do card; o Kanban vira somente visualização, sem arrastar nem menu de mudança de status (requirement pré-existente sobre técnico atribuído removida desta capability — a regra continua valendo, aplicada pelas outras interfaces que mudam status); o conteúdo do card do Kanban é reduzido aos campos de referência do Milvus.
- `layout-atendimento`: paleta de cores de status/prioridade e contraste de bordas de card/checkbox/botão passam a seguir a referência visual; fila, Kanban e detalhe do chamado (staff e portal) ficam utilizáveis em telas pequenas.
- `chamado-categorizacao`: a seleção de categoria de problema no formulário/detalhe do chamado passa a exibir só categorias raiz, revelando as subcategorias ao clicar, em vez de um único select com todas as folhas.

## Impact

- **Tokens e componentes base**: `app/globals.css` (paleta de status/prioridade, `--border`, `--muted` no dark), `components/ui/card.tsx` (novo), `components/ui/checkbox.tsx`, `components/ui/button.tsx`.
- **Kanban e lista**: `components/chamado/kanban-board.tsx`, `ticket-card.tsx`, `ticket-row.tsx`, `ticket-table.tsx`, `lib/kanban/colunas.ts`, `lib/status.ts`.
- **SLA**: `components/chamado/sla-progress.tsx`, `sla-badge.tsx`, `lib/sla-display.ts` (a extensão de exibição); `lib/sla/calendario.ts` é reaproveitado, não alterado.
- **Detalhe do chamado**: `app/(app)/chamados/[numero]/chamado-detalhe-client.tsx`, `components/chamado/comentario-composer.tsx`, `apontamento-horas.tsx`, `categoria-problema-select.tsx`.
- **Responsividade**: `app/(app)/app-shell.tsx`, `components/chamado/filtro-bar.tsx`, `app/(app)/chamados/chamados-client.tsx`, `app/(portal)/portal/chamados/[numero]/page.tsx`, `app/(portal)/portal-shell.tsx`.
- **Banco (schema `helpdesk`, projeto `byteflow-pro`)**: migrations novas em `supabase/migrations/` para `ticket.pai_id`, `ticket.conciliado_em`, `ticket_visualizacao`, `ticket_contato`, `mesa_trabalho`, `setor`, novos valores de `evento_tipo`, e as políticas RLS correspondentes — detalhadas em `design.md`.
- **Camada de dados**: `lib/tickets/queries.ts` (leitura, mapeamento snake_case→camelCase), `lib/tickets/actions.ts` e possíveis módulos irmãos novos (escrita, `revalidatePath`).
- Fora do escopo: fases 7–8 do roadmap (e-mail transacional, alerta de SLA, dashboard/relatórios/CSV), pills "Base de conhecimento"/"E-mail", colunas novas em `apontamento_horas` (tipo/deslocamento/valor), feriados/timezone explícito no calendário de SLA.
