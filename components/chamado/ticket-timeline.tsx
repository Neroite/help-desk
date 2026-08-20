"use client"

import {
  FileText,
  Flag,
  GitMerge,
  Lock,
  Network,
  Pencil,
  PlusCircle,
  Tag,
  Trash2,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { useReferenceData } from "@/lib/reference-data/provider"
import { useSlaClock } from "@/lib/sla-clock"
import { STATUS_META } from "@/lib/status"
import { gerarUrlAssinada } from "@/lib/tickets/anexos"
import type { Anexo, Comentario, StatusKey, TicketEvento } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TicketTimelineProps {
  comentarios: Comentario[]
  eventos: TicketEvento[]
  anexos: Anexo[]
}

const formatadorTamanho = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

function formatarTamanho(kb: number): string {
  return kb >= 1024
    ? `${formatadorTamanho.format(kb / 1024)} MB`
    : `${formatadorTamanho.format(kb)} KB`
}

// Mesmo padrão de anexo-list.tsx: bucket privado, então abrir sempre passa
// por uma signed URL nova (a anterior pode ter expirado em 60s).
async function abrirAnexo(anexoId: string) {
  try {
    const url = await gerarUrlAssinada(anexoId)
    window.open(url, "_blank", "noopener,noreferrer")
  } catch {
    toast.error("Não foi possível abrir o anexo.")
  }
}

// Anexo de imagem (botão "Anexar arquivo", diferente da imagem inline do
// editor rich text que já vai embutida no HTML do comentário) renderiza a
// imagem de verdade, não um chip com ícone -- /api/anexos/<id> já é o mesmo
// src estável usado pela imagem inline (RLS + cookie de sessão, sem token
// extra). Anexo que não é imagem continua como chip.
function AnexosDoComentario({ anexos }: { anexos: Anexo[] }) {
  if (anexos.length === 0) return null
  const imagens = anexos.filter((anexo) => anexo.tipo === "imagem")
  const documentos = anexos.filter((anexo) => anexo.tipo !== "imagem")
  return (
    <div className="flex flex-col gap-2">
      {imagens.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imagens.map((anexo) => (
            <button
              key={anexo.id}
              type="button"
              className="cursor-pointer overflow-hidden rounded-md border border-border transition-opacity hover:opacity-90"
              onClick={() => abrirAnexo(anexo.id)}
            >
              <img
                src={`/api/anexos/${anexo.id}`}
                alt={anexo.nome}
                className="block max-h-64 max-w-[280px] object-cover"
              />
            </button>
          ))}
        </div>
      )}
      {documentos.length > 0 && (
        <ul className="flex flex-col gap-1">
          {documentos.map((anexo) => (
            <li key={anexo.id}>
              <button
                type="button"
                className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-sm border border-border px-1.5 py-1 text-xs text-foreground hover:border-primary/40 hover:bg-muted"
                onClick={() => abrirAnexo(anexo.id)}
              >
                <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{anexo.nome}</span>
                <span className="shrink-0 font-tabular text-muted-foreground">
                  {formatarTamanho(anexo.tamanhoKb)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
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

// Só usada como pílula (eventos SEM corpo) — eventos com corpo mostram o
// texto direto (ver render abaixo), não passam por aqui.
function descreverEvento(
  evento: TicketEvento,
  usuarioPorId: (id: string | null | undefined) => { nome: string } | undefined
): string {
  const autor = usuarioPorId(evento.autorId)?.nome ?? "Sistema"
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
    case "inicio":
      return `${autor} iniciou o atendimento`
    case "pausa":
      return `${autor} pausou o chamado`
    case "retomada":
      return `${autor} retomou o atendimento`
    case "categoria":
      return `${autor} atualizou as categorias`
    case "filho":
      return `${autor} criou o chamado filho #${evento.para}`
    case "conciliacao":
      return `${autor} conciliou o chamado #${evento.para} como duplicado`
    case "contato":
      return evento.corpo ?? `${autor} adicionou um contato ao chamado`
    case "mesa": {
      const de = evento.de
      return de ? `Mesa: ${de} → ${evento.para}` : `Mesa: ${evento.para}`
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
    case "inicio":
      return STATUS_META.em_andamento.icon
    case "pausa":
      return STATUS_META.pausado.icon
    case "retomada":
      return STATUS_META.em_andamento.icon
    case "categoria":
      return Tag
    case "filho":
      return Network
    case "conciliacao":
      return GitMerge
    case "contato":
      return Users
    case "mesa":
      return Tag
  }
}

// Eventos de status (incluindo inicio/pausa/retomada, que também mudam
// status_key) usam a cor do status de DESTINO — o resto do design já usa
// essas cores pra "estado atual do chamado", então reaproveitar aqui
// reforça a leitura em vez de introduzir uma paleta paralela.
function corEvento(evento: TicketEvento): string {
  switch (evento.tipo) {
    case "status":
    case "inicio":
    case "pausa":
    case "retomada":
      return STATUS_META[evento.para as StatusKey]?.colorVar ?? "muted-fg"
    // Não "status-a-fazer": vermelho em "chamado aberto" lê como erro, não como início.
    case "criado":
      return "primary"
    case "atribuicao":
    case "categoria":
    case "filho":
    case "contato":
    case "mesa":
      return "secondary"
    case "conciliacao":
      return "status-cancelado"
    // Preserva "roxo = evento administrativo" de antes, agora só aqui.
    case "prioridade":
      return "status-pausado"
  }
}

// Comentários e eventos de status na MESMA linha do tempo — separar em
// abas destrói a leitura de causa ("por que ficou parado 3h" está na
// costura entre os dois). Ver seção 2 do design.
export function TicketTimeline({ comentarios, eventos, anexos }: TicketTimelineProps) {
  const agora = useSlaClock()
  const { usuarioPorId, usuarioAtual } = useReferenceData()

  // Mais recente primeiro -- ordem pedida pelo usuário depois de ver a
  // timeline em uso (antes era crescente, mais antigo no topo).
  const linhas: ItemLinha[] = [
    ...comentarios.map((c): ItemLinha => ({ tipo: "comentario", data: c.criadoEm, item: c })),
    ...eventos.map((e): ItemLinha => ({ tipo: "evento", data: e.criadoEm, item: e })),
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  if (linhas.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-(--space-4) text-center text-sm text-muted-foreground">
        Nenhuma interação ainda.
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

          // Eventos com texto livre (iniciar/pausar/retomar/categoria)
          // renderizam como card de mensagem — mesma caixa de um
          // comentário, estilo Milvus — em vez da pílula compacta. Eventos
          // sem corpo (criado, status via Select, atribuição, prioridade
          // isolada) continuam como pílula.
          if (evento.corpo) {
            const autor = usuarioPorId(evento.autorId)
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
                  // rounded-r-md, não rounded-md, nos 3 cards com borda esquerda
                  // colorida desta timeline: com os 4 cantos arredondados, a curva
                  // do canto esquerdo mistura border-left com a cor cinza padrão dos
                  // outros lados, fazendo a faixa colorida parecer recuar do topo/
                  // base do card -- confirmado via getComputedStyle em runtime,
                  // border-left-width já cobria 100% da altura, só a curva do canto
                  // "comia" a cor nos ~5px finais de cada ponta.
                  className="flex flex-1 flex-col gap-1.5 rounded-r-md border border-border bg-surface p-(--space-3) text-sm"
                  style={{ borderLeftWidth: 4, borderLeftColor: `var(--${cor})` }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{autor?.nome ?? "Sistema"}</span>
                    <Tempo iso={evento.criadoEm} agora={agora} className="ml-auto text-xs text-muted-foreground" />
                  </div>
                  <p className="text-foreground">{evento.corpo}</p>
                </div>
              </li>
            )
          }

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
                className="flex flex-1 flex-wrap items-center gap-2 rounded-r-md border border-border bg-surface py-(--space-2) pr-(--space-3) pl-(--space-3) text-xs"
                style={{ borderLeftWidth: 4, borderLeftColor: `var(--${cor})` }}
              >
                <span className="text-foreground">{descreverEvento(evento, usuarioPorId)}</span>
                <Tempo iso={evento.criadoEm} agora={agora} className="ml-auto text-muted-foreground" />
              </div>
            </li>
          )
        }

        const comentario = linha.item
        const autor = usuarioPorId(comentario.autorId)
        const proprio = comentario.autorId === usuarioAtual?.id
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
                "flex flex-1 flex-col gap-1.5 rounded-r-md border border-border p-(--space-3) text-sm",
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

              {comentario.formato === "html" ? (
                // Seguro: corpo html só existe quando construído no servidor
                // por lib/comentario/render-html.ts a partir do JSON do
                // editor (C2) -- nunca HTML recebido direto do cliente.
                <div
                  className="prose-comentario text-foreground"
                  dangerouslySetInnerHTML={{ __html: comentario.corpo }}
                />
              ) : (
                <p className="whitespace-pre-wrap text-foreground">{comentario.corpo}</p>
              )}

              <AnexosDoComentario anexos={anexos.filter((a) => a.comentarioId === comentario.id)} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}
