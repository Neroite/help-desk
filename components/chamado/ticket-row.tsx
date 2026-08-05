import Link from "next/link"

import { PrioridadeBadge } from "@/components/chamado/prioridade-badge"
import { SlaBadge } from "@/components/chamado/sla-badge"
import { StatusBadge } from "@/components/chamado/status-badge"
import { empresaPorId, usuarioPorId } from "@/lib/mock/data"
import type { Ticket } from "@/lib/types"

interface TicketRowProps {
  ticket: Ticket
}

// Altura de linha 36px (--row-h) — ver design system, densidade 8/10.
export function TicketRow({ ticket }: TicketRowProps) {
  const empresa = empresaPorId(ticket.empresaId)
  const analista = usuarioPorId(ticket.analistaId)
  const solicitante = usuarioPorId(ticket.solicitanteId)
  const rotulo = empresa?.statusRotulos[ticket.statusKey]

  return (
    <tr className="h-(--row-h) border-b border-border text-sm last:border-0 hover:bg-muted/50">
      <td className="px-3 font-tabular text-muted-foreground">
        <Link href={`/chamados/${ticket.numero}`} className="hover:text-foreground hover:underline">
          #{ticket.numero}
        </Link>
      </td>
      <td className="max-w-80 truncate px-3">
        <Link href={`/chamados/${ticket.numero}`} className="hover:underline">
          {ticket.titulo}
        </Link>
      </td>
      <td className="px-3 text-muted-foreground">{empresa?.nome}</td>
      <td className="px-3 text-muted-foreground">{solicitante?.nome}</td>
      <td className="px-3 text-muted-foreground">{analista?.nome ?? "—"}</td>
      <td className="px-3">
        <StatusBadge statusKey={ticket.statusKey} rotulo={rotulo} />
      </td>
      <td className="px-3">
        <PrioridadeBadge prioridade={ticket.prioridade} />
      </td>
      <td className="px-3">
        <SlaBadge rotulo="Solução" venceEm={ticket.slaSolucaoVenceEm} statusKey={ticket.statusKey} />
      </td>
    </tr>
  )
}
