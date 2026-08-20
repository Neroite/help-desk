## Purpose

Alinha a proporção do painel de detalhe do chamado e o contêiner visual da fila à referência validada com o usuário, dando mais espaço de leitura à informação estrutural do atendimento (SLA, categorias) e mais presença visual à lista de chamados.
## Requirements
### Requirement: Painel de detalhe ocupa cerca de um terço da largura
Em telas largas, o painel de informações do chamado (solicitante, SLA, categorias, horas, anexos) SHALL ocupar aproximadamente um terço da largura útil da tela, com a timeline ocupando o restante.

#### Scenario: Detalhe em tela larga
- **WHEN** o detalhe do chamado é exibido numa tela com pelo menos 1024px de largura
- **THEN** o painel de informações ocupa aproximadamente um terço da largura útil, e a timeline ocupa o espaço restante

### Requirement: Lista e Kanban de chamados têm contêiner visível
A fila de chamados, em qualquer uma das visões (lista ou Kanban), SHALL apresentar filtros, conteúdo e paginação dentro de um contêiner com borda visível, distinto do fundo da página.

#### Scenario: Camada de card na fila
- **WHEN** a fila de chamados é exibida, em lista ou em Kanban
- **THEN** filtros, conteúdo e paginação aparecem dentro de um contêiner com borda visível

### Requirement: Paleta de cores por status segue a referência visual validada
O sistema SHALL usar, para cada status e prioridade de chamado, as cores da paleta de referência validada com o usuário, mantendo contraste mínimo de 4.5:1 entre o texto de cada indicador e o fundo sobre o qual ele é desenhado.

#### Scenario: Cor de status reconhecível
- **WHEN** um chamado é exibido em qualquer lista, card ou coluna do Kanban
- **THEN** a cor associada ao seu status corresponde à paleta de referência validada, tanto no tema claro quanto no escuro

### Requirement: Elementos clicáveis e cards têm contraste visível
Cards, checkboxes e botões SHALL ter uma borda ou contorno com contraste suficiente para serem distinguidos do fundo da página e uns dos outros, em qualquer tema.

#### Scenario: Card se distingue do fundo
- **WHEN** um card de chamado, de indicador (KPI) ou de linha de tabela é exibido
- **THEN** sua borda é visualmente perceptível contra o fundo da página, tanto no tema claro quanto no escuro

#### Scenario: Checkbox de seleção é visível
- **WHEN** uma linha da tabela de chamados é exibida sem estar selecionada
- **THEN** o checkbox de seleção da linha é visível, com contorno perceptível, sem depender de hover

### Requirement: Fila e detalhe do chamado utilizáveis em telas pequenas
A fila de chamados (lista e Kanban) e o detalhe do chamado, tanto na área da equipe
quanto no portal do solicitante, SHALL permanecer totalmente utilizáveis — sem
sobreposição de conteúdo e com todos os controles alcançáveis — em larguras de tela de
375px, 768px, 1024px e 1440px. Abaixo de 640px, a barra de busca da topbar (área da
equipe e portal) SHALL virar um controle compacto que abre a busca sob demanda, e os
controles secundários da topbar (alternar tema, notificações) SHALL ficar acessíveis
através do menu do usuário em vez de ocupar espaço fixo na barra. A navegação do portal
do solicitante SHALL permanecer acessível em toda largura de tela — nunca ficar
totalmente oculta.

#### Scenario: Shell da equipe em tela de celular
- **WHEN** a área da equipe é acessada em uma largura de 375px
- **THEN** a barra superior, a navegação e os filtros permanecem acessíveis, sem
  sobrepor o conteúdo principal

#### Scenario: Busca compacta abaixo de 640px
- **WHEN** a topbar da área da equipe ou do portal é exibida em uma largura menor que
  640px
- **THEN** a busca aparece como um controle compacto que, ao ser acionado, abre o campo
  de busca completo, em vez de um campo de texto permanentemente espremido

#### Scenario: Tema e notificações no menu do usuário em telas pequenas
- **WHEN** a topbar é exibida em uma largura menor que 640px
- **THEN** alternar tema e notificações SHALL estar acessíveis a partir do menu do
  usuário, e não ocupar posição fixa na topbar

#### Scenario: Navegação do portal nunca desaparece
- **WHEN** o portal do solicitante é acessado em qualquer largura de tela, incluindo
  abaixo de 768px
- **THEN** a navegação para "Meus chamados" permanece visível e acionável

#### Scenario: Lista de chamados paginável em qualquer largura
- **WHEN** a lista de chamados é exibida em qualquer uma das larguras de referência
- **THEN** a paginação está disponível e funcional, igual à disponível em telas largas

#### Scenario: Detalhe do chamado no portal em tela de celular
- **WHEN** o solicitante abre o detalhe de um chamado no portal em uma largura de 375px
- **THEN** todas as seções do detalhe (conversa, horas quando aplicável, categorias)
  permanecem acessíveis sem exigir rolagem horizontal

### Requirement: Barra de ações do chamado é grande e distinta por tom
A barra de ações do cabeçalho do detalhe do chamado SHALL usar botões com alvo de toque
de pelo menos 40px, coloridos por tom conforme a natureza da ação (por exemplo,
finalizar/cancelar distintos de ações neutras). Em telas menores que 640px, as ações
secundárias SHALL colapsar em um menu único, mantendo as ações primárias (mudar status,
finalizar, cancelar) diretamente visíveis.

#### Scenario: Botões de ação com alvo de toque adequado
- **WHEN** o cabeçalho do detalhe do chamado é exibido
- **THEN** cada botão de ação tem pelo menos 40px de lado e uma cor associada ao tom da
  ação

#### Scenario: Ações secundárias colapsam em telas pequenas
- **WHEN** o cabeçalho do detalhe do chamado é exibido em uma largura menor que 640px
- **THEN** as ações secundárias (por exemplo, conciliar, criar chamado filho, imprimir)
  ficam agrupadas em um único controle de menu, e as ações primárias continuam
  diretamente visíveis

