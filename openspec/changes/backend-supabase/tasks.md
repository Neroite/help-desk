## 1. Projeto Supabase e configuração

- [ ] 1.1 Criar projeto Supabase dedicado ao help desk (região `sa-east-1`) e registrar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`
- [ ] 1.2 Criar `.env.example` com os nomes das variáveis (sem valores) e confirmar que `.gitignore` cobre `.env*.local`
- [ ] 1.3 Instalar `@supabase/supabase-js`, `@supabase/ssr` e o CLI `supabase` (dev); inicializar `supabase/` com `supabase init`
- [ ] 1.4 Instalar Vitest + plugin React e adicionar os scripts `test`, `test:watch` e `db:types` ao `package.json`; `npm test` roda vazio sem erro
- [ ] 1.5 Criar `lib/supabase/client.ts`, `lib/supabase/server.ts` e `lib/supabase/middleware.ts` (sessão via cookie); a chave `service_role` fica isolada em `lib/supabase/admin.ts`, importável apenas por scripts

## 2. Schema e migrations

- [ ] 2.1 Migration de enums Postgres `status_key` e `prioridade` e `papel`, espelhando `lib/types.ts`
- [ ] 2.2 Migration das tabelas de cadastro: `empresa`, `usuario`, `empresa_status`, `sla_policy`, `categoria_atendimento`, `categoria_problema` — com unicidade de CNPJ e de e-mail
- [ ] 2.3 Migration de `ticket` com `numero` como identity global, prazos de SLA, `sla_pausado_em`, `sla_minutos_pausados` e `avaliacao_token` único
- [ ] 2.4 Migration das tabelas satélite: `comentario`, `ticket_evento`, `apontamento_horas`, `anexo`, `avaliacao` (única por chamado)
- [ ] 2.5 Migration de restrições de integridade: categoria de problema com no máximo dois níveis, `fim >= inicio` em apontamento, estrelas entre 1 e 5, solicitante obrigatoriamente com empresa
- [ ] 2.6 Índices para os filtros da fila (`empresa_id`, `analista_id`, `status_key`, `prioridade`) e para busca por `numero`
- [ ] 2.7 Gerar tipos do banco (`db:types`) e conferir com `lib/types.ts`; `npm run typecheck` limpo

## 3. Autorização no banco

- [ ] 3.1 Custom access token hook que injeta `papel` e `empresa_id` nos claims; funções `auth_papel()` e `auth_empresa_id()` marcadas `stable`
- [ ] 3.2 Habilitar RLS em todas as tabelas e escrever as policies de leitura por papel (solicitante restrito à própria empresa; analista e admin veem tudo)
- [ ] 3.3 Policies de escrita: solicitante só abre/comenta em chamado da própria empresa; configuração gravável apenas por admin
- [ ] 3.4 Policy que torna `comentario.interno = true` invisível para solicitante e impede que ele crie comentário interno
- [ ] 3.5 Policies de `apontamento_horas` restritas a admin e analista (leitura e escrita)
- [ ] 3.6 Criar bucket privado `anexos` e policies de Storage espelhando a visibilidade do chamado correspondente
- [ ] 3.7 Funções `SECURITY DEFINER` para avaliação por token: leitura mínima do chamado e gravação da nota, ambas validando o token internamente
- [ ] 3.8 Rodar `get_advisors` do MCP Supabase e corrigir todo alerta de RLS antes de seguir
- [ ] 3.9 Roteiro manual de acesso por papel: solicitante da empresa A tentando ler chamado da empresa B, ler nota interna, ler horas e gravar em configuração — todas negadas

## 4. Seed

- [ ] 4.1 Script de seed criando os usuários dos três papéis com senha lida de variável de ambiente
- [ ] 4.2 `supabase/seed.sql` com o cadastro derivado de `lib/mock/data.ts`: 2 empresas, categorias, política de SLA (padrão + 4 prioridades), status ativos por empresa
- [ ] 4.3 Seed de ~20 chamados em status variados, com comentários, eventos, horas e um chamado já avaliado, para conferir fila, kanban e badges de SLA na tela

## 5. Motor de SLA

- [ ] 5.1 `lib/sla/calendario.ts`: `adicionarMinutosUteis` e `minutosUteisEntre`, expediente 09:00–18:00 seg–sex em `America/Sao_Paulo`
- [ ] 5.2 Testes do calendário cobrindo os cenários da spec `motor-sla`: abertura às 17:30, sexta 17:00 com 8h, abertura fora do expediente, intervalo que atravessa noite e fim de semana
- [ ] 5.3 `lib/sla/prazos.ts`: `calcularPrazos`, `aplicarPausa`, `aplicarRetomada` e `recalcularPorPrioridade`
- [ ] 5.4 Testes de prazos: chamado sem prioridade usando a política padrão, recálculo na triagem, recálculo de chamado com pausa acumulada, prioridade alterada após a primeira resposta
- [ ] 5.5 Semântica de pausa e de status final derivada dos enums do código (`STATUS_PAUSA_SLA`, `STATUS_FINAIS`), com teste garantindo que rótulo de empresa não altera o cálculo

## 6. Autenticação

- [ ] 6.1 Tela `/login` com e-mail e senha, mensagem de erro genérica e estado de carregamento
- [ ] 6.2 `middleware.ts` protegendo as rotas, preservando o destino original e liberando `/login` e `/avaliar/[token]`
- [ ] 6.3 Redirecionamento por papel após o login e bloqueio de solicitante nas rotas de `(app)`, com redirecionamento para o portal
- [ ] 6.4 Sessão exibida no shell: avatar e nome reais nos layouts `(app)` e `(portal)`, com ação de sair
- [ ] 6.5 Ação de escrita com sessão expirada recusa a gravação e leva ao login sem gravação parcial

## 7. Chamados — leitura

- [ ] 7.1 `lib/data/chamados.ts` com as consultas de fila e detalhe, convertendo linhas do banco para os tipos de `lib/types.ts`
- [ ] 7.2 Fila `(app)/chamados` como Server Component lendo do banco, com os filtros da URL aplicados na consulta (empresa, responsável, status, prioridade)
- [ ] 7.3 Estados de carregando, vazio (com ação de limpar filtros) e erro (com repetir) na fila, em lista e em kanban
- [ ] 7.4 Detalhe `(app)/chamados/[numero]` como Server Component: cabeçalho, timeline com comentários e eventos intercalados, painel lateral — dados reais, sem `lib/mock/data`
- [ ] 7.5 Busca global por `482` e `#482` levando ao detalhe, respeitando a visibilidade do papel
- [ ] 7.6 Kanban lendo os status ativos da empresa quando a fila está filtrada por empresa, com os rótulos dela

