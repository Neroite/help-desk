"use client"

import { useState } from "react"
import { MoreVertical } from "lucide-react"

import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useDraggable } from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { TicketCard } from "@/components/chamado/ticket-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type ColunaKanban, dropPermitido } from "@/lib/kanban/colunas"
import { STATUS_META } from "@/lib/status"
import type { StatusKey, Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

interface KanbanBoardProps {
  tickets: Ticket[]
  colunas: ColunaKanban[]
  onStatusChange?: (numero: number, novoStatus: StatusKey) => void
}

function KanbanCardArrastavel({
  ticket,
  colunas,
  onStatusChange,
}: {
  ticket: Ticket
  colunas: ColunaKanban[]
  onStatusChange?: (numero: number, novoStatus: StatusKey) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.numero,
  })
  const outrasColunas = colunas.filter((c) => c.statusKey !== ticket.statusKey)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("group/kanban-card relative", isDragging && "opacity-0")}
    >
      <TicketCard ticket={ticket} arrastavel />
      {onStatusChange && outrasColunas.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Mudar status do chamado #${ticket.numero}`}
            onPointerDown={(event) => event.stopPropagation()}
            className="absolute top-1.5 right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring group-hover/kanban-card:opacity-100 group-focus-within/kanban-card:opacity-100"
          >
            <MoreVertical className="size-3.5" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {outrasColunas.map((coluna) => (
              <DropdownMenuItem
                key={coluna.statusKey}
                onClick={() => onStatusChange(ticket.numero, coluna.statusKey)}
              >
                Mover para &ldquo;{coluna.rotulo}&rdquo;
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

function KanbanColumn({
  coluna,
  tickets,
  colunas,
  onStatusChange,
}: {
  coluna: ColunaKanban
  tickets: Ticket[]
  colunas: ColunaKanban[]
  onStatusChange?: (numero: number, novoStatus: StatusKey) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.statusKey })
  const meta = STATUS_META[coluna.statusKey]
  const Icon = meta.icon

  return (
    <div
      ref={setNodeRef}
      className={cn(
        // Uma coluna por vez no mobile (scroll-snap horizontal, ver
        // trilho em KanbanBoard); a partir de sm volta pra largura fixa e
        // várias colunas visíveis ao mesmo tempo. `overflow-hidden` recorta
        // o cabeçalho colorido nos cantos arredondados do container, sem
        // precisar de rounded-t/rounded-b separados nele.
        "flex w-[85vw] shrink-0 snap-start flex-col overflow-hidden rounded-lg border sm:w-72",
        isOver ? "border-primary/50" : "border-border"
      )}
    >
      {/* Barra forte estilo Milvus: cor cheia (colorVarSolid — fixa entre
          os temas, mesma variante usada nos badges), pouco espaçamento,
          contador num "chip" translúcido escuro por cima. */}
      <div
        className="flex shrink-0 items-center gap-1.5 px-3 py-2 text-white"
        style={{ backgroundColor: `var(--${meta.colorVarSolid})` }}
      >
        <Icon className="size-4" aria-hidden="true" />
        <span className="text-xs font-semibold">{coluna.rotulo}</span>
        <span className="ml-auto rounded-full bg-black/15 px-2 py-0.5 font-tabular text-xs font-semibold">
          {tickets.length}
        </span>
      </div>
      {/* Corpo neutro — sombra só existe no TicketCard (só existe quando há
          chamado); coluna vazia e o corpo em si nunca têm sombra própria. */}
      <div
        className={cn(
          "flex flex-1 flex-col gap-2 bg-muted/20 p-(--space-2)",
          isOver && "bg-primary/5"
        )}
      >
        {tickets.map((ticket) => (
          <KanbanCardArrastavel
            key={ticket.numero}
            ticket={ticket}
            colunas={colunas}
            onStatusChange={onStatusChange}
          />
        ))}
        {tickets.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">Nenhum chamado</p>
        )}
      </div>
    </div>
  )
}

// Drag-drop não é o único caminho para mudar status: o PointerSensor tem um
// KeyboardSensor irmão (Tab até o card, Espaço/Enter inicia o "arrasto",
// setas movem entre colunas, Espaço/Enter solta) e cada card também expõe um
// menu "⋮" com a lista de status de destino, chamando o mesmo callback
// `onStatusChange` — cobre teclado e touch sem depender do gesto de arrastar.
// `colunas` já vem pronta de `colunasDoKanban()` (lib/kanban/colunas.ts):
// as 6 globais sem filtro de empresa, ou só os status ativos e os rótulos
// dela com filtro.
export function KanbanBoard({ tickets, colunas, onStatusChange }: KanbanBoardProps) {
  const [ticketAtivo, setTicketAtivo] = useState<Ticket | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragStart(event: DragStartEvent) {
    const numero = event.active.id as number
    setTicketAtivo(tickets.find((t) => t.numero === numero) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setTicketAtivo(null)
    const destino = event.over?.id as StatusKey | undefined
    const numero = event.active.id as number
    const ticket = tickets.find((t) => t.numero === numero)
    if (!destino || !ticket) return
    if (!dropPermitido(ticket, destino, colunas)) return
    onStatusChange?.(numero, destino)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {colunas.map((coluna) => (
          <KanbanColumn
            key={coluna.statusKey}
            coluna={coluna}
            tickets={tickets.filter((t) => t.statusKey === coluna.statusKey)}
            colunas={colunas}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
      {/* Overlay solto no body (fora do fluxo das colunas): sem ele o card
          arrastado só translada dentro da própria coluna e passa por baixo
          das vizinhas em vez de flutuar por cima de tudo. */}
      <DragOverlay>
        {ticketAtivo && (
          <div className="w-[85vw] sm:w-72">
            <TicketCard ticket={ticketAtivo} arrastavel />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
