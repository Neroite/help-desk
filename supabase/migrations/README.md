# Migrations do schema `helpdesk`

Este diretório versiona **todas** as migrations do schema `helpdesk`, aplicadas
no projeto Supabase `byteflow-pro` (`dyutvxtrcchkqvykjmyy`). O schema é
reprodutível do zero aplicando os arquivos em ordem de nome.

O help desk vive num schema dedicado (`helpdesk`), separado do `public` que
pertence ao ByteFlow — os dois convivem no mesmo projeto.

## Regra

Toda migration nova entra aqui **como arquivo, no mesmo momento em que é
aplicada** via MCP (`apply_migration`) ou CLI. Nome do arquivo:
`<version>_<name>.sql`, batendo exatamente com o registro em
`supabase_migrations.schema_migrations`.

Conferência rápida de que nada ficou de fora. O filtro por `version >=
'20260807'` isola as migrations do help desk das do ByteFlow, que vivem na
mesma tabela e são anteriores:

```sql
select version, name from supabase_migrations.schema_migrations
where version >= '20260807'
order by version;
```

A contagem precisa bater com a de arquivos `.sql` neste diretório.

## Ordem

| # | Arquivo | O que faz |
|---|---------|-----------|
| 1 | `20260807015858_helpdesk_schema_tables.sql` | Schema, 4 enums (`papel`, `status_key`, `prioridade`, `evento_tipo`) e as 12 tabelas com índices e constraints. |
| 2 | `20260807015958_helpdesk_rls.sql` | Expõe o schema ao PostgREST, grants, as 4 funções `SECURITY DEFINER` (`current_papel`, `current_empresa_id`, `is_staff`, `is_admin`) e RLS em todas as tabelas. |
| 3 | `20260807020320_helpdesk_seed_referencia.sql` | Seed de referência: 2 empresas, políticas de SLA, categorias de atendimento e a árvore de categorias de problema. |
| 4 | `20260807020555_helpdesk_seed_usuarios.sql` | ⚠️ **Seed de desenvolvimento.** 6 contas em `auth.users` com senha conhecida. Não aplicar em produção — ver aviso no topo do arquivo. |
| 5 | `20260808161107_helpdesk_usuario_select_staff_visivel.sql` | Solicitante passa a enxergar nome de admin/analista (autor de comentário na timeline). |
| 6 | `20260808164200_helpdesk_sla_policy_select_todos.sql` | `sla_policy` legível por todos: `criarChamado()` precisa da política padrão mesmo quando quem abre é o solicitante. |
| 7 | `20260811234711_fase3_habilita_realtime.sql` | Adiciona `ticket`, `comentario` e `ticket_evento` à publication `supabase_realtime`. |
| 8 | `20260813000001_helpdesk_ultima_interacao.sql` | Colunas `ticket.ultima_interacao_em` / `ultima_interacao_papel` + backfill a partir do último comentário público + índice. |
| 9 | `20260813000002_helpdesk_evento_corpo.sql` | Coluna `ticket_evento.corpo`, usada pelos eventos de início/pausa/retomada. |
| 10 | `20260813000003_helpdesk_evento_tipos_atendimento.sql` | Adiciona `inicio`, `pausa`, `retomada`, `categoria` ao enum `evento_tipo`. Precisa ser separada da anterior: Postgres não permite usar um valor de enum recém-criado na mesma transação. |
| 11 | `20260813210000_helpdesk_apontamento_timer_unico.sql` | Índice parcial único: um timer aberto por analista, garantido no banco. |
| 12 | `20260813210500_helpdesk_anexos_bucket.sql` | Bucket privado `helpdesk-anexos` (10 MB), função `anexo_ticket_do_path` e policies de `storage.objects`. |
| 13 | `20260813210600_helpdesk_anexo_delete_policy.sql` | `delete` em `helpdesk.anexo` para staff — sem ela o metadado ficaria órfão ao remover o arquivo. |
| 14 | `20260813211000_helpdesk_token_avaliacao.sql` | Coluna `ticket.token_avaliacao` (uuid, única): identificador opaco do link de avaliação enviado por e-mail. |
| 15 | `20260813211100_helpdesk_avaliacao_por_token_rpc.sql` | RPCs públicas `chamado_por_token` e `avaliar_por_token` — única porta anônima da avaliação, sem abrir SELECT em `ticket`. |

## Nota histórica

As migrations 1–7 foram originalmente aplicadas direto no projeto remoto via
MCP, sem arquivo local. Os arquivos acima foram recuperados de
`supabase_migrations.schema_migrations` (coluna `statements`) e refletem
literalmente o SQL que rodou no banco — não foram reescritos nem
"melhorados", justamente para que reaplicá-los produza o schema atual.

## Migrations recentes (fora da tabela acima)

A tabela "Ordem" não foi atualizada desde a rodada `paridade-milvus-atendimento`
(2026-08-18) — os arquivos `20260818142319` a `20260818142542` existem no
diretório mas não têm linha própria acima. Não renumerado aqui para não
arriscar errar a ordem sem conferir cada um; listando só o que foi aplicado
nesta rodada (`aegis-rebrand-milvus-v2`):

| Arquivo | O que faz |
|---------|-----------|
| `20260819022803_helpdesk_ticket_setor.sql` | Coluna `ticket.setor_id` (nullable, FK para `helpdesk.setor`) — setor do cliente de onde veio o chamado, distinto de `usuario.setor_id` (cadastro da pessoa). Editável no painel lateral do detalhe. |
| `20260819113559_helpdesk_comentario_origem.sql` | Coluna `comentario.origem` (`'usuario'` \| `'descricao'`, default `'usuario'`) — marcador de idempotência para a migration seguinte, eixo diferente de `formato`. |
| `20260819113633_helpdesk_comentario_backfill_descricao.sql` | Backfill idempotente: descrição de cada chamado existente vira seu primeiro comentário público (`origem = 'descricao'`, autor = solicitante). Preenche `ultima_interacao_em`/`papel` só quando ainda nulos. Confirmado 0 candidatos ao rodar de novo. |
| `20260819113657_helpdesk_comentario_formato.sql` | Coluna `comentario.formato` (`'texto'` \| `'html'`, default `'texto'`) — histórico continua `whitespace-pre-wrap`; só o editor rich text novo grava `'html'`. |
| `20260819113723_helpdesk_anexo_inline.sql` | Coluna `anexo.inline` (bool, default `false`) — distingue imagem colada no editor (referenciada por `/api/anexos/<id>` no corpo html) de anexo de verdade da lista do chamado. |
| `20260819130838_helpdesk_anexo_staff_update.sql` | Policy `anexo_staff_update` (`update ... using (is_staff())`) — faltava UPDATE em `helpdesk.anexo` (só tinha select/insert/delete); precisa pra ligar `comentario_id` a um anexo subido antes de o comentário existir (anexar arquivo no modal de comentário). |
| `20260821153221_helpdesk_rls_security_fixes.sql` | Auditoria de segurança: `WITH CHECK` que faltava em `anexo_staff_update`; `apontamento_horas` separada em select/insert (staff) e update/delete (só o dono ou admin — antes qualquer staff editava apontamento alheio via REST direta); `avaliacao_insert` passa a exigir `status_key = 'finalizado'`, igual ao fluxo por token; `usuario_select` restrita a self/staff (antes liberava a linha inteira, com email, de todo admin/analista pra qualquer autenticado) e nova função `usuario_diretorio()` (security definer, sem coluna email) pro portal do solicitante listar nome/papel de quem atende. |
