"use client"

import {
  Flag,
  Lock,
  Pencil,
  PlusCircle,
  Trash2,
  UserPlus,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { usuarioPorId } from "@/lib/mock/data"
import { useSlaClock } from "@/lib/sla-clock"
import { STATUS_META } from "@/lib/status"
import type { Anexo, Comentario, StatusKey, TicketEvento } from "@/lib/types"
import { cn } from "@/lib/utils"

// "Usuário logado" mock — mesmo id usado como autor de novos comentários na
// página de detalhe e como analista de referência no dashboard. Só serve
// pra decidir quais comentários mostram ações de editar/apagar no hover.
const ANALISTA_LOGADO_ID = "u-joao"

export type FiltroTimeline = "todos" | "comentarios" | "anexos"

interface TicketTimelineProps {
  comentarios: Comentario[]
  eventos: TicketEvento[]
  anexos?: Anexo[]
  filtro?: FiltroTimeline
}

type ItemLinha =
  | { tipo: "comentario"; data: string; item: Comentario }
  | { tipo: "evento"; data: string; item: TicketEvento }

function formatarHora(iso: string) {
  // timeZone fixo — mesmo cuidado de app/(app)/chamados/[numero]/page.tsx:
  // sem isso, servidor e cliente em fusos diferentes gerariam o atributo
  // `title` com valores diferentes entre SSR e hidratação.
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

const formatadorRelativo = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" })

function formatarTempoRelativo(iso: string, agora: Date): string {
  const diffMin = Math.round((new Date(iso).getTime() - agora.getTime()) / 60_000)
  if (Math.abs(diffMin) < 1) return "agora mesmo"
  if (Math.abs(diffMin) < 60) return formatadorRelativo.format(diffMin, "minute")
  const diffHoras = Math.round(diffMin / 60)
  if (Math.abs(diffHoras) < 24) return formatadorRelativo.format(diffHoras, "hour")
  const diffDias = Math.round(diffHoras / 24)
  return formatadorRelativo.format(diffDias, "day")
}

// `agora` só existe depois de montar no cliente (SlaClockProvider). Até lá
// mostramos um placeholder estático em vez de calcular o texto relativo —
// nunca usar `new Date()` direto no render (já causou bug de hidratação
// neste projeto, ver lib/sla-clock.tsx).
function Tempo({ iso, agora, className }: { iso: string; agora: Date | null; className?: string }) {
  const absoluto = formatarHora(iso)
  return (
    <time dateTime={iso} title={absoluto} className={cn("shrink-0 font-tabular", className)}>
      {agora ? formatarTempoRelativo(iso, agora) : "…"}
    </time>
  )
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
      const de = evento.de ? STATUS_META[evento.de as StatusKey]?.rotuloPadrao : null
      const para = STATUS_META[evento.para as StatusKey]?.rotuloPadrao ?? evento.para
      return de ? `Status: ${de} → ${para}` : `Status: ${para}`
    }
  }
}

function iconeEvento(evento: TicketEvento): LucideIcon {
  switch (evento.tipo) {
    case "criado":
      return PlusCircle
    case "atribuicao":
      return UserPlus
    case "prioridade":
      return Flag
    case "status":
      return STATUS_META[evento.para as StatusKey]?.icon ?? UserPlus
  }
}

// Antes todo evento era roxo fixo (--status-pausado), inclusive "chamado
// finalizado" ou "Maria comentou". Agora cada evento de status usa a cor
// do status de DESTINO — o resto do design já usa essas cores pra "estado
// atual do chamado", então reaproveitar aqui reforça a leitura em vez de
// introduzir uma paleta paralela.
function corEvento(evento: TicketEvento): string {
  switch (evento.tipo) {
    case "status":
      return STATUS_META[evento.para as StatusKey]?.colorVar ?? "muted-fg"
    // Não "status-a-fazer": vermelho em "chamado aberto" lê como erro, não como início.
    case "criado":
      return "primary"
    case "atribuicao":
      return "secondary"
    // Preserva "roxo = evento administrativo" de antes, agora só aqui.
    case "prioridade":
      return "status-pausado"
  }
}

