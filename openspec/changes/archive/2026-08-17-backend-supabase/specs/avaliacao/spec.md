## Purpose

Coleta a nota do cliente ao fim do atendimento por um link com token que dispensa login, garantindo uma avaliação por chamado e mantendo o resultado visível para a equipe interna.

## ADDED Requirements

### Requirement: Token de avaliação gerado na finalização
Ao entrar em status final que não seja cancelamento, o chamado SHALL receber um token de avaliação opaco, difícil de adivinhar e único por chamado. O token SHALL ser gerado uma única vez e SHALL permanecer válido enquanto a avaliação não tiver sido registrada. Chamados cancelados não SHALL gerar token.

#### Scenario: Chamado finalizado
- **WHEN** um chamado passa para `finalizado`
- **THEN** um token de avaliação SHALL ser gerado e o link correspondente SHALL ficar disponível na tela do chamado para ser enviado ao solicitante

#### Scenario: Chamado cancelado
- **WHEN** um chamado passa para `cancelado`
- **THEN** nenhum token SHALL ser gerado e o chamado não SHALL aparecer como pendente de avaliação

#### Scenario: Chamado reaberto e finalizado de novo
- **WHEN** um chamado finalizado volta a um status ativo e é finalizado outra vez
- **THEN** o token original SHALL continuar válido, sem gerar um segundo link para o mesmo chamado

### Requirement: Avaliação sem exigir login
A página de avaliação SHALL ser acessível apenas com o token, sem sessão autenticada. Ela SHALL aceitar uma nota inteira de 1 a 5 estrelas e um comentário opcional. Token inexistente, inválido ou já utilizado SHALL levar a uma mensagem clara, sem revelar dados do chamado.

#### Scenario: Solicitante avalia pelo link
- **WHEN** o solicitante abre o link com token válido e envia 4 estrelas com comentário
- **THEN** a avaliação SHALL ser gravada vinculada ao chamado e a página SHALL confirmar o recebimento

#### Scenario: Token desconhecido
- **WHEN** a página é aberta com um token que não corresponde a nenhum chamado
- **THEN** o sistema SHALL exibir mensagem de link inválido e não SHALL exibir número, título ou empresa de chamado algum

#### Scenario: Segunda tentativa de avaliar o mesmo chamado
- **WHEN** o link é aberto novamente depois de a avaliação já ter sido registrada
- **THEN** o sistema SHALL exibir a avaliação já registrada em modo leitura e não SHALL aceitar nova gravação

#### Scenario: Nota fora do intervalo
- **WHEN** o envio informa nota menor que 1 ou maior que 5
- **THEN** a gravação SHALL ser rejeitada

### Requirement: Avaliação visível para a equipe interna
Uma avaliação registrada SHALL ser exibida no detalhe do chamado para `admin` e `analista`, com nota e comentário. O sistema SHALL manter no máximo uma avaliação por chamado.

#### Scenario: Analista abre chamado avaliado
- **WHEN** um analista abre um chamado que já recebeu avaliação
- **THEN** a nota e o comentário SHALL ser exibidos no detalhe

#### Scenario: Tentativa de gravar segunda avaliação para o mesmo chamado
- **WHEN** uma segunda avaliação é enviada para um chamado que já possui uma
- **THEN** o banco SHALL rejeitar a gravação
