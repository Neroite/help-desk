## Purpose

Torna visível e gerenciável quem está envolvido em um chamado além do analista atribuído: quem já visualizou, quem abriu, quem mais deve acompanhar, e a qual mesa de trabalho/setor o chamado pertence.
## Requirements
### Requirement: Registro de quem visualizou o chamado
O sistema SHALL registrar quando um membro da equipe visualiza o detalhe de um chamado, e exibir essa lista no próprio detalhe.

#### Scenario: Visualização registrada ao abrir
- **WHEN** um analista ou administrador abre o detalhe de um chamado
- **THEN** o sistema registra essa visualização e o nome do analista passa a aparecer na lista de "quem viu" desse chamado

#### Scenario: Lista de visualizadores exibida no detalhe
- **WHEN** o detalhe de um chamado já visualizado por mais de um membro da equipe é exibido
- **THEN** o sistema mostra todos os que visualizaram, sem duplicar o mesmo usuário

### Requirement: Contato de quem abriu o chamado
O detalhe do chamado SHALL exibir o contato (nome e e-mail) de quem abriu o chamado. Na
abertura de um novo chamado pelo formulário do staff, quem abre SHALL poder selecionar um
ou mais contatos de uma vez; o primeiro contato selecionado SHALL se tornar o dono do
chamado, e os demais entram como contatos adicionais que já acompanham o chamado desde a
criação.

#### Scenario: Contato do solicitante visível
- **WHEN** o detalhe de um chamado é exibido
- **THEN** o sistema mostra o nome e o e-mail do contato que abriu o chamado, na seção de
  contatos

#### Scenario: Abertura com múltiplos contatos
- **WHEN** um membro da equipe abre um chamado selecionando mais de um contato no
  formulário
- **THEN** o primeiro contato selecionado SHALL se tornar o dono do chamado e os demais
  SHALL aparecer imediatamente na lista de contatos que o acompanham, sem exigir
  adicioná-los de novo depois

#### Scenario: Abertura exige ao menos um contato
- **WHEN** um membro da equipe tenta criar um chamado sem selecionar nenhum contato
- **THEN** o sistema SHALL recusar a criação

#### Scenario: Portal do solicitante abre em nome de quem está logado
- **WHEN** um solicitante abre um chamado pelo próprio portal
- **THEN** o chamado SHALL ser criado com o próprio solicitante como único contato, sem
  oferecer seleção de múltiplos contatos

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

### Requirement: Operador responsável editável no painel do chamado
O painel lateral do detalhe do chamado SHALL permitir atribuir ou trocar o operador
(analista ou administrador) responsável pelo chamado.

#### Scenario: Atribuir operador pelo painel
- **WHEN** um membro da equipe seleciona um operador no painel lateral do chamado
- **THEN** o chamado SHALL passar a ter esse operador como responsável, refletido
  imediatamente no painel

### Requirement: Setor do solicitante no chamado
O painel lateral do detalhe do chamado SHALL permitir registrar de qual setor do cliente
veio o chamado, independente do setor cadastrado no usuário solicitante — editar o setor
de um chamado específico NÃO SHALL alterar o cadastro do usuário nem refletir em outros
chamados dele.

#### Scenario: Definir o setor de origem do chamado
- **WHEN** um membro da equipe seleciona um setor no painel lateral do chamado
- **THEN** esse chamado SHALL passar a exibir o setor escolhido, sem alterar o cadastro
  do usuário solicitante

#### Scenario: Setor de um chamado não vaza para outro
- **WHEN** o setor de um chamado do mesmo solicitante é alterado
- **THEN** os demais chamados desse solicitante SHALL manter o próprio setor, sem serem
  afetados

