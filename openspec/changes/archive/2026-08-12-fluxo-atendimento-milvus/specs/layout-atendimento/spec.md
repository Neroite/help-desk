## Purpose

Alinha a proporção do painel de detalhe do chamado e o contêiner visual da fila à referência validada com o usuário, dando mais espaço de leitura à informação estrutural do atendimento (SLA, categorias) e mais presença visual à lista de chamados.

## ADDED Requirements

### Requirement: Painel de detalhe ocupa cerca de um terço da largura
Em telas largas, o painel de informações do chamado (solicitante, SLA, categorias, horas, anexos) SHALL ocupar aproximadamente um terço da largura útil da tela, com a timeline ocupando o restante.

#### Scenario: Detalhe em tela larga
- **WHEN** o detalhe do chamado é exibido numa tela com pelo menos 1024px de largura
- **THEN** o painel de informações ocupa aproximadamente um terço da largura útil, e a timeline ocupa o espaço restante

### Requirement: Lista e Kanban de chamados têm contêiner visível
A fila de chamados, em qualquer uma das visões (lista ou Kanban), SHALL apresentar filtros, conteúdo e paginação dentro de um contêiner com borda visível, distinto do fundo da página.

#### Scenario: Camada de card na fila
- **WHEN** a fila de chamados é exibida, em lista ou em Kanban
- **THEN** filtros, conteúdo e paginação aparecem dentro de um contêiner com borda visível
