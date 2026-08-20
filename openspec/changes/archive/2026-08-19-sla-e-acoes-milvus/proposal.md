## Why

O SLA aparecia onde a referência Milvus não o mostra (card do Kanban, cabeçalho do
detalhe) e faltava onde ela mostra em detalhe (painel lateral, com vencimento e prazo
total explícitos). A barra de ações do detalhe era pequena e monocromática; o modal de
horas era uma lista simples sem o formato totalizador+tabela; e as telas de uso diário
(header do detalhe, toolbar, topbar da equipe e do portal) estouravam ou ficavam
inutilizáveis em 375px.

## What Changes

- Remove os indicadores de SLA do card do Kanban e do cabeçalho do detalhe do chamado —
  o card volta a ficar (número, cliente, avatar do operador, título, data); o SLA passa a
  aparecer só no painel lateral, no formato Milvus: rótulo + data/hora de vencimento +
  prazo total (`HH:mm`) + selo de pausa, com barra mais alta que a versão compacta usada
  em linha de tabela/card.
- Barra de ações do cabeçalho: botões `size-10` (antes `size-8`), coloridos por tom
  (azul/verde/preto/vermelho conforme a ação), com as ações secundárias (Conciliar,
  Criar chamado filho, Imprimir) colapsando num menu "Mais ações" abaixo de 640px.
  Remove três ações que só emitiam notificação de "em breve" (Vincular, Anexar, Agendar);
  Anexar volta como upload de verdade via a pill de Anexos.
- Modal de horas reformatado: totalizador em três indicadores (Faturável, Não faturável,
  Total) e uma tabela "Horas apontadas" (Quando, Operador, Descrição, Horas trabalhadas,
  Horas faturadas, excluir). O componente completo passa a montar em um único lugar (o
  modal) — antes montava também no painel lateral, e duas instâncias simultâneas com
  timer independente batiam no índice único de "um timer aberto por analista" do banco.
  O painel lateral e a aba mobile "Detalhes" mostram só um resumo (total + botão que abre
  o modal).
- Responsividade das telas de uso diário: selects do cabeçalho do detalhe viram
  full-width abaixo de `sm`; busca da topbar (equipe e portal) vira um botão que abre um
  atalho de busca abaixo de `sm`, com tema e notificações realocados para o menu do
  avatar nessa faixa; navegação do portal (que sumia inteira abaixo de 768px) passa a
  ficar sempre visível.

## Capabilities

### Modified Capabilities
- `kanban-atendimento`: o card do Kanban deixa de exibir os indicadores de SLA.
- `sla-visual`: o painel lateral do detalhe passa a exibir o SLA no formato detalhado
  (rótulo, vencimento, prazo total, selo de pausa), e o SLA sai do card do Kanban e do
  cabeçalho do detalhe.
- `apontamento-horas`: o modal de apontamento reformata o totalizador em três
  indicadores e lista os lançamentos em tabela; o componente completo passa a montar em
  um único lugar por vez.
- `layout-atendimento`: a barra de ações do detalhe fica maior e colorida por tom, com
  colapso de ações secundárias em telas pequenas; a fila e o detalhe do chamado (equipe e
  portal) ficam utilizáveis em 375px sem sobreposição nem rolagem horizontal, incluindo a
  topbar da equipe e a navegação do portal.

## Impact

- **Kanban/card**: `components/chamado/ticket-card.tsx` (remove as duas `SlaProgress`).
- **Cabeçalho e painel**: `components/chamado/detalhe/cabecalho.tsx` (toolbar `size-10`,
  tons, menu "Mais ações", selects full-width), `components/chamado/sla-linha-detalhada.tsx`
  (novo, formato Milvus), `components/chamado/detalhe/painel-lateral.tsx` (usa a nova
  variante de SLA).
- **Horas**: `components/chamado/apontamento-horas.tsx` (reformatado),
  `components/chamado/detalhe/resumo-horas.tsx` (novo, resumo somente-leitura), aba mobile
  "Horas" removida (redundante depois que o resumo passou a viver dentro de "Detalhes").
- **Responsividade**: `app/(app)/app-shell.tsx`, `app/(portal)/portal-shell.tsx`
  (busca vira `Sheet`, tema/sino no dropdown do avatar abaixo de `sm`; nav do portal
  sempre visível).
- Fora do escopo: `SlaBadge`/`SlaProgress` compactos (usados em linha de tabela e
  preview) não foram alterados — só a variante detalhada do painel lateral é nova.
