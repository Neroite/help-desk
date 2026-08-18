## Purpose

Permite dividir um chamado grande em ações menores por setor (tickets filho) e unificar chamados duplicados sobre o mesmo problema em um único ticket principal, sem perder histórico.

## Requirements

### Requirement: Criar ticket filho
O sistema SHALL permitir criar um ticket filho a partir de um chamado existente, herdando cliente e solicitante do chamado pai e vinculando o filho ao pai.

#### Scenario: Criar filho a partir do detalhe
- **WHEN** um analista aciona "Criar ticket filho" no detalhe de um chamado e confirma os dados do novo chamado
- **THEN** o sistema cria um novo chamado vinculado como filho do chamado original, com o mesmo cliente e solicitante

#### Scenario: Pai lista seus filhos
- **WHEN** o detalhe de um chamado que possui tickets filho é exibido
- **THEN** a lista de tickets filho aparece no detalhe, cada um com seu número e status atual

#### Scenario: Encerramento do filho fica visível no pai
- **WHEN** um ticket filho muda de status
- **THEN** o chamado pai reflete essa mudança na lista de filhos exibida em seu próprio detalhe, sem exigir que o analista abra o filho

### Requirement: Conciliar chamados duplicados
O sistema SHALL permitir conciliar dois chamados escolhendo um como principal e anexando o outro a ele como duplicado, preservando o histórico do duplicado e podendo ser feito com os chamados em qualquer status.

#### Scenario: Conciliar chamado duplicado
- **WHEN** um analista aciona "Conciliar" no chamado principal, informa o número do chamado duplicado e confirma
- **THEN** o sistema vincula o chamado duplicado ao principal, finaliza o chamado duplicado, e preserva seus comentários e anexos acessíveis a partir do chamado principal

#### Scenario: Conciliar independe do status atual
- **WHEN** um analista concilia dois chamados, qualquer que seja o status de cada um
- **THEN** o sistema efetiva a conciliação normalmente, sem exigir uma transição de status prévia

#### Scenario: Histórico do duplicado não se perde
- **WHEN** um chamado já conciliado como duplicado é consultado
- **THEN** o sistema mostra que ele foi anexado ao chamado principal e permite acessar o comentário original a partir dele
