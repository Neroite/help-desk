## Purpose

Fornece um conjunto de agentes Claude Code e um protocolo de coordenação que audita o código do help desk, separa bug real de stub pré-backend de enfeite não-declarado com evidência citável, e só aplica correções depois de aprovação humana explícita.

## ADDED Requirements

### Requirement: Divisão de papéis entre orquestrador e subagentes
O sistema SHALL definir um agente orquestrador (`revisao-lead`, model opus) e seis subagentes de execução (model sonnet: `auditor-intencao`, `auditor-bugs`, `auditor-enfeites`, `corretor-lote`, `verificador-build`, `verificador-runtime`). Nenhum subagente SHALL usar `model: inherit` ou qualquer valor que não seja `sonnet` literal. Apenas o orquestrador SHALL ter permissão para falar com o usuário, decidir a classificação final de um achado, escrever o relatório e criar commits.

#### Scenario: Subagente tenta herdar o modelo do orquestrador
- **WHEN** um arquivo de subagente declara `model: inherit` ou `model: opus`
- **THEN** a definição é inválida e SHALL ser corrigida para `model: sonnet` antes de uso

#### Scenario: Auditor tenta aplicar uma correção
- **WHEN** um dos agentes `auditor-intencao`, `auditor-bugs` ou `auditor-enfeites` é invocado
- **THEN** ele SHALL operar somente com ferramentas de leitura (`Read`, `Glob`, `Grep`, `Bash`) e não SHALL possuir `Edit` nem `Write` sobre código-fonte

### Requirement: Classificação de achados em três categorias com evidência
Todo achado reportado pelos auditores SHALL ser classificado em exatamente uma de três categorias — bug real, stub pré-backend declarado, ou enfeite não-declarado — e SHALL incluir uma citação literal do trecho de código (arquivo, linha, texto) que sustenta a classificação. O sistema SHALL usar um agente dedicado (`auditor-intencao`) para levantar, antes das demais auditorias, o inventário de stubs que o código ou a documentação de design já declaram como pré-backend.

#### Scenario: Trecho citado não corresponde ao arquivo real
- **WHEN** o orquestrador re-verifica a citação de um achado com `Grep` ou `Read` e o texto não é encontrado no arquivo e linha indicados
- **THEN** o achado SHALL ser descartado e não SHALL entrar no inventário final

#### Scenario: Controle sem handler declarado como stub de fase futura
- **WHEN** um auditor de bugs ou de enfeites encontra um controle sem efeito (ex.: botão sem `onClick`) cujo arquivo contém um comentário ou a documentação de design associa aquele controle a uma fase futura do roadmap
- **THEN** o achado SHALL ser classificado como stub pré-backend declarado, não como enfeite

#### Scenario: Controle sem handler e sem qualquer declaração de stub
- **WHEN** um controle não produz nenhum efeito observável e nenhuma citação de código ou de spec o associa a uma fase futura
- **THEN** o achado SHALL ser classificado como enfeite não-declarado

### Requirement: Parada obrigatória para aprovação humana antes de qualquer correção
O orquestrador SHALL produzir um inventário de achados (bugs, stubs, enfeites) e interromper a execução aguardando aprovação explícita do usuário antes de despachar qualquer subagente com permissão de escrita. Nenhuma correção de código SHALL ser aplicada sem que o achado correspondente tenha sido aprovado.

#### Scenario: Auditoria concluída sem interação do usuário
- **WHEN** os três auditores terminam e o orquestrador termina a triagem
- **THEN** o orquestrador SHALL escrever o inventário em disco e aguardar resposta do usuário antes de iniciar a fase de correção

#### Scenario: Usuário aprova apenas parte dos achados
- **WHEN** o usuário aprova um subconjunto dos achados listados no inventário
- **THEN** somente os achados aprovados SHALL ser incluídos nos lotes despachados para correção

### Requirement: Correções aplicadas em lotes de arquivos disjuntos
Antes de despachar qualquer corretor, o orquestrador SHALL particionar os achados aprovados em lotes de modo que cada arquivo do repositório pertença a exatamente um lote (união dos conjuntos de arquivos afetados por achados que compartilham algum arquivo). Cada instância do agente `corretor-lote` SHALL declarar a lista fechada de arquivos que possui com exclusividade e não SHALL editar nenhum arquivo fora dessa lista.

#### Scenario: Dois achados aprovados compartilham um arquivo
- **WHEN** dois achados aprovados têm o mesmo arquivo em `arquivos_afetados`
- **THEN** ambos SHALL ser atribuídos ao mesmo lote e processados pela mesma instância de `corretor-lote`

#### Scenario: Corretor tenta tocar um arquivo fora do seu lote
- **WHEN** uma instância de `corretor-lote` teria de editar um arquivo não listado em `ARQUIVOS_QUE_VOCE_POSSUI`
- **THEN** a edição SHALL ser recusada e reportada como pendência, não aplicada

### Requirement: Verificação estática e de runtime antes de declarar sucesso
Após cada rodada de correção, o sistema SHALL executar uma verificação estática (checagem de tipos, lint, build) comparada contra uma linha de base capturada antes de qualquer edição, e SHALL considerar falha qualquer regressão em relação a essa linha de base — não apenas a ausência de novos erros. Quando a verificação estática aprovar, o sistema SHALL executar uma verificação de runtime navegando as rotas da aplicação e capturando erros de console, avisos de hidratação e páginas não encontradas.

#### Scenario: Build fica verde mas piora um aviso pré-existente
- **WHEN** a contagem de avisos de lint após a correção é maior que a contagem registrada na linha de base
- **THEN** a verificação SHALL reportar REJECT mesmo que o build tenha terminado com sucesso

#### Scenario: Rota renderiza sem erro de compilação mas quebra em runtime
- **WHEN** o build estático termina sem erro mas uma rota apresenta erro de console, aviso de hidratação ou 404 inesperado durante a navegação
- **THEN** a verificação de runtime SHALL reportar essa rota como falha, independentemente do resultado do build

### Requirement: Relatório versionado com categorias e lacunas de roadmap
O sistema SHALL produzir um relatório versionado em `docs/revisao/<data>/` contendo, no mínimo: a linha de base capturada antes de qualquer edição, o inventário de achados classificado nas três categorias, e — quando o repositório tiver uma spec de roadmap por fases — uma seção que mapeia lacunas de backend contra as fases dessa spec, sem contá-las como bug.

#### Scenario: Repositório não tem backend implementado
- **WHEN** uma funcionalidade prevista na spec de design depende de uma fase do roadmap que ainda não foi implementada (ex.: persistência, autenticação)
- **THEN** essa lacuna SHALL aparecer na seção de stubs pré-backend mapeada à fase correspondente, e não SHALL ser contada como bug nem como enfeite
