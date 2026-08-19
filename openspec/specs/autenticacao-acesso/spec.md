## Purpose

Define quem entra no help desk, com qual papel, e o que cada papel consegue ler e escrever — incluindo o isolamento entre empresas-clientes, que é aplicado no próprio banco de dados e não apenas na interface.
## Requirements
### Requirement: Login com identificação de papel
O sistema SHALL exigir autenticação por e-mail e senha para acessar qualquer rota que não
seja a de login, a de avaliação por token, ou a landing pública (`/` e `/landing`). Toda
pessoa autenticada SHALL ter exatamente um papel entre `admin`, `analista` e
`solicitante`, e todo `solicitante` SHALL estar vinculado a uma empresa.

#### Scenario: Acesso sem sessão
- **WHEN** uma requisição sem sessão válida atinge qualquer rota protegida
- **THEN** o sistema SHALL redirecionar para a tela de login, preservando o destino
  original para retomar após a autenticação

#### Scenario: Acesso à landing pública sem sessão
- **WHEN** uma requisição sem sessão válida atinge `/` ou `/landing`
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

### Requirement: Redirecionamento por papel após autenticação
Após o login, o sistema SHALL levar `admin` e `analista` para a área interna de chamados e `solicitante` para o portal do cliente. Um `solicitante` autenticado não SHALL conseguir abrir nenhuma rota da área interna, e a tentativa SHALL resultar em redirecionamento para o portal.

#### Scenario: Analista faz login
- **WHEN** um usuário com papel `analista` conclui o login sem destino original preservado
- **THEN** o sistema SHALL abrir a fila de chamados da área interna

#### Scenario: Solicitante tenta abrir rota interna pela URL
- **WHEN** um usuário com papel `solicitante` acessa diretamente uma URL da área interna ou de configuração
- **THEN** o sistema SHALL redirecioná-lo para o portal e não SHALL renderizar o conteúdo interno

### Requirement: Isolamento de dados por empresa aplicado no banco
As regras de visibilidade SHALL ser aplicadas por políticas no banco de dados, de modo que uma consulta feita com a sessão de um usuário retorne apenas as linhas que aquele papel pode ver, mesmo que a consulta seja construída sem filtro explícito. Um `solicitante` SHALL ler e escrever somente em chamados da própria empresa. `analista` e `admin` SHALL ler chamados de todas as empresas.

#### Scenario: Solicitante consulta chamados sem filtro de empresa
- **WHEN** uma consulta de chamados é executada com a sessão de um solicitante e sem cláusula de empresa
- **THEN** o resultado SHALL conter apenas chamados da empresa daquele solicitante

#### Scenario: Solicitante acessa chamado de outra empresa pelo número
- **WHEN** um solicitante abre a URL de detalhe de um chamado que pertence a outra empresa
- **THEN** o sistema SHALL responder como chamado inexistente, sem distinguir "não existe" de "não é seu"

#### Scenario: Solicitante tenta comentar em chamado de outra empresa
- **WHEN** um solicitante envia um comentário informando o identificador de um chamado de outra empresa
- **THEN** a gravação SHALL ser rejeitada pelo banco

### Requirement: Nota interna invisível para o solicitante
Comentários marcados como internos SHALL ser legíveis apenas por `admin` e `analista`. A restrição SHALL valer na consulta ao banco, e não apenas na renderização da timeline. Um `solicitante` não SHALL conseguir criar comentário interno.

#### Scenario: Solicitante abre chamado que possui notas internas
- **WHEN** um solicitante carrega o detalhe de um chamado da própria empresa que contém comentários internos e públicos
- **THEN** a timeline SHALL conter apenas os comentários públicos, e nenhum indício da existência dos internos

#### Scenario: Solicitante tenta gravar comentário marcado como interno
- **WHEN** um solicitante envia um comentário com a marcação de interno
- **THEN** a gravação SHALL ser rejeitada

### Requirement: Escrita em configuração restrita a admin
Empresas, usuários, categorias, política de SLA e status por empresa SHALL ser graváveis apenas por `admin`. `analista` SHALL conseguir ler essas configurações, pois elas alimentam filtros e formulários de chamado.

#### Scenario: Analista tenta alterar a política de SLA
- **WHEN** um analista envia uma alteração de minutos de resposta ou solução
- **THEN** a gravação SHALL ser rejeitada e o dado SHALL permanecer inalterado

#### Scenario: Analista carrega o formulário de triage
- **WHEN** um analista abre um chamado para triagem
- **THEN** as categorias e os status ativos da empresa do chamado SHALL estar disponíveis para leitura

