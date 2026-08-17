## Purpose

Registra quanto tempo a equipe gastou em cada chamado, seja por lançamento manual, seja por um timer que sobrevive a fechar a aba, e marca quais desses lançamentos são faturáveis ao cliente.

## ADDED Requirements

### Requirement: Lançamento de horas por chamado
Um analista ou administrador SHALL poder registrar lançamentos de horas em um chamado, cada um com início, fim, descrição e marcação de faturável. Cada lançamento SHALL pertencer ao analista que o criou. O sistema SHALL apresentar o total de minutos do chamado e o subtotal faturável.

#### Scenario: Lançamento manual
- **WHEN** um analista registra um lançamento com início, fim e descrição
- **THEN** o lançamento SHALL ser gravado com a duração em minutos derivada do intervalo, e os totais do chamado SHALL ser atualizados

#### Scenario: Fim anterior ao início
- **WHEN** o lançamento informa um fim anterior ao início
- **THEN** a gravação SHALL ser recusada

#### Scenario: Totais do chamado
- **WHEN** um chamado possui lançamentos faturáveis e não faturáveis
- **THEN** a tela SHALL exibir o total geral e, separadamente, o total faturável

### Requirement: Timer persistido
O sistema SHALL permitir iniciar um timer em um chamado, gravando imediatamente um lançamento em aberto — com início registrado e sem fim. Um lançamento em aberto SHALL sobreviver a recarregar a página, fechar o navegador e trocar de dispositivo. Parar o timer SHALL gravar o fim e consolidar os minutos.

#### Scenario: Recarregar a página com timer em andamento
- **WHEN** o analista inicia o timer e recarrega a página
- **THEN** a tela SHALL exibir o timer ainda em andamento, contando desde o início original

#### Scenario: Parada do timer
- **WHEN** o analista para um timer em andamento
- **THEN** o lançamento SHALL receber o instante de fim e a duração consolidada, e SHALL passar a compor os totais do chamado

#### Scenario: Timer já em andamento no mesmo chamado
- **WHEN** o analista tenta iniciar um segundo timer no mesmo chamado sem parar o primeiro
- **THEN** o sistema SHALL recusar a abertura e indicar o lançamento já em andamento

### Requirement: Horas invisíveis para o solicitante
Lançamentos de horas SHALL ser legíveis apenas por `admin` e `analista`. A restrição SHALL ser aplicada no banco de dados, e o detalhe do chamado no portal do cliente não SHALL exibir seção de horas.

#### Scenario: Solicitante abre o detalhe do próprio chamado
- **WHEN** um solicitante carrega um chamado que possui lançamentos de horas
- **THEN** nenhuma informação de horas SHALL ser retornada nem exibida

#### Scenario: Solicitante tenta gravar lançamento
- **WHEN** um solicitante envia um lançamento de horas
- **THEN** a gravação SHALL ser rejeitada
