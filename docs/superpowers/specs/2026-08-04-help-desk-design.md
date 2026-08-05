# Help-Desk — Sistema de chamados estilo Milvus

## Context

Não existe código ainda. O repositório `Neroite/help-desk` foi criado e o clone local vive em `G:\Projetos\ClaudePro\Ticket`, com `main` publicada contendo apenas `README.md` e `.gitignore`.

O objetivo é um help desk no modelo **MSP**: uma equipe interna atende várias empresas-clientes. O problema que ele resolve é o de sempre nesse tipo de operação — chamados espalhados por e-mail e WhatsApp, sem número, sem prazo acordado, sem histórico de horas e sem qualquer medida de satisfação. O resultado esperado é um chamado numerado, com SLA medido em horário comercial, atendimento rastreável e nota do cliente no fim.

Este documento é o desenho validado com o usuário. A implementação sai dele em fases.

## Decisões fechadas

| Tema | Decisão |
|---|---|
| Modelo | MSP — 1 equipe interna, N empresas-clientes |
| Papéis | Admin, Analista, Solicitante (portal do cliente) |
| Expediente | 09:00–18:00, seg–sex, fixo e global |
| SLA | Por prioridade, tabela editável pelo Admin |
| Prioridade | Chamado nasce **sem** prioridade; analista define no triage |
| SLA sem prioridade | Vale a política padrão 2h/8h; ao definir prioridade, prazos recalculam a partir de `criado_em` |
| Pausa de SLA | `pausado` **e** `aguardando_aprovacao` congelam o relógio |
| Status | Catálogo fixo de 6 no código; empresa liga/desliga e renomeia |
| Numeração | Sequência global, `#1` em diante |
| Kanban | 6 colunas globais por padrão; ao filtrar empresa, só os status ativos dela |
| Stack | Next.js 15 (App Router, TS, Tailwind, shadcn/ui) + Supabase |

Status do catálogo: `aguardando_aprovacao`, `a_fazer`, `em_andamento`, `pausado`, `finalizado`, `cancelado`.
`finalizado` e `cancelado` são finais. `cancelado` não pede avaliação e sai das estatísticas de SLA.

## Modelo de dados

```
empresa            id, nome, cnpj, ativo
usuario            id, email, nome, papel(admin|analista|solicitante), empresa_id, ativo
empresa_status     empresa_id, status_key, ativo, rotulo, ordem
sla_policy         prioridade(null=padrão), minutos_resposta, minutos_solucao
categoria_atendimento   id, nome                  -- Remoto, Presencial, Telefone
categoria_problema      id, nome, pai_id          -- 2 níveis
ticket             numero(serial global), titulo, descricao, empresa_id, solicitante_id,
                   analista_id, status_key, prioridade(null), cat_atendimento_id,
                   cat_problema_id, criado_em, primeira_resposta_em, finalizado_em,
                   sla_resposta_vence_em, sla_solucao_vence_em,
                   sla_pausado_em, sla_minutos_pausados
comentario         ticket_id, autor_id, corpo, interno(bool)
apontamento_horas  ticket_id, analista_id, inicio, fim, minutos, descricao, faturavel
anexo              ticket_id|comentario_id, storage_path, nome, tamanho
avaliacao          ticket_id(unique), estrelas 1-5, comentario
ticket_evento      ticket_id, tipo, de, para, autor_id, criado_em
```

`status_key` é enum TypeScript + enum Postgres. A semântica (pausa SLA / é final) mora no código, nunca na tabela `empresa_status` — assim nenhuma configuração de empresa consegue quebrar o cálculo de prazo.

## Motor de SLA

O único ponto do sistema com regra de negócio densa. Isolado em módulo puro, sem acesso a banco:

**`lib/sla/calendario.ts`**
- `adicionarMinutosUteis(inicio: Date, minutos: number): Date`
- `minutosUteisEntre(a: Date, b: Date): number`

**`lib/sla/prazos.ts`**
- `calcularPrazos(criadoEm, politica)` → `{ respostaVenceEm, solucaoVenceEm }`
- `aplicarPausa(ticket, agora)` / `aplicarRetomada(ticket, agora)`
- `recalcularPorPrioridade(ticket, novaPolitica)` — usado no triage

