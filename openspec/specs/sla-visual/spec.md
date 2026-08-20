## Purpose

Garante que o indicador visual de prazo de SLA (barra de progresso e badge) reflita fielmente o tempo útil restante segundo o motor de SLA, incluindo pausas e finalização, em vez de contar em tempo de parede.
## Requirements
### Requirement: Progresso de SLA descontando pausas
O indicador visual de progresso de SLA SHALL calcular o percentual decorrido a partir de minutos úteis, descontando os minutos em que o chamado esteve pausado, em vez de usar a diferença bruta entre o momento atual e a criação do chamado.

#### Scenario: Chamado pausado não avança visualmente
- **WHEN** um chamado está com status que congela o SLA (`pausado` ou `aguardando_aprovacao`)
- **THEN** a barra de progresso permanece no percentual do momento em que a pausa começou, sem avançar enquanto o tempo passa

#### Scenario: Retomada continua do ponto onde parou
- **WHEN** um chamado pausado é retomado
- **THEN** a barra de progresso volta a avançar a partir do percentual em que estava no momento da pausa, sem saltos

### Requirement: Severidade gradual do prazo
O indicador visual de SLA SHALL calcular a severidade (normal, atenção, crítico, estourado) como função do percentual de prazo consumido em relação ao prazo total da política vigente, não de um limite fixo de minutos restantes.

#### Scenario: Severidade cresce com o percentual consumido
- **WHEN** o percentual de tempo útil consumido de um chamado ativo ultrapassa os limiares de atenção e depois de crítico
- **THEN** a cor do indicador muda de normal para atenção e depois para crítico, refletindo o percentual e não um valor fixo em minutos

#### Scenario: Prazo vencido é sempre estourado
- **WHEN** o prazo (resposta ou solução) de um chamado ativo já passou
- **THEN** o indicador exibe o estado estourado, independentemente do percentual calculado

### Requirement: Indicador congela ao finalizar o chamado
O indicador visual de SLA SHALL parar de avançar quando o chamado atinge um status final, mantendo o percentual e a severidade do momento em que o SLA foi efetivamente encerrado (primeira resposta, para o SLA de resposta; finalização, para o SLA de solução).

#### Scenario: Chamado finalizado não continua contando
- **WHEN** um chamado é finalizado ou cancelado
- **THEN** o indicador de SLA de solução para de avançar e reflete o estado no momento da finalização, mesmo que a página continue aberta

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

