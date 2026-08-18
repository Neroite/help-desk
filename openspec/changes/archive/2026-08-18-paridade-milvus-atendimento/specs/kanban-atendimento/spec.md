## REMOVED Requirements

### Requirement: Movimentação exige técnico atribuído
**Reason**: O Kanban virou somente visualização — nenhuma interação nele (arrastar, clicar) muda o status de um chamado; a regra de "técnico atribuído antes de sair de A fazer" deixa de ter uma interface própria dentro desta capability.
**Migration**: A regra continua valendo, sem mudança de comportamento — só muda onde vive: é aplicada pela mesma ação de servidor (`mudarStatus`), agora acionada pelo menu rápido da lista e pelas ações em lote, não mais pelo Kanban. Nenhuma tela perde a proteção; o Kanban só deixou de ser um dos pontos de entrada.

## ADDED Requirements

### Requirement: Kanban é somente visualização
O Kanban SHALL exibir os chamados sem oferecer nenhum mecanismo de mudança de status a partir dele — nem arrastar card entre colunas, nem menu de mudança rápida no card. A única interação do card é a navegação: um clique leva ao detalhe do chamado, onde o status pode ser alterado.

#### Scenario: Arrastar não move o chamado
- **WHEN** um analista tenta arrastar um card do Kanban para outra coluna
- **THEN** o chamado permanece na coluna original e nenhuma chamada de mudança de status é feita

#### Scenario: Card não expõe menu de mudança de status
- **WHEN** um card do Kanban é exibido, em qualquer coluna
- **THEN** não há nenhum controle nele (menu, botão) que altere o status do chamado

#### Scenario: Clique navega para o detalhe
- **WHEN** um analista clica em um card do Kanban
- **THEN** o sistema navega para o detalhe do chamado, onde o status pode ser alterado

### Requirement: Card do Kanban exibe apenas os campos de referência
O card do Kanban SHALL exibir apenas: número do chamado e nome do cliente, avatar do operador responsável, título do chamado em uma linha, indicadores de SLA de resposta e de solução, e a data de criação — sem exibir prioridade, nome textual do analista ou nome do solicitante.

#### Scenario: Card enxuto
- **WHEN** um card é exibido em qualquer coluna do Kanban
- **THEN** ele mostra número, cliente, avatar do operador, título, os dois indicadores de SLA e a data, e não mostra um badge de prioridade nem o nome por extenso do analista ou do solicitante
