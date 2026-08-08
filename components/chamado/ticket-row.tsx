"use client"

import Link from "next/link"
import { Eye, Pause, Play } from "lucide-react"

import { PrioridadeBadge } from "@/components/chamado/prioridade-badge"
import { SlaProgress } from "@/components/chamado/sla-progress"
import { StatusBadge } from "@/components/chamado/status-badge"
import { TicketQuickEdit } from "@/components/chamado/ticket-quick-edit"
import { buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TableCell, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useReferenceData } from "@/lib/reference-data/provider"
import { useSlaClock } from "@/lib/sla-clock"
import { STATUS_TINT_BG, STATUS_TINT_BORDER } from "@/lib/status"
import type { Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TicketRowProps {
  ticket: Ticket
  rotuloStatus?: string
  selected: boolean
  onToggleSelect: (numero: number) => void
  onPreview: (ticket: Ticket) => void
  onQuickEditChange: (
    numero: number,
    patch: Partial<Pick<Ticket, "statusKey" | "prioridade" | "analistaId">>
  ) => void
  isRunning: boolean
  onToggleTimer: (ticket: Ticket) => void
}

// "Agora" só existe depois de montar no cliente (useSlaClock) -- mesmo
// guard de hidratação do SlaBadge/SlaProgress. Enquanto não montou,
// mostramos reticências em vez de calcular o relativo.
function formatarRelativo(dataIso: string, agora: Date): string {
  const diffMs = new Date(dataIso).getTime() - agora.getTime()
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" })

  const diffMin = Math.round(diffMs / 60_000)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute")

  const diffHoras = Math.round(diffMs / 3_600_000)
  if (Math.abs(diffHoras) < 24) return rtf.format(diffHoras, "hour")

  const diffDias = Math.round(diffMs / 86_400_000)
  if (Math.abs(diffDias) < 30) return rtf.format(diffDias, "day")

  const diffMeses = Math.round(diffMs / (86_400_000 * 30))
  return rtf.format(diffMeses, "month")
}

// Linha da fila estilo Milvus: a linha inteira é clicável via técnica de
// "stretched link" -- o <a> do número do chamado recebe `after:absolute
// after:inset-0`, e como a <tr> é `relative`, o pseudo-elemento cobre a
// linha toda. Isso preserva um <a> real (Ctrl+clique, leitor de tela,
// Enter funcionam) em vez de um onClick na <tr>, que quebraria isso.
// Checkbox e ações recebem `relative z-10` para ficarem acima do overlay
// (z-index explícito pinta depois de um z-index:auto posicionado, não
// importa a ordem no DOM -- ver regra de empilhamento do CSS 2.1 Apêndice E).
export function TicketRow({
  ticket,
  rotuloStatus,
  selected,
  onToggleSelect,
  onPreview,
  onQuickEditChange,
  isRunning,
  onToggleTimer,
}: TicketRowProps) {
  const agora = useSlaClock()
  const { empresaPorId, usuarioPorId, categoriasProblema } = useReferenceData()
  const empresa = empresaPorId(ticket.empresaId)
  const solicitante = usuarioPorId(ticket.solicitanteId)
  const analista = usuarioPorId(ticket.analistaId)
  const categoria = categoriasProblema.find((c) => c.id === ticket.catProblemaId)
  const categoriaPai = categoria?.paiId ? categoriasProblema.find((c) => c.id === categoria.paiId) : null

  return (
    <TableRow
      className={cn(
        "group relative h-(--row-h)",
        STATUS_TINT_BG[ticket.statusKey],
        selected && "bg-muted/40"
      )}
      data-state={selected ? "selected" : undefined}
    >
      <TableCell className={cn("relative z-10 border-l-[3px]", STATUS_TINT_BORDER[ticket.statusKey])}>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(ticket.numero)}
          aria-label={`Selecionar chamado #${ticket.numero}`}
          className="cursor-pointer"
        />
      </TableCell>

      <TableCell className="font-tabular text-muted-foreground">
        <Link
          href={`/chamados/${ticket.numero}`}
          className="after:absolute after:inset-0 hover:text-foreground hover:underline"
        >
          #{ticket.numero}
        </Link>
      </TableCell>

      <TableCell>
        <span className="font-medium text-foreground">{solicitante?.nome ?? "—"}</span>
      </TableCell>

      <TableCell className="max-w-80 whitespace-normal">
        <p className="line-clamp-2 text-foreground">{ticket.titulo}</p>
      </TableCell>

      <TableCell className="text-muted-foreground">{empresa?.nome ?? "—"}</TableCell>

      <TableCell>
        {categoria ? (
          <div className="flex flex-col">
            {categoriaPai ? (
              <>
                <span className="font-medium text-foreground">{categoriaPai.nome}</span>
                <span className="text-xs text-muted-foreground">{categoria.nome}</span>
              </>
            ) : (
              <span className="text-foreground">{categoria.nome}</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell>
        <PrioridadeBadge prioridade={ticket.prioridade} />
      </TableCell>

      <TableCell>
        <StatusBadge statusKey={ticket.statusKey} rotulo={rotuloStatus} />
      </TableCell>

      <TableCell>
        <span className="font-medium text-foreground">{analista?.nome ?? "—"}</span>
      </TableCell>

      <TableCell className="min-w-48">
        <div className="flex flex-col gap-1.5">
          <SlaProgress
            rotulo="Resposta"
            venceEm={ticket.slaRespostaVenceEm}
            criadoEm={ticket.criadoEm}
            statusKey={ticket.statusKey}
          />
          <SlaProgress
            rotulo="Solução"
            venceEm={ticket.slaSolucaoVenceEm}
            criadoEm={ticket.criadoEm}
            statusKey={ticket.statusKey}
          />
        </div>
      </TableCell>

      <TableCell className="text-muted-foreground">
        {agora ? formatarRelativo(ticket.criadoEm, agora) : "…"}
      </TableCell>

      <TableCell className="relative z-10 text-right">
        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100">
          <Tooltip>
            <TooltipTrigger
              aria-label={`Pré-visualizar chamado #${ticket.numero}`}
              onClick={() => onPreview(ticket)}
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "cursor-pointer")}
            >
              <Eye className="size-3.5" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>Pré-visualizar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              aria-label={
                isRunning
                  ? `Pausar apontamento do chamado #${ticket.numero}`
                  : `Iniciar apontamento do chamado #${ticket.numero}`
              }
              onClick={() => onToggleTimer(ticket)}
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "cursor-pointer")}
            >
              {isRunning ? (
                <Pause className="size-3.5" aria-hidden="true" />
              ) : (
                <Play className="size-3.5" aria-hidden="true" />
              )}
            </TooltipTrigger>
            <TooltipContent>{isRunning ? "Pausar apontamento" : "Iniciar apontamento"}</TooltipContent>
          </Tooltip>

          <TicketQuickEdit ticket={ticket} onChange={onQuickEditChange} />
        </div>
      </TableCell>
    </TableRow>
  )
}
