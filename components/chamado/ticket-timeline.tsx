import { Lock, MessageSquare, UserPlus } from "lucide-react"

import { STATUS_META } from "@/lib/status"
import { usuarioPorId } from "@/lib/mock/data"
import type { Comentario, TicketEvento } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TicketTimelineProps {
  comentarios: Comentario[]
  eventos: TicketEvento[]
}

type ItemLinha =
  | { tipo: "comentario"; data: string; item: Comentario }
  | { tipo: "evento"; data: string; item: TicketEvento }

function formatarHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function descreverEvento(evento: TicketEvento): string {
  const autor = usuarioPorId(evento.autorId)?.nome ?? "Alguém"
  switch (evento.tipo) {
    case "criado":
      return `${autor} abriu o chamado`
    case "atribuicao":
      return `${autor} assumiu o chamado`
    case "prioridade":
      return `${autor} definiu prioridade ${evento.para}`
    case "status": {
      const de = evento.de ? STATUS_META[evento.de as keyof typeof STATUS_META]?.rotuloPadrao : null
      const para = STATUS_META[evento.para as keyof typeof STATUS_META]?.rotuloPadrao ?? evento.para
      return de ? `Status: ${de} → ${para}` : `Status: ${para}`
    }
  }
}

// Comentários e eventos de status na MESMA linha do tempo — separar em
// abas destrói a leitura de causa ("por que ficou parado 3h" está na
// costura entre os dois). Ver seção 2 do design.
export function TicketTimeline({ comentarios, eventos }: TicketTimelineProps) {
  const linhas: ItemLinha[] = [
    ...comentarios.map((c): ItemLinha => ({ tipo: "comentario", data: c.criadoEm, item: c })),
    ...eventos.map((e): ItemLinha => ({ tipo: "evento", data: e.criadoEm, item: e })),
  ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

  return (
    <ol className="flex flex-col gap-3">
      {linhas.map((linha) => {
        if (linha.tipo === "evento") {
          return (
            <li key={linha.item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserPlus className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{descreverEvento(linha.item)}</span>
              <span className="ml-auto font-tabular">{formatarHora(linha.data)}</span>
            </li>
          )
        }

        const comentario = linha.item
        const autor = usuarioPorId(comentario.autorId)

        return (
          <li
            key={comentario.id}
            className={cn(
              "flex flex-col gap-1 rounded-md border p-(--space-3) text-sm",
              comentario.interno
                ? "border-accent/40 bg-accent/10"
                : "border-border bg-surface"
            )}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="size-3.5" aria-hidden="true" />
              <span className="font-medium text-foreground">{autor?.nome}</span>
              {comentario.interno && (
                <span className="flex items-center gap-1 text-accent">
                  <Lock className="size-3" aria-hidden="true" />
                  Interno
                </span>
              )}
              <span className="ml-auto font-tabular">{formatarHora(comentario.criadoEm)}</span>
            </div>
            <p className="text-foreground">{comentario.corpo}</p>
          </li>
        )
      })}
    </ol>
  )
}
