"use client"

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

import { TicketCard } from "@/components/chamado/ticket-card"
import { STATUS_META } from "@/lib/status"
import type { StatusKey, Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

interface KanbanBoardProps {
  tickets: Ticket[]
  statusVisiveis: StatusKey[]
  statusRotulos?: Partial<Record<StatusKey, string>>
  onStatusChange?: (numero: number, novoStatus: StatusKey) => void
}

function KanbanCardArrastavel({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.numero,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(isDragging && "opacity-50")}
    >
      <TicketCard ticket={ticket} arrastavel />
    </div>
  )
}

function KanbanColumn({
  statusKey,
  rotulo,
  tickets,
}: {
  statusKey: StatusKey
  rotulo: string
  tickets: Ticket[]
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
          <KanbanCardArrastavel key={ticket.numero} ticket={ticket} />
        ))}
        {tickets.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">Nenhum chamado</p>
        )}
      </div>
    </div>
  )
}

// Drag-drop não é o único caminho para mudar status — em mobile e teclado,
// o StatusBadge em modo select faz o mesmo (ver TicketRow/detalhe). Sem
// filtro de empresa, mostra as 6 colunas globais; com filtro, só os status
// ativos da empresa e os rótulos dela.
export function KanbanBoard({ tickets, statusVisiveis, statusRotulos, onStatusChange }: KanbanBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

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
          />
        ))}
      </div>
    </DndContext>
  )
}
