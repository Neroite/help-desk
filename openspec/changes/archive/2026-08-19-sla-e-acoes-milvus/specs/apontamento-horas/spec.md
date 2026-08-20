## MODIFIED Requirements

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
