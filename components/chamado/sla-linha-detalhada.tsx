"use client"

import { Pause } from "lucide-react"

import { calcularProgressoSla, type SlaTipo, type TicketSlaInfo } from "@/lib/sla-display"
import { useSlaClock } from "@/lib/sla-clock"
import { useReferenceData } from "@/lib/reference-data/provider"
import { SLA_SEVERIDADE_META } from "@/lib/status"
import type { Prioridade } from "@/lib/types"

interface SlaLinhaDetalhadaProps {
  rotulo: string
  ticket: TicketSlaInfo & { prioridade: Prioridade | null }
  tipo: SlaTipo
}

function formatarVencimento(iso: string) {
  // timeZone fixo -- mesmo cuidado de chamado-detalhe-client.tsx e
  // sla-clock.tsx: servidor e cliente em fusos diferentes gerariam texto
  // diferente e quebrariam a hidratação.
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

function formatarPrazoTotal(minutos: number) {
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return `${String(horas).padStart(2, "0")}:${String(resto).padStart(2, "0")}`
}

// Formato Milvus: "SLA Resposta • 18/08/2026 16:29 • 02:00" + barra + selo
// de pausa -- diferente da SlaProgress compacta (usada em linha de tabela e
// card), esta variante só aparece no painel lateral do detalhe.
export function SlaLinhaDetalhada({ rotulo, ticket, tipo }: SlaLinhaDetalhadaProps) {
  const agora = useSlaClock()
  const { slaPolicies } = useReferenceData()
  const venceEm = tipo === "resposta" ? ticket.slaRespostaVenceEm : ticket.slaSolucaoVenceEm

  const policy = slaPolicies.find((p) => p.prioridade === ticket.prioridade) ?? slaPolicies.find((p) => p.prioridade === null)
  const minutosPrazo = policy ? (tipo === "resposta" ? policy.minutosResposta : policy.minutosSolucao) : null

  if (!agora || !venceEm) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">SLA {rotulo}</span>
        <div className="h-2 w-full rounded-full bg-muted" />
      </div>
    )
  }

  const { percentual, severidade } = calcularProgressoSla(ticket, tipo, agora)
  const corVar = SLA_SEVERIDADE_META[severidade].colorVar
  const pausado = severidade === "pausado"

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          SLA {rotulo} <span aria-hidden="true">•</span> {formatarVencimento(venceEm)}
          {minutosPrazo !== null && (
            <>
              {" "}
              <span aria-hidden="true">•</span> {formatarPrazoTotal(minutosPrazo)}
            </>
          )}
        </span>
        {pausado && (
          <span title="SLA pausado" aria-label="SLA pausado">
            <Pause className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </span>
        )}
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`SLA ${rotulo}`}
        aria-valuenow={Math.round(percentual)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${percentual}%`, backgroundColor: `var(--${corVar})` }}
        />
      </div>
    </div>
  )
}
