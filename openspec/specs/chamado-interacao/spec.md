## Purpose

Dá aos controles de comentário e apontamento de horas do detalhe do chamado uma interação real (hoje mock), e remove do detalhe informação redundante sobre o solicitante.

## Requirements

### Requirement: Modal de novo comentário com horas opcional
O sistema SHALL permitir adicionar um comentário ao chamado através de um modal dedicado, com um campo opcional de horas que, quando preenchido, registra um apontamento de horas junto com o comentário.

#### Scenario: Comentário sem horas
- **WHEN** um analista abre o modal de novo comentário, escreve o texto e confirma sem preencher horas
- **THEN** o sistema adiciona o comentário à conversa do chamado e não cria nenhum apontamento de horas

#### Scenario: Comentário com horas cria apontamento
- **WHEN** um analista preenche o campo de horas do modal de novo comentário além do texto, e confirma
- **THEN** o sistema adiciona o comentário à conversa e registra um apontamento de horas com a duração informada, vinculado ao mesmo chamado

#### Scenario: Modal acessível pelo controle de Comentários
- **WHEN** um analista aciona o controle de abrir novo comentário no detalhe do chamado
- **THEN** o sistema abre o modal, em vez de mostrar uma notificação de recurso indisponível

### Requirement: Modal de apontamento de horas
O sistema SHALL abrir um modal com o totalizador de horas e a lista de apontamentos do chamado quando o analista aciona o controle "Horas" no detalhe do chamado.

#### Scenario: Abrir o modal de horas
- **WHEN** um analista aciona o controle "Horas" no detalhe do chamado
- **THEN** o sistema abre um modal mostrando o total de horas apontadas e a lista de apontamentos existentes, em vez de mostrar uma notificação de recurso indisponível

#### Scenario: Lançar horas a partir do modal
- **WHEN** um analista aciona lançar um novo apontamento a partir do modal de horas
- **THEN** o sistema registra o apontamento e atualiza o totalizador e a lista exibidos no mesmo modal

### Requirement: Detalhe do chamado não exibe o bloco de solicitante
O detalhe do chamado SHALL deixar de exibir o bloco de informações do solicitante, mantendo a identificação de quem abriu o chamado apenas na seção de contatos.

#### Scenario: Bloco de solicitante ausente
- **WHEN** o detalhe de um chamado é exibido
- **THEN** não há um bloco separado de "Solicitante" mostrando nome, empresa e avaliação do solicitante
