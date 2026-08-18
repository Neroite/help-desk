## Purpose

Torna visível e gerenciável quem está envolvido em um chamado além do analista atribuído: quem já visualizou, quem abriu, quem mais deve acompanhar, e a qual mesa de trabalho/setor o chamado pertence.

## ADDED Requirements

### Requirement: Registro de quem visualizou o chamado
O sistema SHALL registrar quando um membro da equipe visualiza o detalhe de um chamado, e exibir essa lista no próprio detalhe.

#### Scenario: Visualização registrada ao abrir
- **WHEN** um analista ou administrador abre o detalhe de um chamado
- **THEN** o sistema registra essa visualização e o nome do analista passa a aparecer na lista de "quem viu" desse chamado

#### Scenario: Lista de visualizadores exibida no detalhe
- **WHEN** o detalhe de um chamado já visualizado por mais de um membro da equipe é exibido
- **THEN** o sistema mostra todos os que visualizaram, sem duplicar o mesmo usuário

### Requirement: Contato de quem abriu o chamado
O detalhe do chamado SHALL exibir o contato (nome e e-mail) de quem abriu o chamado.

#### Scenario: Contato do solicitante visível
- **WHEN** o detalhe de um chamado é exibido
- **THEN** o sistema mostra o nome e o e-mail do contato que abriu o chamado, na seção de contatos

### Requirement: Adicionar contatos para acompanhar o chamado
O sistema SHALL permitir adicionar contatos adicionais para acompanhar um chamado, além de quem o abriu.

#### Scenario: Adicionar contato adicional
- **WHEN** um analista adiciona um contato ao chamado a partir da seção de contatos
- **THEN** o contato passa a aparecer na lista de contatos que acompanham o chamado

#### Scenario: Remover contato adicional
- **WHEN** um analista remove um contato adicional previamente adicionado ao chamado
- **THEN** o contato deixa de aparecer na lista de contatos que acompanham o chamado, e quem abriu o chamado permanece

### Requirement: Mesa de trabalho e setor
O sistema SHALL permitir associar um chamado a uma mesa de trabalho e um usuário da equipe a um setor, e filtrar a fila de chamados por mesa de trabalho.

#### Scenario: Definir mesa de trabalho do chamado
- **WHEN** um analista define a mesa de trabalho de um chamado no detalhe ou na abertura do chamado
- **THEN** a mesa de trabalho escolhida passa a ser exibida no chamado

#### Scenario: Filtrar fila por mesa de trabalho
- **WHEN** um analista filtra a fila de chamados por uma mesa de trabalho específica
- **THEN** apenas os chamados associados a essa mesa aparecem na fila