Regras: prazo é gravado como timestamp absoluto. Pausa grava `sla_pausado_em`; retomada soma os minutos úteis decorridos em `sla_minutos_pausados` e empurra os dois prazos. Fora do expediente o relógio não anda.

Casos que os testes precisam cobrir: abertura às 17:30 (transborda pro dia seguinte), abertura sexta 17:00 com 8h (cai na segunda), abertura fora do expediente (conta a partir das 09:00 seguintes), pausa que atravessa a noite, pausa que atravessa o fim de semana, triage recalculando prazo de chamado já pausado.

## Isolamento e segurança

RLS no Postgres, não só checagem no front:
- Solicitante lê e escreve apenas em tickets da própria `empresa_id`
- `comentario.interno = true` invisível pro solicitante — na policy
- Analista e Admin leem todas as empresas; só Admin escreve em configuração
- Anexos: bucket privado, acesso por signed URL derivado da mesma regra do ticket

## Telas

- **Auth** — login único, redireciona por papel
- **Admin** — empresas, usuários, categorias, tabela `sla_policy`, status por empresa
- **Analista** — fila de chamados com toggle lista ⇄ kanban; filtros por operador, cliente, status, prioridade, categoria
- **Solicitante** — abrir chamado, meus chamados, detalhe sem notas internas, avaliar
- **Detalhe do chamado** — cabeçalho (nº, empresa, solicitante, analista, prioridade, status, dois badges de SLA com contagem regressiva); timeline central com comentários e eventos de status intercalados; painel lateral com horas, timer, anexos e categorias

## Fases

Cada fase entrega algo usável e é commitada separadamente.

| # | Entrega |
|---|---|
| 0 | Scaffold Next.js 15 + Supabase, auth 3 papéis, migrations, RLS, seed |
| 1 | **Motor de SLA + testes** — antes de qualquer tela de ticket |
| 2 | CRUD de chamado, lista, filtros, detalhe, comentários, timeline |
| 3 | Kanban + drag-drop + realtime |
| 4 | Apontamento de horas, timer, flag faturável |
| 5 | Anexos via Supabase Storage |
| 6 | Avaliação 5 estrelas |
| 7 | E-mail transacional + job de alerta de SLA |
| 8 | Dashboard, relatórios, exportação CSV |

A fase 1 precede as telas de propósito: acertar o calendário de SLA em teste puro custa uma fração de descobrir o erro pela interface.

## Verificação

- `npm test` — Vitest no motor de SLA e nas regras de transição de status. É a suíte que importa; roda sem banco e sem servidor.
- `npm run test:e2e` — Playwright, um fluxo por papel: solicitante abre → analista faz triage e atende → finaliza → solicitante avalia.
- `npm run dev` + seed com 2 empresas, 3 analistas e ~20 chamados em status variados, para conferir kanban, filtros e badges de SLA na tela.
- MCP Supabase: `list_tables` e `get_advisors` após cada migration, para confirmar RLS ativa em todas as tabelas.

---

# Design de Interface

Estilo base: **Data-Dense Dashboard** com disciplina de grid Swiss. É a categoria que a base de UI aponta para painel operacional: grid de 12 colunas, padding curto, linha de tabela de 36px, densidade alta sem virar ruído. O analista passa o dia nessa tela — cada scroll evitado é tempo de atendimento ganho.

## 1. Fluxo de usuários

**Solicitante**
```
login → portal (meus chamados) → [Abrir chamado]
  → formulário curto: título, descrição, categoria do problema, anexo
  → chamado criado #N, status inicial da empresa, SEM prioridade
  → acompanha: timeline, comenta, recebe e-mail a cada resposta
  → finalizado → e-mail com link → avalia 1-5 estrelas + comentário
```
O formulário de abertura não pede prioridade nem categoria de atendimento — isso é triage. Pedir ao cliente o que ele não sabe responder só gera dado ruim.

