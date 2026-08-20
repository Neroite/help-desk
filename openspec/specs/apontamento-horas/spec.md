## Purpose

Registra quanto tempo a equipe gastou em cada chamado, seja por lançamento manual, seja por um timer que sobrevive a fechar a aba, e marca quais desses lançamentos são faturáveis ao cliente.
## Requirements
### Requirement: Lançamento de horas por chamado
Um analista ou administrador SHALL poder registrar lançamentos de horas em um chamado,
cada um com início, fim, descrição e marcação de faturável. Cada lançamento SHALL
pertencer ao analista que o criou. O modal de apontamento de horas do chamado SHALL
apresentar um totalizador com três indicadores — total faturável, total não faturável e
total geral — e uma tabela com os lançamentos (quando, operador, descrição, horas
trabalhadas, horas faturadas). A interface completa de apontamento (totalizador, tabela
e lançamento) SHALL montar em um único lugar por vez; qualquer outro ponto da tela que
mostre horas SHALL ser um resumo somente-leitura que abre esse modal.

#### Scenario: Lançamento manual
- **WHEN** um analista registra um lançamento com início, fim e descrição
- **THEN** o lançamento SHALL ser gravado com a duração em minutos derivada do
  intervalo, e os totais do chamado SHALL ser atualizados

#### Scenario: Fim anterior ao início
- **WHEN** o lançamento informa um fim anterior ao início
- **THEN** a gravação SHALL ser recusada

#### Scenario: Totais do chamado
- **WHEN** um chamado possui lançamentos faturáveis e não faturáveis
- **THEN** a tela SHALL exibir o total geral e, separadamente, o total faturável

#### Scenario: Totalizador com três indicadores
- **WHEN** o modal de apontamento de horas de um chamado é aberto
- **THEN** a tela SHALL exibir três indicadores: total faturável, total não faturável e
  total geral, com a tabela de lançamentos abaixo

#### Scenario: Resumo no painel lateral não duplica a interface completa
- **WHEN** o painel lateral do detalhe do chamado é exibido
- **THEN** ele mostra só o total de horas e um controle para abrir o modal completo — não
  a lista de lançamentos nem os controles de iniciar timer/lançar manualmente

#### Scenario: Um só timer ativo mesmo com o resumo e o modal abertos
- **WHEN** um analista tem o resumo de horas do painel lateral e o modal completo
  acessíveis na mesma tela
- **THEN** iniciar ou parar um timer a partir de um deles SHALL refletir corretamente no
  outro, sem permitir duas tentativas simultâneas de abrir timer para o mesmo analista

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

