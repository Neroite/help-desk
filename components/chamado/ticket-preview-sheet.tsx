"use client"

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
import { comentarios, empresaPorId, usuarioPorId } from "@/lib/mock/data"
import type { Ticket } from "@/lib/types"

interface TicketPreviewSheetProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Sheet lateral aberta pelo ícone de olho na fila (ver ticket-row.tsx) —
// resumo rápido sem sair da listagem. `ticket` fica null só antes da
// primeira pré-visualização; o pai mantém o último ticket visto durante a
// animação de fechamento, então o guard abaixo cobre apenas esse caso.
export function TicketPreviewSheet({ ticket, open, onOpenChange }: TicketPreviewSheetProps) {
  const empresa = ticket ? empresaPorId(ticket.empresaId) : undefined
  const solicitante = ticket ? usuarioPorId(ticket.solicitanteId) : undefined
  const ultimosComentarios = ticket
    ? comentarios.filter((c) => c.ticketId === String(ticket.numero)).slice(-3)
    : []

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
                <SlaBadge rotulo="Resposta" venceEm={ticket.slaRespostaVenceEm} statusKey={ticket.statusKey} />
                <SlaBadge rotulo="Solução" venceEm={ticket.slaSolucaoVenceEm} statusKey={ticket.statusKey} />
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
                          <p className="text-muted-foreground">{comentario.corpo}</p>
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
