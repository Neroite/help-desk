## Purpose

Dá a iniciar/pausar/retomar atendimento existência própria como ações registradas, com o motivo e o momento visíveis na conversa do chamado, sem se confundir com comentários.

## ADDED Requirements

### Requirement: Iniciar atendimento
O sistema SHALL permitir iniciar o atendimento de um chamado, atribuindo o analista atual como técnico quando o chamado ainda não tiver um, mudando o status para "Em andamento" e registrando um evento de início na conversa.

#### Scenario: Iniciar chamado sem técnico
- **WHEN** um analista sem chamado atribuído aciona "Iniciar atendimento" em um chamado sem técnico
- **THEN** o sistema atribui esse analista como técnico e muda o status do chamado para "Em andamento"

#### Scenario: Evento de início vira mensagem na conversa
- **WHEN** um chamado é iniciado
- **THEN** a timeline exibe um card de mensagem descrevendo o início do atendimento, e a contagem de "Comentários" não aumenta

### Requirement: Pausar atendimento com motivo obrigatório
O sistema SHALL exigir um motivo não vazio para pausar um chamado, congelar o prazo de SLA durante a pausa, e registrar o motivo como parte do evento de pausa na conversa.

#### Scenario: Pausar sem motivo é bloqueado
- **WHEN** um analista aciona pausar um chamado e tenta confirmar sem preencher o motivo
- **THEN** o sistema impede a confirmação e o chamado permanece no status anterior

#### Scenario: Pausa registrada com motivo
- **WHEN** um analista pausa um chamado informando um motivo
- **THEN** o status do chamado muda para "Pausado", o prazo de SLA para de contar, e a timeline exibe um card de mensagem contendo o motivo informado

### Requirement: Retomar atendimento
O sistema SHALL permitir retomar um chamado pausado, voltando o status para "Em andamento", destravando o prazo de SLA e registrando um evento de retomada na conversa.

#### Scenario: Retomar chamado pausado
- **WHEN** um analista retoma um chamado que está com status "Pausado"
- **THEN** o status volta para "Em andamento", o prazo de SLA volta a correr a partir de onde parou, e a timeline exibe um card de mensagem de retomada

### Requirement: Eventos de atendimento não contam como comentário
O sistema SHALL manter separada a contagem de comentários da conversa dos eventos automáticos de início, pausa e retomada.

#### Scenario: Contagem de comentários ignora eventos de sistema
- **WHEN** a conversa de um chamado contém eventos de início, pausa ou retomada além de comentários escritos por usuários
- **THEN** o indicador de contagem de "Comentários" reflete apenas os comentários escritos por usuários
