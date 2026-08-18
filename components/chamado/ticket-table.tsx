"use client"

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"

import { TicketRow } from "@/components/chamado/ticket-row"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StatusKey, Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

export type TicketSortField =
  | "numero"
  | "solicitante"
  | "assunto"
  | "cliente"
  | "categoria"
  | "prioridade"
  | "status"
  | "operador"
  | "sla"
  | "criado"

interface ColunaDef {
  field: TicketSortField | null
  label: string
  className?: string
}

const COLUNAS: ColunaDef[] = [
  { field: "numero", label: "Ticket", className: "w-24" },
  { field: "solicitante", label: "Solicitante / Contato", className: "min-w-44" },
  { field: "assunto", label: "Assunto", className: "min-w-56" },
  { field: "cliente", label: "Cliente", className: "min-w-32" },
  { field: "categoria", label: "Categoria / Subcategoria", className: "min-w-40" },
  { field: "prioridade", label: "Priori.", className: "w-28" },
  { field: "status", label: "St.", className: "w-36" },
  { field: "operador", label: "Operador", className: "min-w-36" },
  { field: "sla", label: "Resposta / Solução", className: "min-w-48" },
  { field: "criado", label: "Criado", className: "w-28" },
]

interface TicketTableProps {
  tickets: Ticket[]
  sort: TicketSortField
  dir: "asc" | "desc"
  onSort: (field: TicketSortField) => void
  statusRotulos?: Partial<Record<StatusKey, string>>
  selected: Set<number>
  onToggleSelect: (numero: number) => void
  onToggleSelectAll: () => void
  onPreview: (ticket: Ticket) => void
  onQuickEditChange: (
    numero: number,
    patch: Partial<Pick<Ticket, "statusKey" | "prioridade" | "analistaId">>
  ) => void
  runningTimers: Set<number>
  onToggleTimer: (ticket: Ticket) => void
}

// Concentra sort, seleção e larguras de coluna -- a renderização de cada
// linha (colunas, link "stretched", ações no hover) vive em TicketRow, que
// este componente instancia para cada ticket já filtrado/paginado (feito
// em chamados/page.tsx). Sempre em overflow-x-auto próprio, sem vazar
// scroll horizontal para a página inteira; header sticky ao topo desse
// contêiner.
export function TicketTable({
  tickets,
  sort,
  dir,
  onSort,
  statusRotulos,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onPreview,
  onQuickEditChange,
  runningTimers,
  onToggleTimer,
}: TicketTableProps) {
  const algunsSelecionados = tickets.some((t) => selected.has(t.numero))
  const todosSelecionados = tickets.length > 0 && tickets.every((t) => selected.has(t.numero))

  return (
    <Card className="overflow-x-auto p-0 shadow-none">
      <Table>
        <TableHeader className="sticky top-0 z-20 bg-surface">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                checked={todosSelecionados}
                indeterminate={algunsSelecionados && !todosSelecionados}
                onCheckedChange={onToggleSelectAll}
                aria-label={
                  todosSelecionados
                    ? "Desmarcar todos os chamados desta página"
                    : "Selecionar todos os chamados desta página"
                }
                className="cursor-pointer"
              />
            </TableHead>
            {COLUNAS.map((coluna) => (
              <TableHead
                key={coluna.label}
                className={coluna.className}
                aria-sort={
                  sort === coluna.field ? (dir === "asc" ? "ascending" : "descending") : undefined
                }
              >
                {coluna.field ? (
                  <button
                    type="button"
                    onClick={() => onSort(coluna.field!)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded text-left font-medium text-foreground outline-none hover:text-primary focus-visible:text-primary focus-visible:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label={`Ordenar por ${coluna.label}`}
                  >
                    {coluna.label}
                    {sort === coluna.field ? (
                      dir === "asc" ? (
                        <ChevronUp className="size-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
                      )
                    ) : (
                      <ChevronsUpDown
                        className="size-3.5 shrink-0 text-muted-foreground/50"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ) : (
                  coluna.label
                )}
              </TableHead>
            ))}
            <TableHead className={cn("w-24 text-right")}>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket.numero}
              ticket={ticket}
              rotuloStatus={statusRotulos?.[ticket.statusKey]}
              selected={selected.has(ticket.numero)}
              onToggleSelect={onToggleSelect}
              onPreview={onPreview}
              onQuickEditChange={onQuickEditChange}
              isRunning={runningTimers.has(ticket.numero)}
              onToggleTimer={onToggleTimer}
            />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
