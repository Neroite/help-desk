## ADDED Requirements

### Requirement: Painel lateral exibe SLA no formato detalhado
O painel lateral do detalhe do chamado SHALL exibir, para SLA de resposta e de solução,
o rótulo, a data/hora de vencimento e o prazo total da política vigente, além da barra de
progresso e do indicador de pausa — não apenas a barra compacta usada em linha de tabela
e card. O card do Kanban e o cabeçalho do detalhe do chamado NÃO SHALL exibir indicador
de SLA.

#### Scenario: SLA detalhado no painel
- **WHEN** o painel lateral do detalhe de um chamado é exibido
- **THEN** cada indicador de SLA (resposta e solução) mostra o rótulo, a data/hora de
  vencimento, o prazo total da política e a barra de progresso

#### Scenario: SLA pausado exibe selo
- **WHEN** o SLA de um chamado está congelado (chamado pausado ou aguardando aprovação)
- **THEN** o indicador de SLA correspondente no painel lateral exibe um selo de pausa

#### Scenario: SLA ausente do card e do cabeçalho
- **WHEN** um chamado é exibido no card do Kanban ou no cabeçalho do seu próprio detalhe
- **THEN** nenhum indicador de SLA aparece nesses dois lugares — só no painel lateral
