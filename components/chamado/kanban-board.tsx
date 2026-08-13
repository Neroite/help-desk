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
import { aguardandoAnalista, dropPermitido, type ColunaKanban } from "@/lib/kanban/colunas"
import { STATUS_META } from "@/lib/status"
import { STATUS_KEYS, type StatusKey, type Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

// id de droppable pra coluna derivada — não é um StatusKey de verdade,
// então nunca bate em STATUS_KEYS.includes(...) no handleDragEnd, e um
// drop nela nunca resulta em mudança de status (ver colunas.ts).
const DROPPABLE_ID_DERIVADA = "derivada"

interface KanbanBoardProps {
  tickets: Ticket[]
  colunas: ColunaKanban[]
  onStatusChange?: (numero: number, novoStatus: StatusKey) => void
  onExigeTecnico?: (numero: number, destino: StatusKey) => void
}

function KanbanCardArrastavel({
  ticket,
  colunas,
  mostrarSeloStatus,
  onStatusChange,
  onExigeTecnico,
}: {
  ticket: Ticket
  colunas: ColunaKanban[]
  mostrarSeloStatus?: boolean
  onStatusChange?: (numero: number, novoStatus: StatusKey) => void
  onExigeTecnico?: (numero: number, destino: StatusKey) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.numero,
  })
  const outrasColunas = colunas.filter(
    (c): c is Extract<ColunaKanban, { tipo: "status" }> => c.tipo === "status" && c.statusKey !== ticket.statusKey
  )

  function moverPara(destino: StatusKey) {
    const resultado = dropPermitido(ticket, destino, colunas)
    if (resultado === "bloqueado") return
    if (resultado === "exige-tecnico") {
      onExigeTecnico?.(ticket.numero, destino)
      return
    }
    onStatusChange?.(ticket.numero, destino)
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("group/kanban-card relative", isDragging && "opacity-0")}
    >
      <TicketCard ticket={ticket} arrastavel mostrarSeloStatus={mostrarSeloStatus} />
      {(onStatusChange || onExigeTecnico) && outrasColunas.length > 0 && (
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
              <DropdownMenuItem key={coluna.statusKey} onClick={() => moverPara(coluna.statusKey)}>
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
  onExigeTecnico,
}: {
  coluna: ColunaKanban
  tickets: Ticket[]
  colunas: ColunaKanban[]
  onStatusChange?: (numero: number, novoStatus: StatusKey) => void
  onExigeTecnico?: (numero: number, destino: StatusKey) => void
}) {
  const derivada = coluna.tipo === "derivada"
  // Coluna derivada não é status real — id próprio, desabilitada como
  // destino de drop (ver DROPPABLE_ID_DERIVADA acima).
  const { setNodeRef, isOver } = useDroppable({
    id: derivada ? DROPPABLE_ID_DERIVADA : coluna.statusKey,
    disabled: derivada,
  })
  const meta = derivada ? null : STATUS_META[coluna.statusKey]
  const Icon = meta?.icon

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
        derivada && "border-dashed",
        !derivada && (isOver ? "border-primary/50" : "border-border")
      )}
    >
      {/* Barra forte estilo Milvus: cor cheia (colorVarSolid — fixa entre
          os temas, mesma variante usada nos badges), pouco espaçamento,
          contador num "chip" translúcido escuro por cima. Coluna derivada
          não tem status/cor própria — cabeçalho neutro. */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-1.5 px-3 py-2",
          derivada ? "bg-muted text-foreground" : "text-white"
        )}
        style={meta ? { backgroundColor: `var(--${meta.colorVarSolid})` } : undefined}
      >
        {Icon && <Icon className="size-4" aria-hidden="true" />}
        <span className="text-xs font-semibold">{coluna.rotulo}</span>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 font-tabular text-xs font-semibold",
            derivada ? "bg-foreground/10" : "bg-black/15"
          )}
        >
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
            mostrarSeloStatus={derivada}
            onStatusChange={onStatusChange}
            onExigeTecnico={onExigeTecnico}
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
// os status visíveis (globais ou por empresa) mais a coluna derivada
// "Última interação do cliente" ao fim.
export function KanbanBoard({ tickets, colunas, onStatusChange, onExigeTecnico }: KanbanBoardProps) {
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
    const destino = event.over?.id
    const numero = event.active.id as number
    const ticket = tickets.find((t) => t.numero === numero)
    if (!ticket || typeof destino !== "string") return
    if (!STATUS_KEYS.includes(destino as StatusKey)) return // coluna derivada (ou nada): não é destino válido

    const resultado = dropPermitido(ticket, destino as StatusKey, colunas)
    if (resultado === "bloqueado") return
    if (resultado === "exige-tecnico") {
      onExigeTecnico?.(numero, destino as StatusKey)
      return
    }
    onStatusChange?.(numero, destino as StatusKey)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {colunas.map((coluna) => (
          <KanbanColumn
            key={coluna.tipo === "status" ? coluna.statusKey : DROPPABLE_ID_DERIVADA}
            coluna={coluna}
            tickets={
              coluna.tipo === "status"
                ? tickets.filter((t) => t.statusKey === coluna.statusKey)
                : tickets.filter(aguardandoAnalista)
            }
            colunas={colunas}
            onStatusChange={onStatusChange}
            onExigeTecnico={onExigeTecnico}
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
