## Purpose

Garante que o Kanban de chamados só permita movimentações consistentes com um atendimento real (técnico atribuído) e destaca, sem esconder o status real, quais chamados abertos esperam resposta do analista.

## Requirements

### Requirement: Movimentação exige técnico atribuído
O sistema SHALL exigir um técnico atribuído antes de permitir que um chamado saia da coluna "A fazer" para qualquer status diferente de "Cancelado", tanto na interface quanto na ação de servidor que efetiva a mudança.

#### Scenario: Mover chamado sem técnico
- **WHEN** um analista arrasta, no Kanban, um chamado sem técnico atribuído para uma coluna de status diferente de "Cancelado"
- **THEN** o sistema bloqueia o movimento e abre um diálogo de atribuição de técnico, sem alterar o status do chamado

#### Scenario: Atribuir técnico completa o movimento
- **WHEN** o analista escolhe um técnico no diálogo de atribuição e confirma
- **THEN** o sistema atribui o técnico ao chamado e move o chamado para o status de destino original do arrasto

#### Scenario: Mover para Cancelado não exige técnico
- **WHEN** um chamado sem técnico atribuído é movido para o status "Cancelado"
- **THEN** o sistema efetiva a mudança normalmente, sem exigir atribuição

#### Scenario: Servidor rejeita contorno da regra
- **WHEN** uma requisição de mudança de status chega ao servidor para um chamado sem técnico atribuído, com destino diferente de "Cancelado"
- **THEN** o servidor rejeita a operação com um erro e o status do chamado permanece inalterado

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
