# identidade-visual Specification

## Purpose
TBD - created by archiving change marca-aegis. Update Purpose after archive.
## Requirements
### Requirement: Marca Aegis consistente em todo shell
O produto SHALL se apresentar como "Aegis" — sem o descritor "Help Desk" — em todo ponto
de marca visível: sidebar da área da equipe, topbar do portal do solicitante, tela de
login (incluindo o cluster animado) e metadados da página (título da aba, ícone).

#### Scenario: Sidebar da equipe mostra a marca Aegis
- **WHEN** um membro da equipe acessa qualquer tela da área interna
- **THEN** a sidebar exibe o ícone do escudo Aegis e o texto "Aegis", não um monograma
  genérico nem "Help-Desk"

#### Scenario: Portal do solicitante mostra a marca Aegis
- **WHEN** um solicitante acessa o portal
- **THEN** a topbar exibe o ícone do escudo Aegis junto ao texto "Aegis"

#### Scenario: Login mostra a marca Aegis
- **WHEN** a tela de login é exibida
- **THEN** o ícone central do cluster animado e o texto de marca são o escudo/"Aegis", e o
  título da aba do navegador mostra "Aegis"

