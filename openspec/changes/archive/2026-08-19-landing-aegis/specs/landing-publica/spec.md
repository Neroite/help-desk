## Purpose

Define o comportamento observável da landing page pública do Aegis em `/` — o que ela
mostra, para quem, e os limites de honestidade da copy frente ao que o produto realmente
entrega hoje.

## ADDED Requirements

### Requirement: Landing pública em `/` para visitante anônimo
Um visitante sem sessão que acessa `/` SHALL ver a landing page do Aegis, não um
redirecionamento para `/login`. A landing SHALL ser navegável e legível sem qualquer
chamada autenticada.

#### Scenario: Visitante anônimo abre a raiz do site
- **WHEN** uma requisição sem sessão válida atinge `/`
- **THEN** o sistema SHALL responder com a landing page, com status 200, sem redirecionar

#### Scenario: Usuário autenticado abre a raiz do site
- **WHEN** uma requisição com sessão válida atinge `/`
- **THEN** o sistema SHALL redirecionar para o shell do papel do usuário (área interna para
  `admin`/`analista`, portal para `solicitante`), preservando o comportamento de
  redirecionamento por papel já definido em `autenticacao-acesso`

### Requirement: Rota `/landing` acessível em qualquer papel
O sistema SHALL servir a mesma landing page também em `/landing`, sem guarda de papel, para
que uma pessoa autenticada consiga alcançar a página — em `/` ela é redirecionada para o
shell do seu papel. `/landing` SHALL ficar fora do índice dos buscadores, para não competir
com `/` como conteúdo duplicado.

#### Scenario: Usuário autenticado abre `/landing`
- **WHEN** uma requisição com sessão válida de qualquer papel atinge `/landing`
- **THEN** o sistema SHALL responder com a landing page, com status 200, sem redirecionar
  para o shell do papel

#### Scenario: Indexação de `/landing`
- **WHEN** um robô de busca consulta as regras de indexação do site
- **THEN** `/landing` SHALL constar como não indexável, enquanto `/` permanece a rota
  canônica da landing

### Requirement: Copy restrita a funcionalidades entregues
A landing SHALL descrever apenas capacidades que o produto entrega nas fases já concluídas
do roadmap (motor de SLA com pausa que congela o prazo, priorização com recálculo, Kanban
em tempo real, timeline, apontamento de horas, anexos, avaliação por link, portal do
solicitante, isolamento de dados por empresa, papéis e status configuráveis, dashboard de
métricas com exportação em CSV). A landing NÃO SHALL apresentar como disponíveis
capacidades ainda não entregues (e-mail transacional, alerta automático de SLA) nem
capacidades inexistentes no produto (IA, chatbot, WhatsApp, telefone, base de conhecimento,
omnichannel).

A regra vale nas duas direções: a landing também NÃO SHALL declarar como indisponível uma
capacidade que o produto já entrega.

#### Scenario: FAQ é consultado sobre uma capacidade não entregue
- **WHEN** a seção de perguntas frequentes aborda e-mail transacional ou alertas
  automáticos de SLA
- **THEN** a resposta SHALL declarar explicitamente que a capacidade ainda não está
  disponível, em vez de omitir a pergunta ou insinuar disponibilidade

#### Scenario: FAQ é consultado sobre uma capacidade já entregue
- **WHEN** a seção de perguntas frequentes aborda dashboard, relatórios ou exportação
- **THEN** a resposta SHALL declarar que a capacidade está disponível, e NÃO SHALL
  descrevê-la como planejada ou não entregue

#### Scenario: FAQ é consultado sobre uma capacidade inexistente
- **WHEN** a seção de perguntas frequentes aborda IA, chatbot, WhatsApp ou telefone
- **THEN** a resposta SHALL declarar que o produto não oferece essa capacidade

### Requirement: Prova social sem números inventados
Enquanto o produto não possuir clientes, avaliações ou depoimentos reais apurados, a
landing NÃO SHALL exibir nenhum número de prova social (contagem de clientes, nota de
avaliação, depoimento, logo de cliente) como se fosse um dado real. Um valor de métrica
ainda não apurado SHALL ser visualmente identificável como pendente, e nunca renderizado
como um número concreto.

#### Scenario: Métrica de prova social ainda não apurada
- **WHEN** a seção de prova de escala é renderizada e uma métrica não tem valor real
  cadastrado
- **THEN** o sistema SHALL exibir um indicador de "ainda não publicado" no lugar de um
  número, e NÃO SHALL exibir um número fictício

#### Scenario: Nenhum depoimento ou logo de cliente cadastrado
- **WHEN** a lista de depoimentos ou de logos de clientes está vazia
- **THEN** a seção correspondente NÃO SHALL renderizar um placeholder genérico de
  depoimento ou logo — SHALL omitir a seção ou o bloco

### Requirement: Responsividade e acessibilidade mínima
A landing SHALL ser utilizável sem scroll horizontal nas larguras 375px, 768px, 1024px e
1440px, SHALL manter foco visível em todo elemento interativo, e SHALL respeitar a
preferência `prefers-reduced-motion` do visitante.

#### Scenario: Visitante com `prefers-reduced-motion` ativado
- **WHEN** o visitante tem a preferência de movimento reduzido ativada no sistema
- **THEN** a landing NÃO SHALL executar animações de entrada, e nenhum conteúdo SHALL
  permanecer invisível por depender de uma animação que não ocorreu

#### Scenario: Navegação por teclado até o FAQ
- **WHEN** um visitante navega a página inteira usando apenas o teclado
- **THEN** todo controle interativo, incluindo os itens do acordeão de perguntas
  frequentes, SHALL ser alcançável e operável, com foco sempre visível
