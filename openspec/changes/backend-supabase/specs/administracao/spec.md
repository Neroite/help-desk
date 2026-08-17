## Purpose

Dá ao administrador o controle do cadastro que sustenta a operação — empresas-clientes, pessoas e seus papéis, categorias, política de SLA e quais status cada empresa usa — com persistência real no lugar das listas fixas usadas no protótipo.

## ADDED Requirements

### Requirement: Cadastro de empresas
O administrador SHALL poder criar, editar e desativar empresas-clientes, cada uma com nome e CNPJ. Empresa desativada não SHALL aparecer para abertura de novos chamados, e os chamados históricos dela SHALL permanecer acessíveis.

#### Scenario: Empresa desativada
- **WHEN** o administrador desativa uma empresa
- **THEN** ela não SHALL ser oferecida na abertura de chamado, e os chamados existentes daquela empresa SHALL continuar visíveis na fila e no histórico

#### Scenario: CNPJ duplicado
- **WHEN** o administrador cadastra uma empresa com CNPJ já usado por outra
- **THEN** a gravação SHALL ser recusada

### Requirement: Cadastro de usuários com papel e vínculo
O administrador SHALL poder cadastrar usuários informando nome, e-mail, papel e — para solicitantes — a empresa vinculada. Um usuário com papel `solicitante` SHALL exigir empresa; `admin` e `analista` não SHALL ser vinculados a empresa. Cada usuário cadastrado SHALL poder autenticar-se com esse e-mail.

#### Scenario: Solicitante cadastrado sem empresa
- **WHEN** o administrador tenta salvar um solicitante sem empresa
- **THEN** a gravação SHALL ser recusada indicando o campo obrigatório

#### Scenario: E-mail já cadastrado
- **WHEN** o e-mail informado já pertence a outro usuário
- **THEN** a gravação SHALL ser recusada

#### Scenario: Alteração de papel
- **WHEN** o administrador muda o papel de um usuário
- **THEN** as permissões e o redirecionamento pós-login SHALL passar a seguir o novo papel na próxima sessão

### Requirement: Catálogo de categorias
O administrador SHALL poder manter categorias de atendimento e categorias de problema, estas últimas em dois níveis — pai e filho. Uma categoria em uso por chamados existentes não SHALL poder ser excluída; SHALL apenas ser desativada, preservando o histórico.

#### Scenario: Categoria de problema com pai
- **WHEN** o administrador cria uma categoria de problema apontando outra como pai
- **THEN** ela SHALL ser exibida nos formulários como caminho de dois níveis

#### Scenario: Exclusão de categoria em uso
- **WHEN** o administrador tenta excluir uma categoria referenciada por algum chamado
- **THEN** a exclusão SHALL ser recusada e a desativação SHALL ser oferecida

#### Scenario: Terceiro nível de categoria de problema
- **WHEN** o administrador tenta apontar como pai uma categoria que já é filha
- **THEN** a gravação SHALL ser recusada

### Requirement: Política de SLA editável
O administrador SHALL poder editar os minutos de resposta e de solução para cada prioridade e para a política padrão. A alteração SHALL valer para chamados abertos ou recalculados a partir daquele momento, e não SHALL reescrever retroativamente os prazos de chamados já em andamento.

#### Scenario: Alteração dos minutos de uma prioridade
- **WHEN** o administrador reduz os minutos de solução da prioridade `alta`
- **THEN** chamados abertos depois disso SHALL usar o novo valor, e os prazos já gravados em chamados existentes SHALL permanecer inalterados até que ocorra um recálculo por mudança de prioridade

#### Scenario: Política padrão ausente
- **WHEN** o administrador tenta remover a política padrão
- **THEN** a operação SHALL ser recusada, pois chamados sem prioridade dependem dela

#### Scenario: Minutos inválidos
- **WHEN** um valor de minutos informado é zero ou negativo
- **THEN** a gravação SHALL ser recusada

### Requirement: Status ativos e rótulos por empresa
O administrador SHALL poder, para cada empresa, ativar ou desativar status do catálogo fixo e definir um rótulo próprio de exibição. O catálogo de status em si SHALL ser fixo, e nenhuma configuração de empresa SHALL alterar a semântica de pausa de SLA ou de status final.

#### Scenario: Rótulo próprio de empresa
- **WHEN** uma empresa renomeia `aguardando_aprovacao` para um termo próprio
- **THEN** as telas SHALL exibir o rótulo da empresa nos chamados dela, e o comportamento de congelamento de SLA SHALL permanecer inalterado

#### Scenario: Status desativado com chamados naquele status
- **WHEN** o administrador desativa um status que ainda possui chamados
- **THEN** o sistema SHALL recusar a desativação ou exigir a movimentação desses chamados antes de concluir

#### Scenario: Colunas do kanban ao filtrar por empresa
- **WHEN** a fila em modo kanban é filtrada por uma empresa
- **THEN** SHALL apresentar apenas os status ativos daquela empresa, com os rótulos dela
