## Why

Dois pontos do painel lateral e da abertura de chamado divergiam da referência Milvus e
de um gap real achado na exploração: o painel não tinha como atribuir um operador nem
registrar de qual setor do cliente veio o chamado; a abertura pedia um único
"Solicitante" em vez de múltiplos contatos; e anexar um arquivo na abertura do chamado
era literalmente impossível — a spec de `anexos` já prometia isso, mas a UI recusava
qualquer upload antes do chamado existir.

## What Changes

- Painel lateral reordenado (Contatos · Tipo de Ticket · Categorias · Mesa de trabalho ·
  Operador · Setor do Solicitante · Informações · SLA · Horas · Anexos · Quem viu ·
  Chamados filho · Avaliação), com dois campos novos: **Operador** (atribui o
  `analista_id` do chamado, ação já existia no backend mas nenhuma tela chamava) e
  **Setor do Solicitante** (setor do cliente de onde veio o chamado — coluna nova
  `ticket.setor_id`, distinta de `usuario.setor_id`, que é o cadastro da pessoa e não
  deveria mudar por causa de um chamado específico).
- Campo "Solicitante" (único) na abertura vira "Contatos" (multi-seleção): o primeiro
  contato escolhido vira o dono do chamado (`solicitante_id`); os demais entram como
  `ticket_contato`. Só o formulário do staff ganha multi-contato — `ticket_contato` é
  staff-only por RLS, o portal continua abrindo em nome do próprio usuário logado.
- Anexo passa a ser aceito **antes** de o chamado existir: o arquivo fica em memória
  (chip removível) e sobe de verdade assim que `criarChamado` devolve o número do
  chamado novo, antes de navegar para o detalhe.
- Unifica a ordem de seções do painel lateral entre o `<aside>` desktop e a aba mobile
  "Detalhes" — antes divergiam (só o aside tinha a seção de horas).

## Capabilities

### Modified Capabilities
- `chamado-participantes`: painel lateral ganha Operador e Setor do Solicitante;
  abertura de chamado aceita múltiplos contatos em vez de um único solicitante.
- `anexos`: aceita anexo antes de o chamado existir, resolvendo a divergência entre o que
  a spec já prometia e o que a UI permitia.

## Impact

- **Painel lateral**: `components/chamado/detalhe/painel-lateral.tsx` (reescrito —
  reordenação + dois campos novos), `components/chamado/contatos-select.tsx` (novo,
  `DropdownMenu` com checkbox — `Select` nativo não suporta multi-seleção).
- **Backend**: `lib/tickets/actions.ts` (`criarChamado` recebe `contatoIds: string[]` em
  vez de `solicitanteId`; nova action `definirSetor`); `lib/tickets/queries.ts`
  (`setor_id` em `mapTicket`); `lib/reference-data/provider.tsx` (`setores` e
  `setorPorId` novos).
- **Anexo pendente**: `components/chamado/anexo-list.tsx` (modo pendente:
  `pendentes: File[]` + `onPendentesChange`), `novo-chamado-form.tsx` e
  `app/(portal)/portal/novo/page.tsx` (seguram `File[]` e sobem em loop após criar).
- **Migration** (`supabase/migrations/`, projeto `byteflow-pro`): `ticket.setor_id`
  (nullable, FK para `helpdesk.setor`) — RLS já coberta por `ticket_staff_update`, sem
  policy nova.
- Fora do escopo: evento de timeline para mudança de setor (`evento_tipo` não tem valor
  `"setor"` no enum; adicionar exigiria migration separada, sem pedido explícito para
  isso); multi-contato no portal do solicitante (bloqueado por RLS de propósito).