**Analista**
```
login → fila de chamados (lista, filtro padrão: meus + não atribuídos)
  → abre chamado sem prioridade → TRIAGE: define prioridade + categoria de
    atendimento + assume → prazos de SLA recalculam na hora, badge atualiza
  → responde (comentário público) → primeira_resposta_em grava, SLA de resposta encerra
  → inicia timer → trabalha → para timer → lançamento de horas gravado
  → pausa quando depende do cliente (relógio congela, badge fica cinza)
  → finaliza → e-mail de avaliação dispara
```

**Admin**
```
login → dashboard → gere: empresas, usuários, categorias, tabela de SLA,
  status ativos por empresa → relatórios, exporta CSV
```

**Regra de navegação atravessando os três**: todo estado de fila vive na URL (`/chamados?view=kanban&empresa=12&status=em_andamento&analista=eu`). Filtro montado é link compartilhável e o botão voltar do navegador funciona. Sem isso, analista não consegue mandar "olha essa fila" pro colega.

## 2. Arquitetura das telas

```
/login

(app)  — Admin + Analista, shell com sidebar
  /chamados                  fila. ?view=lista|kanban, filtros em query params
  /chamados/novo             abertura em nome do cliente
  /chamados/[numero]         detalhe
  /dashboard                 KPIs e relatórios
  /admin/empresas            CRUD + status ativos + rótulos da empresa
  /admin/usuarios            CRUD + papel + vínculo com empresa
  /admin/categorias          atendimento + problema (2 níveis)
  /admin/sla                 tabela prioridade × resposta/solução

(portal) — Solicitante, shell enxuto sem sidebar
  /portal                    meus chamados (cards, sem kanban)
  /portal/novo               abertura
  /portal/chamados/[numero]  detalhe sem notas internas, sem horas
  /avaliar/[token]           avaliação por link de e-mail, sem exigir login
```

Dois shells em vez de um com condicionais: o solicitante nunca deve ver a moldura de ferramenta interna, e separar os layouts elimina toda uma classe de vazamento de UI por `if (papel === ...)` esquecido.

**Detalhe do chamado** — três regiões, proporção 
`sidebar 240 | conteúdo fluido | painel 320`:

```
┌──────────────────────────────────────────────────────────────┐
│ #482  Impressora do financeiro não imprime                   │
│ ACME Ltda · Maria Silva · João (analista)                    │
│ [Em andamento ▾] [Alta ▾]   Resposta ✓ 12min  Solução ⏱ 4h12 │
├──────────────────────────────────┬───────────────────────────┤
│ TIMELINE                         │ HORAS         2h30 (2h fat)│
│  ● Maria abriu o chamado   09:12 │  ▶ Iniciar timer          │
│  ● João assumiu            09:20 │  ─────────────────────    │
│  💬 João: "Já verificou..." 09:24 │ ANEXOS               (3)  │
│  ⚠ Status → Pausado        11:00 │ CATEGORIAS                │
│  💬 Maria: "Verifiquei..."  14:30 │  Atendimento: Remoto      │
├──────────────────────────────────┤  Problema: HW > Impressora│
│ [ Responder ] [ Nota interna ]   │                           │
└──────────────────────────────────┴───────────────────────────┘
```

Timeline intercala comentários e eventos de status na mesma linha do tempo. Separar em duas abas ("comentários" e "histórico") destrói a leitura de causa — o "por que ficou parado 3h" está justamente na costura entre os dois.

Nota interna é visualmente distinta (fundo âmbar claro + ícone de cadeado + rótulo "Interno"), não só por cor.

## 3. Navegação

**Desktop** — sidebar fixa 240px, item ativo com fundo sólido e barra de 2px à esquerda.

| Papel | Itens |
|---|---|
| Analista | Chamados · Meus chamados · Dashboard |
| Admin | Chamados · Meus chamados · Dashboard · **Configurações** (submenu: Empresas, Usuários, Categorias, SLA) |
| Solicitante | topbar: Meus chamados · Abrir chamado · Sair |

Topbar (56px, sticky): busca global por número/título, seletor de empresa, notificações, avatar.

