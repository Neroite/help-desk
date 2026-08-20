## 1. Painel lateral: Operador e Setor do Solicitante

- [x] 1.1 Migration `ticket.setor_id` (nullable, FK `helpdesk.setor`) — RLS já coberta por
      `ticket_staff_update`, sem policy nova
- [x] 1.2 `Ticket.setorId`, `TicketRow.setor_id`/`mapTicket` (`lib/types.ts`,
      `lib/tickets/queries.ts`)
- [x] 1.3 `definirSetor` (`lib/tickets/actions.ts`) — sem evento de timeline
      (`evento_tipo` não tem valor `"setor"`, adicionar exigiria migration própria; fora
      do escopo pedido)
- [x] 1.4 `setores`/`setorPorId` no `ReferenceDataProvider`; `listarSetores()` somado ao
      `layout.tsx` da equipe (portal passa `setores: []`, não usa)
- [x] 1.5 `painel-lateral.tsx` reescrito: reordenado (Contatos · Tipo de Ticket ·
      Categorias · Mesa de trabalho · Operador · Setor do Solicitante · Informações ·
      SLA · Horas · Anexos · Quem viu · Chamados filho · Avaliação); Select de Operador
      (`atribuirAnalista`, já existia, nunca era chamado por esta tela) e de Setor
      (`definirSetor`, novo); badge "Contrato" hardcoded removido; "Tipo de Ticket" vira
      seção própria no topo (rótulo novo para o `CategoriaAtendimentoSelect` que já
      existia dentro de "Categorias")
- [x] 1.6 Unificado com a aba mobile "Detalhes" — antes só o aside desktop tinha a seção
      de horas, agora as duas leituras usam o mesmo componente

## 2. Abertura: Contatos multi-seleção

- [x] 2.1 `criarChamado`: `solicitanteId: string` → `contatoIds: string[]` — primeiro id
      vira `solicitante_id`, os demais entram em `ticket_contato` num único insert em
      lote (não N chamadas a `adicionarContato`)
- [x] 2.2 `components/chamado/contatos-select.tsx` (novo): `DropdownMenu` +
      `DropdownMenuCheckboxItem` (multi-seleção, `Select` nativo não suporta), chips
      removíveis abaixo
- [x] 2.3 `novo-chamado-form.tsx` (staff): campo "Solicitante" → "Contatos"
- [x] 2.4 `app/(portal)/portal/novo/page.tsx`: sem mudança de UI, só ajuste de chamada —
      manda `contatoIds: [usuarioAtual.id]` (multi-contato é staff-only por RLS de
      `ticket_contato`)

## 3. Anexo antes de criar o chamado

- [x] 3.1 `anexo-list.tsx` ganha modo pendente: sem `ticketNumero`, aceita arquivo em
      estado local (`pendentes: File[]` + `onPendentesChange`), mostra como chip
      removível
- [x] 3.2 `novo-chamado-form.tsx` e `portal/novo/page.tsx`: seguram `File[]`; depois que
      `criarChamado` devolve o número, sobem em loop via `anexarArquivo` — falha de
      upload não desfaz a criação do chamado (toast nomeando o arquivo que falhou)

## 4. Verificação

- [x] 4.1 `npm run lint`, `npm run typecheck`, `npm run test` (76/76), `npm run build` —
      todos limpos
- [x] 4.2 Confirmado em runtime (agent-browser, login real): chip "Maria Souza
      maria@acme.com.br" renderizado ao selecionar um contato; chamado criado com
      contato + anexo pendente nasceu com "Anexos 1" — confirmado o arquivo subiu de
      verdade **depois** da criação