## 8. Chamados — escrita

- [ ] 8.1 Server Action de abertura de chamado (portal e interno) com validação por campo, numeração pelo banco e cálculo inicial de prazos
- [ ] 8.2 Server Action de troca de status: valida status ativo da empresa, grava evento, aplica pausa/retomada de SLA e grava finalização
- [ ] 8.3 Server Action de triagem: prioridade, categoria de atendimento e atribuição, com recálculo de prazos e evento por alteração
- [ ] 8.4 Server Action de comentário público e interno, com gravação da primeira resposta quando aplicável
- [ ] 8.5 Ilhas cliente com atualização otimista e toast para status, prioridade e comentário, substituindo o `useState` de protótipo em `app/(app)/chamados/[numero]/page.tsx`
- [ ] 8.6 Drag-drop do kanban chamando a mesma Action de status, com reversão visual em caso de falha

## 9. Portal do solicitante

- [ ] 9.1 `/portal` listando apenas os chamados da empresa do solicitante, com dados reais
- [ ] 9.2 `/portal/novo` gravando pelo Action de abertura, sem pedir prioridade nem categoria de atendimento
- [ ] 9.3 `/portal/chamados/[numero]` sem notas internas e sem seção de horas, confirmado também pela consulta ao banco

## 10. Apontamento de horas

- [ ] 10.1 Server Actions de lançamento manual, início e parada de timer, com recusa de segundo timer aberto no mesmo chamado
- [ ] 10.2 Timer persistido: lançamento em aberto sobrevive a recarregar a página e é retomado na tela a partir do início gravado
- [ ] 10.3 Totais de minutos e de faturável por chamado exibidos a partir do banco

## 11. Anexos

- [ ] 11.1 Upload de anexo na abertura do chamado e no comentário, com limite de 10 MB e mensagem de recusa
- [ ] 11.2 Gravação do registro de anexo apenas após o arquivo ser aceito pelo armazenamento, sem registro órfão em caso de falha
- [ ] 11.3 Leitura por signed URL de validade curta emitida em Server Action, com acesso negado para quem não pode ler o chamado

## 12. Avaliação

- [ ] 12.1 Geração do token na finalização (e não no cancelamento), uma única vez por chamado, com link disponível na tela do chamado
- [ ] 12.2 `/avaliar/[token]` lendo e gravando pelas funções de token, sem sessão e sem chave privilegiada na rota
- [ ] 12.3 Token inválido exibe mensagem sem revelar dados; token já usado exibe a avaliação em modo leitura
- [ ] 12.4 Avaliação exibida no detalhe do chamado para a equipe interna

## 13. Administração

- [ ] 13.1 CRUD de empresas com desativação preservando histórico e recusa de CNPJ duplicado
- [ ] 13.2 CRUD de usuários com papel, vínculo de empresa obrigatório para solicitante e criação da credencial de acesso
- [ ] 13.3 CRUD de categorias de atendimento e de problema em dois níveis, com desativação no lugar de exclusão quando houver uso
- [ ] 13.4 Edição da política de SLA (padrão e por prioridade) com validação de minutos e proteção da política padrão
- [ ] 13.5 Status ativos e rótulos por empresa, com recusa de desativar status que ainda tem chamados

## 14. Dashboard e encerramento

- [ ] 14.1 Dashboard lendo os KPIs já exibidos a partir de agregados reais, excluindo chamados cancelados das estatísticas de SLA
- [ ] 14.2 Remover `lib/mock/data.ts`; `grep -r "@/lib/mock/data"` retorna vazio
- [ ] 14.3 Verificação final: `npm test`, `npm run typecheck`, `npm run lint` e `npm run build` limpos
- [ ] 14.4 Passagem manual pelas três jornadas em `npm run dev`: solicitante abre → analista faz triagem, responde, aponta horas e finaliza → solicitante avalia pelo link
