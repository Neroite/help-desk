## Purpose

Determina quando um chamado vence: converte a política de SLA da empresa em prazos absolutos de resposta e solução contados apenas em horário comercial, congela o relógio quando o atendimento depende de terceiros e recalcula os prazos quando a prioridade é definida na triagem.

## ADDED Requirements

### Requirement: Contagem de prazo apenas em horário comercial
O sistema SHALL contar minutos de SLA somente dentro do expediente de 09:00 às 18:00, de segunda a sexta-feira. Minutos fora desse intervalo — noites, fins de semana — não SHALL consumir prazo. Os prazos SHALL ser gravados no chamado como instantes absolutos, calculados a partir da abertura, e não como duração relativa.

#### Scenario: Abertura dentro do expediente com folga no mesmo dia
- **WHEN** um chamado é aberto às 09:30 de uma terça-feira com prazo de resposta de 120 minutos
- **THEN** o vencimento da resposta SHALL ser às 11:30 da mesma terça-feira

#### Scenario: Abertura no fim do expediente transborda para o dia seguinte
- **WHEN** um chamado é aberto às 17:30 de uma terça-feira com prazo de resposta de 120 minutos
- **THEN** o vencimento da resposta SHALL ser às 10:30 da quarta-feira, consumindo os 30 minutos restantes da terça e 90 minutos da quarta

#### Scenario: Abertura na sexta com prazo que atravessa o fim de semana
- **WHEN** um chamado é aberto às 17:00 de uma sexta-feira com prazo de solução de 480 minutos
- **THEN** o vencimento da solução SHALL cair na segunda-feira seguinte, sem consumir sábado e domingo

#### Scenario: Abertura fora do expediente
- **WHEN** um chamado é aberto às 22:00 de uma quarta-feira com prazo de resposta de 60 minutos
- **THEN** a contagem SHALL começar às 09:00 de quinta-feira e o vencimento SHALL ser às 10:00 de quinta

### Requirement: Política padrão para chamado sem prioridade
Um chamado aberto sem prioridade SHALL receber prazos calculados pela política padrão da tabela de SLA. A ausência de prioridade não SHALL deixar o chamado sem prazo nem fora da medição.

#### Scenario: Chamado nasce sem prioridade
- **WHEN** um chamado é aberto pelo portal, sem prioridade informada
- **THEN** os prazos de resposta e solução SHALL ser gravados usando a política padrão, e os indicadores de SLA da tela SHALL exibir contagem regressiva normalmente

### Requirement: Recálculo de prazos quando a prioridade é definida
Ao definir ou alterar a prioridade de um chamado, o sistema SHALL recalcular os prazos de resposta e solução a partir da abertura do chamado, usando a política da nova prioridade, preservando o tempo já acumulado de pausa. Um prazo de resposta já cumprido não SHALL ser reaberto pelo recálculo.

#### Scenario: Triagem eleva a prioridade
- **WHEN** um analista define prioridade `alta` em um chamado aberto há 3 horas úteis que estava na política padrão
- **THEN** os prazos SHALL ser recalculados a partir do instante de abertura com os minutos da política `alta`, podendo resultar em prazo já vencido

#### Scenario: Triagem em chamado que já teve pausa
- **WHEN** a prioridade é alterada em um chamado que acumulou minutos de pausa
- **THEN** o recálculo SHALL somar os minutos de pausa acumulados aos novos prazos, para não punir o tempo em que o relógio estava congelado

#### Scenario: Prioridade alterada após a primeira resposta
- **WHEN** a prioridade muda em um chamado que já registrou a primeira resposta
- **THEN** o prazo de solução SHALL ser recalculado e o de resposta SHALL permanecer encerrado

### Requirement: Congelamento do relógio em status de pausa
Os status `pausado` e `aguardando_aprovacao` SHALL congelar a contagem de SLA. Ao entrar em um desses status, o sistema SHALL registrar o instante da pausa; ao sair, SHALL somar os minutos úteis decorridos ao acumulado de pausa do chamado e empurrar ambos os prazos na mesma medida. A semântica de quais status pausam SHALL viver no código, de modo que renomear ou desativar um status na configuração de uma empresa não altere o cálculo.

#### Scenario: Pausa e retomada dentro do mesmo dia
- **WHEN** um chamado é pausado às 10:00 e retomado às 12:00 de um dia útil
- **THEN** os prazos de resposta e solução SHALL ser adiados em 120 minutos úteis

#### Scenario: Pausa que atravessa a noite
- **WHEN** um chamado é pausado às 17:00 de uma terça e retomado às 10:00 da quarta
- **THEN** o adiamento SHALL ser de 120 minutos úteis — 60 minutos na terça e 60 na quarta — e não das 17 horas de relógio decorridas

#### Scenario: Pausa que atravessa o fim de semana
- **WHEN** um chamado é pausado na sexta às 16:00 e retomado na segunda às 10:00
- **THEN** o adiamento SHALL considerar apenas os minutos úteis de sexta e de segunda

#### Scenario: Empresa renomeia o status de pausa
- **WHEN** uma empresa exibe `pausado` com um rótulo próprio
- **THEN** o congelamento do relógio SHALL continuar valendo para aquele status

### Requirement: Encerramento das medições
O prazo de resposta SHALL ser encerrado no instante do primeiro comentário público de um analista no chamado, e esse instante SHALL ser gravado. O prazo de solução SHALL ser encerrado quando o chamado entra em status final. Chamados `cancelado` SHALL ficar fora das estatísticas de SLA.

#### Scenario: Primeira resposta pública do analista
- **WHEN** um analista publica seu primeiro comentário público em um chamado
- **THEN** o instante da primeira resposta SHALL ser gravado e o indicador de SLA de resposta SHALL passar a exibir estado cumprido

#### Scenario: Nota interna não conta como resposta
- **WHEN** um analista registra apenas uma nota interna em um chamado sem resposta pública anterior
- **THEN** o instante de primeira resposta SHALL permanecer vazio e o prazo de resposta SHALL continuar correndo

#### Scenario: Chamado cancelado
- **WHEN** um chamado é movido para `cancelado`
- **THEN** ele SHALL ser excluído das estatísticas de cumprimento de SLA
