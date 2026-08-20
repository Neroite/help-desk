## MODIFIED Requirements

### Requirement: Card do Kanban exibe apenas os campos de referência
O card do Kanban SHALL exibir apenas: número do chamado e nome do cliente, avatar do
operador responsável, título do chamado em uma linha, e a data de criação — sem exibir
indicador de SLA, prioridade, nome textual do analista ou nome do solicitante. O
indicador de SLA passa a existir só no painel lateral do detalhe do chamado.

#### Scenario: Card enxuto
- **WHEN** um card é exibido em qualquer coluna do Kanban
- **THEN** ele mostra número, cliente, avatar do operador, título e a data, e não mostra
  indicador de SLA, badge de prioridade nem o nome por extenso do analista ou do
  solicitante