// Comentários e eventos de status na MESMA linha do tempo — separar em
// abas destrói a leitura de causa ("por que ficou parado 3h" está na
// costura entre os dois). Ver seção 2 do design.
export function TicketTimeline({ comentarios, eventos, anexos = [], filtro = "todos" }: TicketTimelineProps) {
  const agora = useSlaClock()

  let linhas: ItemLinha[] = [
    ...comentarios.map((c): ItemLinha => ({ tipo: "comentario", data: c.criadoEm, item: c })),
    ...eventos.map((e): ItemLinha => ({ tipo: "evento", data: e.criadoEm, item: e })),
  ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

  if (filtro === "comentarios") {
    linhas = linhas.filter((linha) => linha.tipo === "comentario")
  } else if (filtro === "anexos") {
    linhas = linhas.filter(
      (linha) => linha.tipo === "comentario" && anexos.some((a) => a.comentarioId === linha.item.id)
    )
  }

  if (linhas.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-(--space-4) text-center text-sm text-muted-foreground">
        Nada para mostrar com este filtro.
      </p>
    )
  }

  return (
    <ol className="flex flex-col gap-(--space-3)">
      {linhas.map((linha) => {
        if (linha.tipo === "evento") {
          const evento = linha.item
          const Icon = iconeEvento(evento)
          const cor = corEvento(evento)

          return (
            <li key={evento.id} className="flex items-start gap-(--space-3)">
              <span
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--${cor}) 15%, transparent)`,
                  color: `var(--${cor})`,
                }}
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
              <div
                className="flex flex-1 flex-wrap items-center gap-2 rounded-md border border-border bg-surface py-(--space-2) pr-(--space-3) pl-(--space-3) text-xs"
                style={{ borderLeftWidth: 4, borderLeftColor: `var(--${cor})` }}
              >
                <span className="text-foreground">{descreverEvento(evento)}</span>
                <Tempo iso={evento.criadoEm} agora={agora} className="ml-auto text-muted-foreground" />
              </div>
            </li>
          )
        }

        const comentario = linha.item
        const autor = usuarioPorId(comentario.autorId)
        const proprio = comentario.autorId === ANALISTA_LOGADO_ID
        // "--status-andamento" virou verde no mapa vibrante — usar "--secondary"
        // (azul) pra comentário público, senão colide com o status "em andamento".
        const corBorda = comentario.interno ? "var(--accent)" : "var(--secondary)"

        return (
          <li key={comentario.id} className="group/card flex items-start gap-(--space-3)">
            <Avatar size="sm" className="mt-0.5">
              <AvatarFallback>{autor?.avatarIniciais ?? "?"}</AvatarFallback>
            </Avatar>

            <div
              className={cn(
                "flex flex-1 flex-col gap-1.5 rounded-md border border-border p-(--space-3) text-sm",
                comentario.interno ? "bg-accent/10" : "bg-surface"
              )}
              style={{ borderLeftWidth: 4, borderLeftColor: corBorda }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{autor?.nome ?? "Usuário desconhecido"}</span>

                {comentario.interno && (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                    <Lock className="size-3" aria-hidden="true" />
                    Interno
                  </span>
                )}

                <Tempo iso={comentario.criadoEm} agora={agora} className="ml-auto text-xs text-muted-foreground" />

                <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/card:opacity-100 group-focus-within/card:opacity-100 motion-reduce:transition-none">
                  {proprio && (
                    <>
                      <button
                        type="button"
                        aria-label="Editar comentário"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }))}
                        onClick={() => toast.success("Edição de comentário registrada (mock)")}
                      >
                        <Pencil aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Apagar comentário"
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-xs" }),
                          "hover:text-destructive"
                        )}
                        onClick={() => toast.success("Comentário removido (mock)")}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="text-foreground">{comentario.corpo}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
