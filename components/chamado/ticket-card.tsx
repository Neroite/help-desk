"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PrioridadeBadge } from "@/components/chamado/prioridade-badge"
import { SlaBadge } from "@/components/chamado/sla-badge"
import { StatusBadge } from "@/components/chamado/status-badge"
import { formatarRelativo } from "@/lib/formato"
import { aguardandoAnalista } from "@/lib/kanban/colunas"
import { useReferenceData } from "@/lib/reference-data/provider"
import { useSlaClock } from "@/lib/sla-clock"
import type { Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TicketCardProps {
  ticket: Ticket
  arrastavel?: boolean
  href?: string
  className?: string
  // Selo do status real — só faz sentido quando o card é renderizado fora
  // da coluna do próprio status (hoje: coluna derivada "Última interação
  // do cliente" do Kanban), onde o status não é óbvio pelo contexto.
  mostrarSeloStatus?: boolean
}

// Serve duas telas: coluna do kanban e lista em mobile (a tabela vira
// cards abaixo de 768px — ver seção de responsividade do design).
// `href` tem default para a rota do analista; o portal do cliente passa
// `/portal/chamados/{numero}` para não vazar o solicitante para a tela interna.
export function TicketCard({ ticket, arrastavel = false, href, className, mostrarSeloStatus }: TicketCardProps) {
  const { empresaPorId, usuarioPorId } = useReferenceData()
  const agora = useSlaClock()
  const empresa = empresaPorId(ticket.empresaId)
  const analista = usuarioPorId(ticket.analistaId)
  const solicitante = usuarioPorId(ticket.solicitanteId)
  const aguardando = aguardandoAnalista(ticket)

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
        <div className="flex items-center gap-1.5">
          {mostrarSeloStatus && <StatusBadge statusKey={ticket.statusKey} className="h-5 px-1.5" />}
          <PrioridadeBadge prioridade={ticket.prioridade} />
        </div>
      </div>
      <p className="line-clamp-2 font-medium text-foreground">{ticket.titulo}</p>
      <p className="truncate text-xs text-muted-foreground">{empresa?.nome}</p>
      <div className="flex min-w-0 items-center justify-between gap-2 pt-1">
        <span className="min-w-0 truncate text-xs text-muted-foreground">{analista?.nome ?? "Não atribuído"}</span>
        {aguardando ? (
          <span
            className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border px-2 text-xs font-medium font-tabular"
            style={{
              color: "var(--sla-atencao)",
              borderColor: "color-mix(in srgb, var(--sla-atencao) 40%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--sla-atencao) 12%, transparent)",
            }}
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {solicitante?.nome ?? "Cliente"}
            {agora && ticket.ultimaInteracaoEm ? ` · ${formatarRelativo(ticket.ultimaInteracaoEm, agora)}` : ""}
          </span>
        ) : (
          <SlaBadge rotulo="" venceEm={ticket.slaSolucaoVenceEm} statusKey={ticket.statusKey} />
        )}
      </div>
    </Link>
  )
}
