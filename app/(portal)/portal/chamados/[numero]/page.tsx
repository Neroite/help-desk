import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { StatusBadge } from "@/components/chamado/status-badge"
import { PrioridadeBadge } from "@/components/chamado/prioridade-badge"
import { SlaBadge } from "@/components/chamado/sla-badge"
import { TicketTimeline } from "@/components/chamado/ticket-timeline"
import { ComentarioComposer } from "@/components/chamado/comentario-composer"
import { AnexoList } from "@/components/chamado/anexo-list"
import { AvaliacaoEstrelas } from "@/components/chamado/avaliacao-estrelas"
import { Button } from "@/components/ui/button"
import {
  anexos as todosAnexos,
  avaliacoes,
  comentarios as todosComentarios,
  ticketEventos,
  ticketPorNumero,
} from "@/lib/mock/data"

interface PageProps {
  params: Promise<{ numero: string }>
}

// Detalhe do lado do solicitante — sem notas internas, sem apontamento de
// horas, sem edição de status/prioridade. Ele só acompanha e responde.
export default async function ChamadoDetalhePage({ params }: PageProps) {
  const { numero } = await params
  const numeroTicket = Number(numero)
  const ticket = ticketPorNumero(numeroTicket)

  if (!ticket || ticket.empresaId !== "acme") {
    notFound()
  }

  const comentariosPublicos = todosComentarios.filter(
    (c) => c.ticketId === String(numeroTicket) && c.interno === false
  )
  const eventos = ticketEventos.filter((e) => e.ticketId === String(numeroTicket))
  const anexosDoTicket = todosAnexos.filter((a) => a.ticketId === String(numeroTicket))
  const avaliacao = avaliacoes.find((a) => a.ticketId === String(numeroTicket))

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-(--space-4)">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/portal" />}
          nativeButton={false}
          className="cursor-pointer text-xs"
        >
          <ArrowLeft className="size-3.5" data-icon="inline-start" />
          Meus chamados
        </Button>
      </div>

      <div className="flex flex-col gap-(--space-2) rounded-md border border-border bg-surface p-(--card-pad)">
        <div className="flex items-center justify-between gap-(--space-2)">
          <span className="font-tabular text-xs text-muted-foreground">#{ticket.numero}</span>
          <div className="flex items-center gap-(--space-2)">
            <StatusBadge statusKey={ticket.statusKey} />
            <PrioridadeBadge prioridade={ticket.prioridade} />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-foreground">{ticket.titulo}</h1>
        <p className="text-sm text-muted-foreground">{ticket.descricao}</p>
        <div>
          <SlaBadge rotulo="Solução" venceEm={ticket.slaSolucaoVenceEm} statusKey={ticket.statusKey} />
        </div>
      </div>

      {ticket.statusKey === "finalizado" && avaliacao && (
        <div className="flex flex-col gap-(--space-2) rounded-md border border-border bg-surface p-(--card-pad)">
          <h2 className="text-sm font-medium text-foreground">Sua avaliação</h2>
          <AvaliacaoEstrelas valor={avaliacao.estrelas} somenteLeitura />
          {avaliacao.comentario && (
            <p className="text-sm text-muted-foreground">{avaliacao.comentario}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-(--space-2)">
        <h2 className="text-sm font-medium text-foreground">Anexos</h2>
        <AnexoList anexos={anexosDoTicket} />
      </div>

      <div className="flex flex-col gap-(--space-2)">
        <h2 className="text-sm font-medium text-foreground">Andamento</h2>
        <TicketTimeline comentarios={comentariosPublicos} eventos={eventos} />
      </div>

      <ComentarioComposer mostrarNotaInterna={false} />
    </div>
  )
}
