## Purpose

Garante que o Kanban de chamados seja uma visualização confiável do fluxo de atendimento — sem oferecer, por si só, um mecanismo de mudança de status — e destaca, sem esconder o status real, quais chamados abertos esperam resposta do analista.
## Requirements
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
O card do Kanban SHALL exibir apenas: número do chamado e nome do cliente, avatar do
operador responsável, título do chamado em uma linha, e a data de criação — sem exibir
indicador de SLA, prioridade, nome textual do analista ou nome do solicitante. O
indicador de SLA passa a existir só no painel lateral do detalhe do chamado.

#### Scenario: Card enxuto
- **WHEN** um card é exibido em qualquer coluna do Kanban
- **THEN** ele mostra número, cliente, avatar do operador, título e a data, e não mostra
  indicador de SLA, badge de prioridade nem o nome por extenso do analista ou do
  solicitante

### Requirement: Coluna derivada "Última interação do cliente"
O Kanban SHALL exibir, no lugar da coluna "Cancelado", uma coluna derivada que lista chamados não finalizados cuja última interação pública foi do solicitante, sem removê-los de sua coluna de status real e sem aceitar que cards sejam soltos nela.

#### Scenario: Chamado aparece nas duas colunas
- **WHEN** a última interação pública de um chamado não finalizado foi feita pelo solicitante
- **THEN** o chamado aparece tanto na coluna do seu status atual quanto na coluna "Última interação do cliente", exibindo nesta última um selo com o status real

#### Scenario: Coluna derivada recusa soltar card
- **WHEN** um analista solta um card sobre a coluna "Última interação do cliente"
- **THEN** o sistema não altera o status do chamado

#### Scenario: Resposta do analista remove o chamado da coluna derivada
- **WHEN** um usuário com papel de analista ou admin responde publicamente a um chamado que estava listado na coluna "Última interação do cliente"
- **THEN** o chamado deixa de aparecer nessa coluna na atualização seguinte

#### Scenario: Coluna "Cancelado" não existe mais no quadro
- **WHEN** o Kanban é exibido
- **THEN** nenhuma coluna "Cancelado" é mostrada, e chamados com esse status continuam acessíveis pelo filtro de status na visão de lista

### Requirement: Dashboard reflete chamados aguardando resposta
O dashboard SHALL exibir um indicador com a contagem de chamados abertos cuja última interação pública foi do solicitante, com link para a visão filtrada correspondente.

#### Scenario: Tile "Aguardando resposta"
- **WHEN** o dashboard é exibido
- **THEN** um tile mostra a contagem atual de chamados abertos aguardando resposta do analista e leva, ao ser clicado, à visão de chamados filtrada por esse critério

