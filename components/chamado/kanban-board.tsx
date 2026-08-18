"use client"

import { TicketCard } from "@/components/chamado/ticket-card"
import { aguardandoAnalista, type ColunaKanban } from "@/lib/kanban/colunas"
import { STATUS_META } from "@/lib/status"
import type { Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

interface KanbanBoardProps {
  tickets: Ticket[]
  colunas: ColunaKanban[]
}

function KanbanColumn({
  coluna,
  tickets,
}: {
  coluna: ColunaKanban
  tickets: Ticket[]
}) {
  const derivada = coluna.tipo === "derivada"
  const meta = derivada ? null : STATUS_META[coluna.statusKey]
  const Icon = meta?.icon

  return (
    <div
      className={cn(
        // Uma coluna por vez no mobile (scroll-snap horizontal, ver
        // trilho em KanbanBoard); a partir de sm volta pra largura fixa e
        // várias colunas visíveis ao mesmo tempo. `overflow-hidden` recorta
        // o cabeçalho colorido nos cantos arredondados do container, sem
        // precisar de rounded-t/rounded-b separados nele.
        "flex w-[85vw] shrink-0 snap-start flex-col overflow-hidden rounded-lg border sm:w-72",
        derivada ? "border-dashed" : "border-border"
      )}
    >
      {/* Barra forte estilo Milvus: cor cheia (colorVarSolid — fixa entre
          os temas, mesma variante usada nos badges), pouco espaçamento,
          contador num "chip" translúcido escuro por cima. Coluna derivada
          não tem status/cor própria — cabeçalho neutro. */}
      <div
        className="flex shrink-0 items-center gap-1.5 px-3 py-2 text-white"
        style={{
          backgroundColor: meta ? `var(--${meta.colorVarSolid})` : "var(--kanban-derivada-solid)",
        }}
      >
        {Icon && <Icon className="size-4" aria-hidden="true" />}
        <span className="text-xs font-semibold">{coluna.rotulo}</span>
        <span className="ml-auto rounded-full bg-black/15 px-2 py-0.5 font-tabular text-xs font-semibold">
          {tickets.length}
        </span>
      </div>
      {/* Corpo neutro — sombra só existe no TicketCard (só existe quando há
          chamado); coluna vazia e o corpo em si nunca têm sombra própria. */}
      <div className="flex flex-1 flex-col gap-2 bg-muted/20 p-(--space-2)">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.numero} ticket={ticket} mostrarSeloStatus={derivada} />
        ))}
        {tickets.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">Nenhum chamado</p>
        )}
      </div>
    </div>
  )
}

// Kanban é só visualização — sem arrastar card, sem menu de mudar status
// por aqui. Clicar num card abre o chamado (TicketCard já é um Link); a
// mudança de status acontece na tela de detalhe. `colunas` já vem pronta de
// colunasDoKanban() (lib/kanban/colunas.ts): os status visíveis (globais ou
// por empresa) mais a coluna derivada "Última interação do cliente" ao fim.
export function KanbanBoard({ tickets, colunas }: KanbanBoardProps) {
  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
      {colunas.map((coluna) => (
        <KanbanColumn
          key={coluna.tipo === "status" ? coluna.statusKey : "derivada"}
          coluna={coluna}
          tickets={
            coluna.tipo === "status"
              ? tickets.filter((t) => t.statusKey === coluna.statusKey)
              : tickets.filter(aguardandoAnalista)
          }
        />
      ))}
    </div>
  )
}
