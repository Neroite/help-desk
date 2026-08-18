## Purpose

Cobre o ciclo de vida do chamado no help desk — abertura, numeração, triagem, transições de status, comentários e a trilha de eventos que sustenta a timeline — de modo que tudo que hoje é estado de tela passe a ser dado persistido e auditável.

## ADDED Requirements

### Requirement: Abertura de chamado com numeração global
Todo chamado criado SHALL receber um número inteiro único, de uma sequência global crescente compartilhada por todas as empresas. O número SHALL ser atribuído pelo banco de dados, nunca calculado na aplicação, e SHALL ser imutável. O chamado SHALL nascer sem prioridade e sem analista atribuído, com o status inicial ativo da empresa.

#### Scenario: Solicitante abre chamado pelo portal
- **WHEN** um solicitante envia título, descrição e categoria de problema
- **THEN** o sistema SHALL gravar o chamado vinculado à empresa do solicitante, com número novo, sem prioridade, sem analista, e SHALL redirecionar para o detalhe do chamado criado

#### Scenario: Duas aberturas simultâneas
- **WHEN** dois chamados são abertos ao mesmo tempo, por empresas diferentes
- **THEN** cada um SHALL receber um número distinto, sem lacuna reaproveitada nem colisão

#### Scenario: Analista abre chamado em nome do cliente
- **WHEN** um analista abre um chamado informando a empresa e o solicitante
- **THEN** o chamado SHALL ser gravado com aquele solicitante como autor e o analista SHALL poder, no mesmo fluxo, definir prioridade e assumir o atendimento

#### Scenario: Abertura sem título ou descrição
- **WHEN** o formulário é enviado sem título ou sem descrição
- **THEN** a gravação SHALL ser recusada com mensagem por campo, e nenhum número SHALL ser consumido

### Requirement: Triagem do chamado
Um analista SHALL poder definir prioridade, categoria de atendimento e responsável de um chamado. Definir prioridade SHALL disparar o recálculo dos prazos de SLA. Cada uma dessas alterações SHALL ser refletida imediatamente na tela sem recarregar a página inteira.

#### Scenario: Analista assume o chamado
- **WHEN** um analista se atribui um chamado sem responsável
- **THEN** o chamado SHALL passar a apontar para ele e o evento de atribuição SHALL ser registrado

#### Scenario: Prioridade definida na triagem
- **WHEN** o analista define a prioridade de um chamado que estava sem prioridade
- **THEN** os prazos SHALL ser recalculados pela política daquela prioridade e os indicadores de SLA da tela SHALL refletir os novos prazos

#### Scenario: Prioridade removida
- **WHEN** o analista volta o chamado para o estado sem prioridade
- **THEN** os prazos SHALL voltar a ser calculados pela política padrão

### Requirement: Transição de status persistida
A troca de status SHALL ser gravada e SHALL sobreviver a recarregar a página. O sistema SHALL aceitar apenas status pertencentes ao catálogo fixo e ativos para a empresa do chamado. Entrar ou sair de um status de pausa SHALL acionar o congelamento ou a retomada do relógio de SLA; entrar em status final SHALL gravar o instante de finalização.

#### Scenario: Analista muda o status pelo detalhe do chamado
- **WHEN** um analista seleciona um novo status no detalhe do chamado
- **THEN** a alteração SHALL ser gravada, um evento de status SHALL ser registrado com origem e destino, e o valor SHALL persistir após recarregar a página

#### Scenario: Status desativado pela empresa
- **WHEN** uma transição é solicitada para um status que a empresa do chamado desativou
- **THEN** a gravação SHALL ser rejeitada

#### Scenario: Chamado finalizado
- **WHEN** um chamado entra em status final
- **THEN** o instante de finalização SHALL ser gravado e o chamado SHALL passar a aceitar avaliação

#### Scenario: Mudança de status pelo kanban
- **WHEN** um chamado é arrastado para outra coluna do kanban
- **THEN** o efeito SHALL ser idêntico ao da troca pelo seletor de status, incluindo evento e efeito sobre o SLA

### Requirement: Comentários públicos e internos
Analistas e administradores SHALL poder registrar comentários públicos e notas internas em um chamado; solicitantes SHALL poder registrar apenas comentários públicos. Todo comentário SHALL guardar autor e instante, e SHALL aparecer na timeline logo após o envio, sem recarregar a página.

#### Scenario: Analista responde ao solicitante
- **WHEN** um analista envia um comentário público
- **THEN** o comentário SHALL ser gravado, exibido na timeline e, se for o primeiro público do atendimento, SHALL encerrar o prazo de resposta

#### Scenario: Analista registra nota interna
- **WHEN** um analista envia um comentário marcado como interno
- **THEN** o comentário SHALL ser gravado como interno e exibido com distinção visual para a equipe interna

#### Scenario: Comentário vazio
- **WHEN** o envio ocorre com corpo em branco
- **THEN** a gravação SHALL ser recusada

### Requirement: Trilha de eventos do chamado
O sistema SHALL registrar um evento a cada criação de chamado, troca de status, troca de responsável e troca de prioridade, guardando tipo, valor de origem, valor de destino, autor e instante. A timeline do chamado SHALL apresentar comentários e eventos intercalados em ordem cronológica única.

#### Scenario: Sequência de atendimento
- **WHEN** um chamado é aberto, atribuído, comentado e pausado
- **THEN** a timeline SHALL exibir os quatro registros em ordem cronológica, distinguindo comentário de evento

#### Scenario: Evento registra o valor anterior
- **WHEN** o status muda de `a_fazer` para `em_andamento`
- **THEN** o evento gravado SHALL conter tanto o valor de origem quanto o de destino

### Requirement: Fila de chamados filtrada e ordenada
A fila SHALL consultar os chamados no banco aplicando os filtros de empresa, responsável, status e prioridade presentes na URL. Os filtros SHALL continuar refletidos na URL, de modo que o endereço permaneça compartilhável e o botão voltar do navegador funcione. A fila SHALL apresentar estados distintos de carregamento, vazio e erro.

#### Scenario: Filtro por status e empresa
- **WHEN** a URL contém filtro de empresa e de status
- **THEN** a consulta SHALL retornar apenas os chamados correspondentes, e o total exibido SHALL refletir o resultado filtrado

#### Scenario: Nenhum chamado corresponde ao filtro
- **WHEN** a combinação de filtros não retorna nenhum chamado
- **THEN** a fila SHALL exibir mensagem de vazio com ação para limpar os filtros, e não uma área em branco

#### Scenario: Falha na consulta
- **WHEN** a consulta ao banco falha
- **THEN** a fila SHALL exibir estado de erro com ação de repetir, sem apresentar dado desatualizado como se fosse atual

#### Scenario: Busca por número
- **WHEN** a busca global recebe `482` ou `#482`
- **THEN** o sistema SHALL levar diretamente ao detalhe do chamado 482, respeitando as regras de visibilidade do papel
