## ADDED Requirements

### Requirement: Seleção de categoria de problema no chamado usa drill-down
O seletor de categoria de problema usado no chamado (na abertura e no detalhe) SHALL exibir inicialmente apenas as categorias raiz, revelando as subcategorias de uma categoria raiz somente depois que o usuário a seleciona.

#### Scenario: Apenas raízes visíveis inicialmente
- **WHEN** o seletor de categoria de problema do chamado é aberto
- **THEN** apenas as categorias raiz aparecem como opções

#### Scenario: Selecionar raiz com subcategorias revela as subcategorias
- **WHEN** o usuário seleciona, no seletor de categoria de problema, uma categoria raiz que tem subcategorias
- **THEN** o sistema exibe as subcategorias dessa raiz para escolha, sem gravar ainda uma categoria final

#### Scenario: Raiz sem subcategorias é selecionável diretamente
- **WHEN** o usuário seleciona uma categoria raiz que não tem subcategorias
- **THEN** o sistema grava essa categoria raiz como a categoria de problema do chamado
