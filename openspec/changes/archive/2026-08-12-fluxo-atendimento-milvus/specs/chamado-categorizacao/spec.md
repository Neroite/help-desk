## Purpose

Torna a hierarquia de categorias de problema navegável e gerenciável de ponta a ponta, e permite que a categoria de um chamado seja definida ou corrigida depois da criação, não só no momento de abrir o chamado.

## ADDED Requirements

### Requirement: Árvore de categorias de problema com expansão
A tela de administração de categorias SHALL exibir categorias de problema como uma árvore de até dois níveis, onde as subcategorias de uma categoria pai só ficam visíveis depois que o administrador a expande.

#### Scenario: Subcategorias ocultas por padrão
- **WHEN** a tela de categorias é exibida
- **THEN** apenas as categorias raiz aparecem, com um controle indicando quais têm subcategorias

#### Scenario: Expandir revela subcategorias
- **WHEN** o administrador aciona o controle de expandir de uma categoria raiz com subcategorias
- **THEN** as subcategorias dessa categoria aparecem logo abaixo dela

#### Scenario: Recolher oculta subcategorias
- **WHEN** o administrador aciona o controle de recolher de uma categoria expandida
- **THEN** as subcategorias voltam a ficar ocultas

### Requirement: Exclusão de categoria de problema
O sistema SHALL permitir excluir uma categoria de problema apenas quando ela não estiver vinculada a nenhum chamado e não tiver subcategorias, informando o motivo do bloqueio quando aplicável.

#### Scenario: Exclusão bem-sucedida
- **WHEN** o administrador exclui uma categoria de problema sem chamados vinculados e sem subcategorias
- **THEN** a categoria é removida e deixa de aparecer na árvore

#### Scenario: Bloqueio por uso em chamado
- **WHEN** o administrador tenta excluir uma categoria de problema vinculada a pelo menos um chamado
- **THEN** o sistema recusa a exclusão e informa que a categoria está em uso

#### Scenario: Bloqueio por subcategorias existentes
- **WHEN** o administrador tenta excluir uma categoria de problema que tem subcategorias
- **THEN** o sistema recusa a exclusão e informa que existem subcategorias vinculadas a ela

### Requirement: Categoria editável no chamado
O sistema SHALL permitir que a categoria de atendimento e a categoria de problema de um chamado sejam definidas ou alteradas a partir da tela de detalhe do chamado, a qualquer momento após sua criação.

#### Scenario: Selecionar categoria em chamado existente
- **WHEN** um analista abre o detalhe de um chamado já criado
- **THEN** ele pode selecionar ou alterar a categoria de atendimento e a categoria de problema desse chamado

#### Scenario: Mudança de categoria persiste
- **WHEN** um analista altera a categoria de um chamado e a página do chamado é recarregada
- **THEN** a categoria exibida reflete o valor alterado
