"use client"

import Link from "next/link"

import { PrioridadeBadge } from "@/components/chamado/prioridade-badge"
import { SlaBadge } from "@/components/chamado/sla-badge"
import { useReferenceData } from "@/lib/reference-data/provider"
import type { Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TicketCardProps {
  ticket: Ticket
  arrastavel?: boolean
  href?: string
  className?: string
}

// Serve duas telas: coluna do kanban e lista em mobile (a tabela vira
// cards abaixo de 768px — ver seção de responsividade do design).
// `href` tem default para a rota do analista; o portal do cliente passa
// `/portal/chamados/{numero}` para não vazar o solicitante para a tela interna.
export function TicketCard({ ticket, arrastavel = false, href, className }: TicketCardProps) {
  const { empresaPorId, usuarioPorId } = useReferenceData()
  const empresa = empresaPorId(ticket.empresaId)
  const analista = usuarioPorId(ticket.analistaId)

  return (
    <Link
      href={href ?? `/chamados/${ticket.numero}`}
      className={cn(
        "flex flex-col gap-2 rounded-md border border-border p-(--card-pad) text-sm shadow-sm transition-colors hover:border-primary/40",
        arrastavel && "cursor-grab active:cursor-grabbing",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-tabular text-xs text-muted-foreground">#{ticket.numero}</span>
        <PrioridadeBadge prioridade={ticket.prioridade} />
      </div>
      <p className="line-clamp-2 font-medium text-foreground">{ticket.titulo}</p>
      <p className="truncate text-xs text-muted-foreground">{empresa?.nome}</p>
      <div className="flex min-w-0 items-center justify-between gap-2 pt-1">
        <span className="min-w-0 truncate text-xs text-muted-foreground">{analista?.nome ?? "Não atribuído"}</span>
        <SlaBadge rotulo="" venceEm={ticket.slaSolucaoVenceEm} statusKey={ticket.statusKey} />
      </div>
    </Link>
  )
}
