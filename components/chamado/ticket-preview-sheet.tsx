"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { PrioridadeBadge } from "@/components/chamado/prioridade-badge"
import { SlaBadge } from "@/components/chamado/sla-badge"
import { StatusBadge } from "@/components/chamado/status-badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useReferenceData } from "@/lib/reference-data/provider"
import { createClient } from "@/lib/supabase/client"
import type { Comentario, Ticket } from "@/lib/types"

interface TicketPreviewSheetProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Sheet lateral aberta pelo ícone de olho na fila (ver ticket-row.tsx) —
// resumo rápido sem sair da listagem. `ticket` fica null só antes da
// primeira pré-visualização; o pai mantém o último ticket visto durante a
// animação de fechamento, então o guard abaixo cobre apenas esse caso.
//
// Comentários vêm do client Supabase do navegador (não do server client) —
// a fila já buscou os tickets no servidor, mas abrir a pré-visualização é
// uma interação de cliente que não passa por uma nova navegação/render de
// Server Component, então busca sob demanda aqui mesmo.
export function TicketPreviewSheet({ ticket, open, onOpenChange }: TicketPreviewSheetProps) {
  const { empresaPorId, usuarioPorId } = useReferenceData()
  const [ultimosComentarios, setUltimosComentarios] = useState<Comentario[]>([])

  useEffect(() => {
    if (!open || !ticket) return
    let cancelado = false
    const supabase = createClient()

    supabase
      .from("comentario")
      .select("id, ticket_id, autor_id, corpo, formato, interno, criado_em")
      .eq("ticket_id", ticket.numero)
      .order("criado_em", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (cancelado || !data) return
        // Mais recente primeiro -- mesma ordem da timeline do detalhe
        // (ver ticket-timeline.tsx). A query já vem `ascending: false`,
        // então não precisa reverter.
        setUltimosComentarios(
          data.map((r) => ({
            id: r.id,
            ticketId: r.ticket_id,
            autorId: r.autor_id,
            corpo: r.corpo,
            formato: r.formato,
            interno: r.interno,
            criadoEm: r.criado_em,
          }))
        )
      })

    return () => {
      cancelado = true
    }
  }, [open, ticket])

  const empresa = ticket ? empresaPorId(ticket.empresaId) : undefined
  const solicitante = ticket ? usuarioPorId(ticket.solicitanteId) : undefined

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {ticket && (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-tabular text-sm text-muted-foreground">#{ticket.numero}</span>
                <SheetTitle>{ticket.titulo}</SheetTitle>
              </div>
              <SheetDescription>
                {empresa?.nome ?? "Empresa desconhecida"} · {solicitante?.nome ?? "Solicitante desconhecido"}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-(--space-4) overflow-y-auto px-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge statusKey={ticket.statusKey} />
                <PrioridadeBadge prioridade={ticket.prioridade} />
                <SlaBadge rotulo="Resposta" ticket={ticket} tipo="resposta" />
                <SlaBadge rotulo="Solução" ticket={ticket} tipo="solucao" />
              </div>

              <p className="text-sm text-muted-foreground">{ticket.descricao}</p>

              <div className="flex flex-col gap-(--space-2)">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Últimos comentários
                </h3>
                {ultimosComentarios.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
                ) : (
                  <ul className="flex flex-col gap-(--space-2)">
                    {ultimosComentarios.map((comentario) => {
                      const autor = usuarioPorId(comentario.autorId)
                      return (
                        <li
                          key={comentario.id}
                          className="rounded-md border border-border bg-muted/30 p-(--space-2) text-sm"
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground">{autor?.nome ?? "—"}</span>
                            {comentario.interno && (
                              <span className="text-xs text-muted-foreground">Nota interna</span>
                            )}
                          </div>
                          {comentario.formato === "html" ? (
                            // Prévia curta: seguro porque corpo html só existe quando
                            // construído no servidor (ver ticket-timeline.tsx).
                            <div
                              className="line-clamp-3 text-muted-foreground [&_*]:inline"
                              dangerouslySetInnerHTML={{ __html: comentario.corpo }}
                            />
                          ) : (
                            <p className="line-clamp-3 whitespace-pre-wrap text-muted-foreground">
                              {comentario.corpo}
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            <SheetFooter>
              <Button
                render={<Link href={`/chamados/${ticket.numero}`} />}
                nativeButton={false}
                className="cursor-pointer"
              >
                Abrir chamado completo
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