Busca aceita `482` ou `#482` e vai direto pro chamado. É o atalho mais usado numa operação de suporte — alguém liga citando o número.

**Mobile** — sidebar vira drawer; bottom nav com no máximo 4: Chamados · Novo · Dashboard · Menu.

Breadcrumb só em `/admin/*`, onde existem 3 níveis. Na fila e no detalhe seria decoração.

## 4. Design System

```css
/* Cor — base neutra fria, azul para ação, âmbar para atenção */
--color-primary:      #1E40AF;   --color-on-primary: #FFFFFF;
--color-secondary:    #3B82F6;
--color-accent:       #D97706;   /* ajustado de #F59E0B para atingir 3:1 */
--color-background:   #F8FAFC;   --color-surface:    #FFFFFF;
--color-foreground:   #0F172A;   --color-muted-fg:   #64748B;
--color-border:       #E2E8F0;   --color-destructive:#DC2626;
--color-ring:         #1E40AF;

/* Status do chamado — cada um também carrega ícone próprio */
--status-aguardando:  #D97706;   /* relógio    */
--status-a-fazer:     #64748B;   /* círculo    */
--status-andamento:   #2563EB;   /* play       */
--status-pausado:     #7C3AED;   /* pause      */
--status-finalizado:  #059669;   /* check      */
--status-cancelado:   #94A3B8;   /* x          */

/* SLA — semáforo, sempre acompanhado de texto e ícone */
--sla-ok:       #059669;   /* > 50% do prazo restante  */
--sla-atencao:  #D97706;   /* < 50%                    */
--sla-critico:  #DC2626;   /* < 10% ou menos de 15min  */
--sla-estourado:#991B1B;   /* fundo sólido, texto branco */
--sla-pausado:  #64748B;   /* congelado                */

/* Densidade — dial 8/10 */
--space-1: 4px;  --space-2: 8px;  --space-3: 12px;
--space-4: 16px; --space-6: 24px; --space-8: 32px;
--sidebar-w: 240px;  --topbar-h: 56px;
--row-h: 36px;       --card-pad: 12px;  --grid-gap: 8px;
--radius: 6px;

/* Tipografia */
--font-ui:   'Fira Sans', system-ui, sans-serif;
--font-mono: 'Fira Code', ui-monospace, monospace;
--text-xs: 12px; --text-sm: 13px; --text-base: 14px;
--text-lg: 16px; --text-xl: 20px; --text-2xl: 24px;
/* corpo da interface a 14px, tabela a 13px, nunca abaixo de 12px */
```

`--font-mono` com `font-variant-numeric: tabular-nums` para número do chamado, contagem de SLA e horas. Sem largura fixa de dígito, o contador de SLA treme a cada atualização — desconforto pequeno e constante numa tela que fica aberta o dia inteiro.

Contraste: todos os pares de status e SLA são usados como texto escuro sobre fundo claro da mesma matiz (ex: `#D97706` sobre `#FEF3C7`), acima de 4.5:1. Cor nunca é o único sinal — status e SLA sempre trazem ícone e rótulo. Daltônico precisa distinguir "pausado" de "em andamento" sem depender de matiz.

Dark mode desde o começo, via tokens semânticos. Suporte técnico trabalha de madrugada; retrofit de dark mode depois custa muito mais que declarar as duas paletas agora.

Ícones: **Lucide** (já vem no ecossistema shadcn), 16px em tabela, 20px em navegação. Zero emoji.

## 5. Componentes

**Domínio** (`components/chamado/`)
| Componente | Responsabilidade |
|---|---|
| `StatusBadge` | Rótulo da empresa + cor + ícone. Variante `select` para trocar status inline |
| `PrioridadeBadge` | Inclui o estado vazio "sem prioridade", que é o gatilho visual de triage |
| `SlaBadge` | Contagem regressiva, semáforo, estado pausado/estourado |
| `TicketRow` | Linha de tabela, 36px |
| `TicketCard` | Card — serve kanban e lista mobile |
| `KanbanBoard` / `KanbanColumn` | Colunas com contador; drag-drop via `dnd-kit` |
| `TicketTimeline` | Comentários + eventos intercalados |
| `ComentarioComposer` | Alterna público/interno; interno muda a cor da borda |
| `ApontamentoHoras` | Lista de lançamentos + timer + flag faturável |
| `AnexoUploader` / `AnexoList` | Drop zone, preview de imagem, signed URL |
| `AvaliacaoEstrelas` | 1-5, teclado navegável, também em modo leitura |
| `FiltroBar` | Operador, cliente, status, prioridade, categoria — sincronizado com a URL |

