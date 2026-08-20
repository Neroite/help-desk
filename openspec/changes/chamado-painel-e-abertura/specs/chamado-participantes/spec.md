## MODIFIED Requirements

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

## ADDED Requirements

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
