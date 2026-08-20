## 1. SLA fora do Kanban e do cabeçalho, formato Milvus no painel

- [x] 1.1 `ticket-card.tsx`: removidas as duas `SlaProgress` do card do Kanban
- [x] 1.2 `cabecalho.tsx`: removidos os dois `SlaBadge` do header do detalhe
- [x] 1.3 `components/chamado/sla-linha-detalhada.tsx` (novo): rótulo + vencimento
      formatado (`dd/MM/yyyy HH:mm`) + prazo total (`HH:mm`, via `slaPolicies` do
      context) + barra mais alta que a `SlaProgress` compacta + selo de pausa
- [x] 1.4 Seção SLA do painel lateral passa a usar `SlaLinhaDetalhada` em vez de
      `SlaProgress`; `SlaProgress`/`lib/sla-display.ts` intocados (continuam em uso em
      `ticket-row.tsx` e outros lugares)

## 2. Barra de ações grande e colorida

- [x] 2.1 `AcaoToolbar`: `size-8` → `size-10`, ícone `size-4` → `size-5`
- [x] 2.2 Tons (azul/verde/preto/vermelho) aplicados à maioria dos botões, não só a
      quatro
- [x] 2.3 Removidas as 3 ações mock que só emitiam toast (Vincular, Anexar, Agendar) —
      Anexar volta como upload de verdade via a pill de Anexos
- [x] 2.4 Ações secundárias (Conciliar, Criar chamado filho, Imprimir) escondidas
      `sm:flex`/`hidden` e agrupadas num `DropdownMenu` "Mais ações" (`MoreHorizontal`)
      visível só abaixo de `sm`

## 3. Modal de horas: totalizador + tabela, um só ponto de montagem

- [x] 3.1 `apontamento-horas.tsx` reformatado: totalizador com 3 indicadores
      (Faturável/Não faturável/Total); tabela "Horas apontadas" (Quando, Operador com
      avatar, Descrição, Horas trabalhadas, Horas faturadas, excluir) — "Horas
      faturadas" por linha é `minutos` quando `faturavel`, senão vazio (schema não
      distingue faturamento parcial por linha, decisão do usuário: só o visual, sem
      coluna nova)
- [x] 3.2 **Bug real corrigido** (risco identificado no plano, confirmado): o componente
      completo montava simultaneamente no aside e no modal aberto pela pill — dois
      `processando` independentes batendo no índice único de "um timer aberto por
      analista" do banco. `components/chamado/detalhe/resumo-horas.tsx` (novo) substitui
      a instância do painel lateral por um resumo somente-leitura (total + botão que abre
      o modal); o componente completo passa a montar em UM único lugar
- [x] 3.3 Aba mobile "Horas" removida (redundante depois que o resumo virou parte da aba
      "Detalhes", que ganhou a seção pela primeira vez — antes só o aside desktop tinha)

## 4. Responsividade das telas de uso diário

- [x] 4.1 `cabecalho.tsx`: selects de status/prioridade `w-full sm:w-{48,44}`
- [x] 4.2 `app-shell.tsx` (equipe): busca vira botão-ícone que abre `Sheet side="top"`
      abaixo de `sm`; tema e notificações saem do header (`hidden sm:flex`) e entram como
      itens extras no dropdown do avatar nessa faixa
- [x] 4.3 `portal-shell.tsx`: mesmo padrão de busca+`Sheet`; nav "Meus chamados" (só um
      link, redundante com o logo) — corrigido `hidden md:flex` que deixava o portal sem
      nenhuma navegação abaixo de 768px; como é 1 link só, virou sempre visível em vez de
      um `Sheet` de navegação

## 5. Verificação

- [x] 5.1 `npm run lint`, `npm run typecheck`, `npm run test` (76/76), `npm run build` —
      todos limpos
- [x] 5.2 Confirmado em runtime (agent-browser, 375px): header do detalhe empilhado sem
      overflow, toolbar colapsada no "Mais ações" (aberto, com os 3 itens); abas só
      Timeline/Detalhes; aba Detalhes mostra SLA no formato Milvus com barra
      (`SLA Resposta • 18/08/2026, 13:44 • 02:00`) e a seção Horas com "Ver apontamentos";
      modal de horas com os 3 tiles do totalizador
