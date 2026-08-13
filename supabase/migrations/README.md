# Migrations do schema `helpdesk`

Este diretório versiona as migrations do schema `helpdesk` a partir da change
`fluxo-atendimento-milvus` (2026-08-13). As sete migrations anteriores foram
aplicadas diretamente no projeto Supabase remoto (`dyutvxtrcchkqvykjmyy`) via
MCP, sem passar por arquivo local, e por isso não têm registro aqui:

- `20260807015858_helpdesk_schema_tables`
- `20260807015958_helpdesk_rls`
- `20260807020320_helpdesk_seed_referencia`
- `20260807020555_helpdesk_seed_usuarios`
- `20260808161107_helpdesk_usuario_select_staff_visivel`
- `20260808164200_helpdesk_sla_policy_select_todos`
- `20260811234711_fase3_habilita_realtime`

Reproduzir o schema do zero exige recriar essas sete primeiro (schema,
tabelas, RLS, seed) antes de aplicar as três incluídas aqui. A partir desta
change, toda migration nova entra neste diretório no momento em que é
aplicada via MCP.

## Migrations desta change

1. `helpdesk_ultima_interacao` — colunas `ticket.ultima_interacao_em` /
   `ultima_interacao_papel` + backfill a partir do último comentário público
   de cada chamado + índice.
2. `helpdesk_evento_corpo` — coluna `ticket_evento.corpo`, usada pelos
   eventos de início/pausa/retomada de atendimento.
3. `helpdesk_evento_tipos_atendimento` — adiciona `inicio`, `pausa`,
   `retomada`, `categoria` ao enum `evento_tipo`. Precisa ser uma migration
   separada da anterior: Postgres não permite usar um valor de enum recém
   adicionado na mesma transação em que ele foi criado.
