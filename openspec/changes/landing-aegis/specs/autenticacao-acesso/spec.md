## MODIFIED Requirements

### Requirement: Login com identificação de papel
O sistema SHALL exigir autenticação por e-mail e senha para acessar qualquer rota que não
seja a de login, a de avaliação por token, ou a landing pública em `/`. Toda pessoa
autenticada SHALL ter exatamente um papel entre `admin`, `analista` e `solicitante`, e todo
`solicitante` SHALL estar vinculado a uma empresa.

#### Scenario: Acesso sem sessão
- **WHEN** uma requisição sem sessão válida atinge qualquer rota protegida
- **THEN** o sistema SHALL redirecionar para a tela de login, preservando o destino
  original para retomar após a autenticação

#### Scenario: Acesso à landing pública sem sessão
- **WHEN** uma requisição sem sessão válida atinge `/`
- **THEN** o sistema SHALL responder com a landing page, sem redirecionar para o login

#### Scenario: Credenciais inválidas
- **WHEN** a pessoa envia e-mail ou senha incorretos
- **THEN** o sistema SHALL exibir mensagem de erro sem revelar se o e-mail existe, e não
  SHALL criar sessão

#### Scenario: Sessão expirada durante o uso
- **WHEN** a sessão expira e a pessoa dispara uma ação de escrita
- **THEN** a ação SHALL ser recusada e a pessoa SHALL ser levada ao login, sem gravação
  parcial

#### Scenario: Solicitante sem empresa vinculada
- **WHEN** um usuário com papel `solicitante` não possui empresa vinculada
- **THEN** o sistema SHALL negar o acesso às telas de chamado em vez de exibir dados de
  todas as empresas
