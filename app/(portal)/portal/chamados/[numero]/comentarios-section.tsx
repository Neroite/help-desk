"use client"

import { useState } from "react"
import { toast } from "sonner"

import { ComentarioComposer } from "@/components/chamado/comentario-composer"
import { TicketTimeline } from "@/components/chamado/ticket-timeline"
import { useReferenceData } from "@/lib/reference-data/provider"
import { adicionarComentario } from "@/lib/tickets/actions"
import type { Anexo, Comentario, TicketEvento } from "@/lib/types"

interface ComentariosSectionProps {
  ticketNumero: number
  comentarios: Comentario[]
  eventos: TicketEvento[]
  anexos: Anexo[]
}

// Portal do solicitante nunca envia nota interna — interno sempre false.
export function ComentariosSection({ ticketNumero, comentarios, eventos, anexos }: ComentariosSectionProps) {
  const { usuarioAtual } = useReferenceData()
  const [comentariosState, setComentariosState] = useState<Comentario[]>(comentarios)

  function handleEnviar(corpo: string) {
    const novoComentario: Comentario = {
      id: `local-${Date.now()}`,
      ticketId: ticketNumero,
      autorId: usuarioAtual?.id ?? "",
      corpo,
      interno: false,
      criadoEm: new Date().toISOString(),
    }
    setComentariosState((atual) => [...atual, novoComentario])
    adicionarComentario({ ticketNumero, corpo, interno: false })
      .then(() => toast.success("Mensagem enviada."))
      .catch(() => {
        setComentariosState((atual) => atual.filter((c) => c.id !== novoComentario.id))
        toast.error("Não foi possível enviar a mensagem.")
      })
  }

  return (
    <>
      <div className="flex flex-col gap-(--space-2)">
        <h2 className="text-sm font-medium text-foreground">Andamento</h2>
        <TicketTimeline comentarios={comentariosState} eventos={eventos} anexos={anexos} />
      </div>

      <ComentarioComposer mostrarNotaInterna={false} onEnviar={(corpo) => handleEnviar(corpo)} />
    </>
  )
}
