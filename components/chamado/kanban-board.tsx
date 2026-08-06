"use client"

import { MoreVertical } from "lucide-react"

import {
  DndContext,
  type DragEndEvent,
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
import { STATUS_META } from "@/lib/status"
import type { StatusKey, Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

interface KanbanBoardProps {
  tickets: Ticket[]
  statusVisiveis: StatusKey[]
  statusRotulos?: Partial<Record<StatusKey, string>>
  onStatusChange?: (numero: number, novoStatus: StatusKey) => void
}

function KanbanCardArrastavel({
  ticket,
  statusVisiveis,
  statusRotulos,
  onStatusChange,
}: {
  ticket: Ticket
  statusVisiveis: StatusKey[]
  statusRotulos?: Partial<Record<StatusKey, string>>
  onStatusChange?: (numero: number, novoStatus: StatusKey) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.numero,
  })
  const outrosStatus = statusVisiveis.filter((statusKey) => statusKey !== ticket.statusKey)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("group/kanban-card relative", isDragging && "opacity-50")}
    >
      <TicketCard ticket={ticket} arrastavel />
      {onStatusChange && outrosStatus.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Mudar status do chamado #${ticket.numero}`}
            onPointerDown={(event) => event.stopPropagation()}
            className="absolute top-1.5 right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring group-hover/kanban-card:opacity-100 group-focus-within/kanban-card:opacity-100"
          >
            <MoreVertical className="size-3.5" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {outrosStatus.map((statusKey) => (
              <DropdownMenuItem
                key={statusKey}
                onClick={() => onStatusChange(ticket.numero, statusKey)}
              >
                Mover para &ldquo;{statusRotulos?.[statusKey] ?? STATUS_META[statusKey].rotuloPadrao}&rdquo;
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

function KanbanColumn({
  statusKey,
  rotulo,
  tickets,
  statusVisiveis,
  statusRotulos,
  onStatusChange,
}: {
  statusKey: StatusKey
  rotulo: string
  tickets: Ticket[]
  statusVisiveis: StatusKey[]
  statusRotulos?: Partial<Record<StatusKey, string>>
  onStatusChange?: (numero: number, novoStatus: StatusKey) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: statusKey })
  const meta = STATUS_META[statusKey]
  const Icon = meta.icon

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-2 rounded-md border border-border bg-muted/30 p-(--space-2)",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center gap-1.5 px-1 py-1 text-xs font-medium text-foreground">
        <Icon className="size-3.5" style={{ color: `var(--${meta.colorVar})` }} aria-hidden="true" />
        {rotulo}
        <span className="ml-auto font-tabular text-muted-foreground">{tickets.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {tickets.map((ticket) => (
          <KanbanCardArrastavel
            key={ticket.numero}
            ticket={ticket}
            statusVisiveis={statusVisiveis}
            statusRotulos={statusRotulos}
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
// Sem filtro de empresa, mostra as 6 colunas globais; com filtro, só os
// status ativos da empresa e os rótulos dela.
export function KanbanBoard({ tickets, statusVisiveis, statusRotulos, onStatusChange }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const novoStatus = event.over?.id as StatusKey | undefined
    const numero = event.active.id as number
    if (novoStatus) onStatusChange?.(numero, novoStatus)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {statusVisiveis.map((statusKey) => (
          <KanbanColumn
            key={statusKey}
            statusKey={statusKey}
            rotulo={statusRotulos?.[statusKey] ?? STATUS_META[statusKey].rotuloPadrao}
            tickets={tickets.filter((t) => t.statusKey === statusKey)}
            statusVisiveis={statusVisiveis}
            statusRotulos={statusRotulos}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </DndContext>
  )
}