**Padrão de relógio compartilhado**: um único `SlaClockProvider` no layout emite um tick a cada 30s e todos os `SlaBadge` consomem. Cem chamados na tela com cem `setInterval` de 1s é jank garantido, e a diferença entre atualizar de segundo em segundo e de 30 em 30 é invisível num prazo de horas.

**Base**: shadcn/ui — `Sidebar` (com `SidebarProvider` no layout), `Table` + TanStack Table para ordenação e multi-seleção, `Dialog`, `Sheet` (drawer mobile), `Select`, `Badge`, `Tabs`, `Toast`.

Instalação e composição desses componentes passa pela skill `shadcn` (init, add, busca no registry), não por cópia manual de código. Os tokens da seção 4 entram como tema em `globals.css` durante a fase 0, antes de qualquer componente de domínio existir.

**Estados obrigatórios em toda lista**: carregando (skeleton com a altura final da linha, sem pulo de layout), vazio (mensagem + ação, nunca área branca), erro (com botão de repetir). Fila vazia diz "Nenhum chamado com esses filtros — limpar filtros", não fica em branco.

**Ação em lote**: coluna de checkbox na lista, barra de ação flutuante ao selecionar (atribuir analista, mudar status, mudar prioridade). Triage de 20 chamados um a um é o gargalo diário do analista.

## 6. Responsividade

Mobile-first, quatro pontos de verificação: **375 · 768 · 1024 · 1440**.

| Faixa | Comportamento |
|---|---|
| < 768 | Sidebar vira drawer. Bottom nav (4 itens). Tabela vira lista de `TicketCard`. Kanban vira scroll horizontal com `scroll-snap`, uma coluna por vez. Detalhe do chamado vira abas: Timeline · Horas · Detalhes. Filtros num `Sheet` inferior |
| 768–1023 | Sidebar colapsa em ícones (56px). Tabela reduzida às colunas nº, título, status, SLA. Detalhe em 2 colunas, painel lateral vira seção abaixo da timeline |
| 1024–1439 | Sidebar 240px. Tabela completa. Detalhe em 3 regiões |
| ≥ 1440 | Conteúdo com largura máxima de 1600px, centralizado. Kanban mostra 6 colunas sem scroll |

Tabela sempre dentro de `overflow-x-auto`; o corpo da página nunca rola na horizontal. Cabeçalho da tabela e barra de filtro ficam `sticky` — rolar 80 chamados e perder a referência da coluna é erro de leitura garantido.

Alvo de toque mínimo 44×44px no mobile: o badge de status vira botão de altura cheia, não um chip de 20px.

Drag-drop do kanban não é o único caminho para mudar status — no mobile e para teclado, o `StatusBadge` em modo select faz o mesmo. Interação que só existe via arrastar exclui teclado e leitor de tela.

## 7. Regras de qualidade a verificar antes de entregar cada tela

- [ ] Contraste de texto ≥ 4.5:1 em light e dark
- [ ] Foco visível em todo elemento interativo (nunca remover o anel)
- [ ] Cor jamais é o único portador de informação (status, SLA, nota interna)
- [ ] `prefers-reduced-motion` respeitado; transições entre 150–300ms
- [ ] Sem scroll horizontal em 375px
- [ ] Filtros e visão refletidos na URL; botão voltar funciona
- [ ] Estados de carregando / vazio / erro em toda lista
- [ ] Hierarquia de headings sequencial (h1 → h2 → h3)
- [ ] Ícones SVG (Lucide), nenhum emoji
- [ ] `cursor-pointer` em tudo que é clicável
