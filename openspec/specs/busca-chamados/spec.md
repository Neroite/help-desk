## Purpose

Unifica a busca global de chamados num único comportamento previsível — qualquer termo leva a resultados, filtrados no local certo pra cada área — em vez do atalho apenas numérico de hoje, que ignora silenciosamente texto livre.

## Requirements

### Requirement: Busca do analista leva à visão Kanban de resultados
A busca do topo na área do analista SHALL aceitar número ou texto e levar sempre à visão Kanban de chamados filtrada pelo termo digitado.

#### Scenario: Buscar por número
- **WHEN** o analista digita um número de chamado (com ou sem `#`) na busca do topo e confirma
- **THEN** é levado à visão Kanban de chamados filtrada por esse número

#### Scenario: Buscar por texto
- **WHEN** o analista digita um termo textual na busca do topo e confirma
- **THEN** é levado à visão Kanban de chamados filtrada pelos chamados cujo título contém o termo

#### Scenario: Busca sem resultados
- **WHEN** nenhum chamado corresponde ao termo buscado na visão Kanban de resultados
- **THEN** a tela exibe um estado vazio nomeando o termo buscado, com uma ação para limpar a busca

### Requirement: Busca do portal filtra a lista de chamados do solicitante
O portal do solicitante não tem visão Kanban (mostra chamados como cards). A busca do topo no portal SHALL aceitar número ou texto e filtrar a lista de "Meus chamados" pelo termo, sem navegar para fora do portal.

#### Scenario: Buscar por número no portal
- **WHEN** o solicitante digita um número de chamado na busca do topo e confirma
- **THEN** a lista de "Meus chamados" passa a mostrar só o chamado com esse número, se existir entre os seus

#### Scenario: Buscar por texto no portal
- **WHEN** o solicitante digita um termo textual na busca do topo e confirma
- **THEN** a lista de "Meus chamados" passa a mostrar só os chamados cujo título contém o termo

#### Scenario: Busca sem resultados no portal
- **WHEN** nenhum chamado do solicitante corresponde ao termo buscado
- **THEN** a lista exibe um estado vazio nomeando o termo buscado, com uma ação para limpar a busca
