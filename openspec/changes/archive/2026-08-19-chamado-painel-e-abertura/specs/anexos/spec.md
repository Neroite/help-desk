## ADDED Requirements

### Requirement: Anexo aceito antes de o chamado existir
O formulário de abertura de chamado SHALL aceitar a seleção de arquivo antes de o
chamado ser criado, mesmo sem um número de chamado ainda existir para vincular o anexo.
O upload de fato SHALL ocorrer depois que o chamado for criado, sem exigir uma segunda
ida à tela.

#### Scenario: Selecionar arquivo antes de criar o chamado
- **WHEN** um usuário seleciona um arquivo no formulário de abertura, antes de confirmar
  a criação
- **THEN** o sistema SHALL mostrar o arquivo como pendente, sem exigir que o chamado já
  exista

#### Scenario: Upload ocorre após a criação do chamado
- **WHEN** o formulário de abertura tem um arquivo pendente e o chamado é criado com
  sucesso
- **THEN** o sistema SHALL enviar o arquivo pendente vinculado ao número do chamado
  recém-criado, sem exigir uma nova ação do usuário

#### Scenario: Falha no upload não desfaz o chamado criado
- **WHEN** o chamado é criado com sucesso mas o upload do arquivo pendente falha
- **THEN** o chamado SHALL permanecer criado, e o sistema SHALL informar quais arquivos
  falharam para reenvio posterior pelo detalhe do chamado
