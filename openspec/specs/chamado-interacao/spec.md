## Purpose

Dá aos controles de comentário e apontamento de horas do detalhe do chamado uma interação real (hoje mock), e remove do detalhe informação redundante sobre o solicitante.
## Requirements
### Requirement: Modal de novo comentário com horas opcional
O sistema SHALL permitir adicionar um comentário ao chamado através de um modal dedicado,
com editor de texto rico (negrito, itálico, sublinhado, lista com marcador, lista
numerada, link e imagem) e um campo opcional de horas que, quando preenchido, registra um
apontamento de horas junto com o comentário. A pill "Comentários" do detalhe do chamado
SHALL ser o único caminho para abrir o modal — não existe mais um composer de texto
sempre visível ao lado da timeline nem um filtro que alterna o que a timeline mostra.

#### Scenario: Comentário sem horas
- **WHEN** um analista abre o modal de novo comentário, escreve o texto e confirma sem
  preencher horas
- **THEN** o sistema adiciona o comentário à conversa do chamado e não cria nenhum
  apontamento de horas

#### Scenario: Comentário com horas cria apontamento
- **WHEN** um analista preenche o campo de horas do modal de novo comentário além do
  texto, e confirma
- **THEN** o sistema grava o comentário primeiro e, só depois de confirmada a
  persistência, registra o apontamento de horas com a duração informada — se o
  comentário falhar, nenhum apontamento é criado

#### Scenario: Modal acessível pelo controle de Comentários
- **WHEN** um analista aciona a pill "Comentários" no detalhe do chamado
- **THEN** o sistema abre o modal de novo comentário; não há nenhum outro controle no
  detalhe que adicione comentário fora desse modal (nem composer inline, nem botão
  redundante ao lado da pill)

### Requirement: Modal de apontamento de horas
O sistema SHALL abrir um modal com o totalizador de horas e a lista de apontamentos do chamado quando o analista aciona o controle "Horas" no detalhe do chamado.

#### Scenario: Abrir o modal de horas
- **WHEN** um analista aciona o controle "Horas" no detalhe do chamado
- **THEN** o sistema abre um modal mostrando o total de horas apontadas e a lista de apontamentos existentes, em vez de mostrar uma notificação de recurso indisponível

#### Scenario: Lançar horas a partir do modal
- **WHEN** um analista aciona lançar um novo apontamento a partir do modal de horas
- **THEN** o sistema registra o apontamento e atualiza o totalizador e a lista exibidos no mesmo modal

### Requirement: Detalhe do chamado não exibe o bloco de solicitante
O detalhe do chamado SHALL deixar de exibir o bloco de informações do solicitante, mantendo a identificação de quem abriu o chamado apenas na seção de contatos.

#### Scenario: Bloco de solicitante ausente
- **WHEN** o detalhe de um chamado é exibido
- **THEN** não há um bloco separado de "Solicitante" mostrando nome, empresa e avaliação do solicitante

### Requirement: Editor de comentário com formatação rica
O modal de novo comentário do detalhe do chamado SHALL oferecer um editor de texto rico
com negrito, itálico, sublinhado, lista com marcador, lista numerada, link e inserção de
imagem. O HTML do comentário SHALL ser construído no servidor a partir da estrutura do
editor — o sistema NÃO SHALL aceitar HTML pronto enviado pelo cliente.

#### Scenario: Formatação aplicada é preservada
- **WHEN** um analista aplica negrito, itálico ou lista ao texto do comentário e confirma
- **THEN** o comentário SHALL ser exibido na timeline com a mesma formatação

#### Scenario: Imagem colada ou arrastada sobe automaticamente
- **WHEN** um analista cola ou arrasta uma imagem para dentro do editor
- **THEN** o sistema SHALL fazer o upload da imagem e inseri-la no corpo do comentário,
  sem exigir uma ação separada de anexar

#### Scenario: Conteúdo fora da allowlist não é emitido
- **WHEN** a estrutura do editor contém um elemento ou atributo que o servidor não
  reconhece (por exemplo, um link com protocolo que não seja http/https/mailto, ou uma
  imagem que não aponte para a rota interna de anexo)
- **THEN** o sistema SHALL descartar o elemento ou atributo não reconhecido, preservando
  o texto ao redor, sem gravar o valor não permitido

### Requirement: Descrição do chamado é o primeiro comentário da conversa
Ao abrir um chamado com uma descrição não vazia, o sistema SHALL gravar essa descrição
também como o primeiro comentário público da conversa, autorado pelo solicitante, com a
mesma data de criação do chamado.

#### Scenario: Descrição aparece na timeline do analista
- **WHEN** um chamado é aberto com uma descrição preenchida
- **THEN** o comentário correspondente à descrição SHALL aparecer como o primeiro item da
  timeline do detalhe do chamado, autorado pelo solicitante

#### Scenario: Descrição vazia não gera comentário
- **WHEN** um chamado é aberto sem descrição
- **THEN** o sistema NÃO SHALL gravar nenhum comentário correspondente à descrição

#### Scenario: Abertura em nome do cliente não altera o SLA de resposta
- **WHEN** um membro da equipe abre um chamado em nome do solicitante, gerando o
  comentário da descrição
- **THEN** o SLA de primeira resposta do chamado NÃO SHALL ser marcado como cumprido por
  esse comentário — o autor gravado é o solicitante, não a equipe

